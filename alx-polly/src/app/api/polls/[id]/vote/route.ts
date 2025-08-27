import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { VoteSchema } from '@/lib/validations/poll'
import { getUser, getClientIP } from '@/lib/utils/auth'
import type { Database } from '@/types/database'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/polls/[id]/vote - Submit a vote
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    const { id: pollId } = await params
    const user = await getUser(request)
    const clientIP = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || ''

    const body = await request.json()
    const { optionId } = VoteSchema.parse({ ...body, pollId })

    // Check if poll exists and is active
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('*')
      .eq('id', pollId)
      .single()

    if (pollError || !poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      )
    }

    if (!poll.is_active || new Date(poll.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Poll is no longer active' },
        { status: 400 }
      )
    }

    // Check if authentication is required
    if (poll.require_auth && !user) {
      return NextResponse.json(
        { error: 'Authentication required to vote' },
        { status: 401 }
      )
    }

    // Check for duplicate votes
    let existingVoteQuery = supabase
      .from('votes')
      .select('id')
      .eq('poll_id', pollId)

    if (user) {
      existingVoteQuery = existingVoteQuery.eq('user_id', user.id)
    } else {
      existingVoteQuery = existingVoteQuery.eq('ip_address', clientIP)
    }

    const { data: existingVote } = await existingVoteQuery.single()

    if (existingVote && !poll.allow_multiple_votes) {
      return NextResponse.json(
        { error: 'You have already voted in this poll' },
        { status: 400 }
      )
    }

    // Verify option belongs to poll
    const { data: option, error: optionError } = await supabase
      .from('poll_options')
      .select('id')
      .eq('id', optionId)
      .eq('poll_id', pollId)
      .single()

    if (optionError || !option) {
      return NextResponse.json(
        { error: 'Invalid option selected' },
        { status: 400 }
      )
    }

    // If multiple votes not allowed, delete existing vote
    if (existingVote && !poll.allow_multiple_votes) {
      await supabase
        .from('votes')
        .delete()
        .eq('id', existingVote.id)
    }

    // Insert new vote
    const { data: vote, error: voteError } = await supabase
      .from('votes')
      .insert({
        poll_id: pollId,
        option_id: optionId,
        user_id: user?.id || null,
        ip_address: clientIP,
        user_agent: userAgent,
      })
      .select()
      .single()

    if (voteError) {
      throw voteError
    }

    // Fetch updated poll with results
    const { data: updatedPoll } = await supabase
      .from('polls')
      .select(`
        *,
        poll_options(*),
        profiles(username, full_name)
      `)
      .eq('id', pollId)
      .single()

    // Add user's vote info to response
    if (user && updatedPoll) {
      const { data: userVote } = await supabase
        .from('votes')
        .select('*')
        .eq('poll_id', pollId)
        .eq('user_id', user.id)
        .single()
      
      // Type assertion since we're adding a custom property
      ;(updatedPoll as any).user_vote = userVote
    }

    return NextResponse.json({
      success: true,
      vote,
      poll: updatedPoll,
    })

  } catch (error) {
    console.error('Error submitting vote:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit vote' },
      { status: 500 }
    )
  }
}
