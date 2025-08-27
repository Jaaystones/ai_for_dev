import { useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Poll } from '@/types/database'

export function usePollRealtime(pollId: string) {
  const [poll, setPoll] = useState<Poll | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createSupabaseClient()
    
    // Initial fetch
    const fetchPoll = async () => {
      try {
        const { data, error } = await supabase
          .from('polls')
          .select(`
            *,
            poll_options(*),
            profiles(username, full_name)
          `)
          .eq('id', pollId)
          .single()

        if (error) throw error
        setPoll(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch poll')
      } finally {
        setLoading(false)
      }
    }

    fetchPoll()

    // Set up real-time subscription for votes
    const votesSubscription = supabase
      .channel(`poll-votes-${pollId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `poll_id=eq.${pollId}`,
        },
        () => {
          // Refetch poll data when votes change
          fetchPoll()
        }
      )
      .subscribe()

    // Set up real-time subscription for poll options (vote counts)
    const optionsSubscription = supabase
      .channel(`poll-options-${pollId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'poll_options',
          filter: `poll_id=eq.${pollId}`,
        },
        () => {
          fetchPoll()
        }
      )
      .subscribe()

    // Set up real-time subscription for poll updates
    const pollSubscription = supabase
      .channel(`poll-${pollId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'polls',
          filter: `id=eq.${pollId}`,
        },
        (payload) => {
          setPoll(current => current ? { ...current, ...payload.new } : null)
        }
      )
      .subscribe()

    return () => {
      votesSubscription.unsubscribe()
      optionsSubscription.unsubscribe()
      pollSubscription.unsubscribe()
    }
  }, [pollId])

  return { poll, loading, error, refetch: () => setPoll(null) }
}

export function usePollsRealtime(filters?: { userId?: string; status?: 'active' | 'expired' }) {
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPolls = async () => {
    try {
      const supabase = createSupabaseClient()
      let query = supabase
        .from('polls')
        .select(`
          *,
          poll_options(*),
          profiles(username, full_name)
        `)
        .order('created_at', { ascending: false })

      if (filters?.userId) {
        query = query.eq('created_by', filters.userId)
      }

      if (filters?.status === 'active') {
        query = query.eq('is_active', true).gt('expires_at', new Date().toISOString())
      } else if (filters?.status === 'expired') {
        query = query.or('is_active.eq.false,expires_at.lt.' + new Date().toISOString())
      }

      const { data, error } = await query

      if (error) throw error
      setPolls(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch polls')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const supabase = createSupabaseClient()
    fetchPolls()

    // Set up real-time subscription for new polls
    const subscription = supabase
      .channel('polls-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'polls',
        },
        () => {
          fetchPolls()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [filters?.userId, filters?.status])

  return { polls, loading, error, refetch: fetchPolls }
}
