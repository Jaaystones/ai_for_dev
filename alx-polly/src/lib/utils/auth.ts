import { NextRequest } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase/client'

// Helper function to get authenticated user
export async function getUser(request: NextRequest) {
  try {
    const supabase = createSupabaseClient()
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return null
    }

    return user
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

// Helper function to get client IP
export function getClientIP(request: NextRequest): string {
  // Try various headers for IP address
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  if (cfConnectingIP) {
    return cfConnectingIP
  }

  // Fallback
  return '127.0.0.1'
}

// Helper function to validate poll access
export async function validatePollAccess(pollId: string, userId?: string) {
  const supabase = createSupabaseClient()
  const { data: poll, error } = await supabase
    .from('polls')
    .select('*')
    .eq('id', pollId)
    .single()

  if (error || !poll) {
    return { valid: false, error: 'Poll not found' }
  }

  if (!poll.is_active || new Date(poll.expires_at) < new Date()) {
    return { valid: false, error: 'Poll is no longer active' }
  }

  if (poll.require_auth && !userId) {
    return { valid: false, error: 'Authentication required' }
  }

  return { valid: true, poll }
}
