import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { CreatePollSchema } from '@/lib/validations/poll'
import { getUser, getClientIP } from '@/lib/utils/auth'
import type { Database } from '@/types/database'

// GET /api/polls - Fetch all polls with pagination
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') // 'active', 'expired', 'all'
    const userId = searchParams.get('userId') // filter by creator

    let query = supabase
      .from('polls')
      .select(`
        *,
        poll_options(*),
        profiles(username, full_name)
      `)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    // Apply filters
    if (status === 'active') {
      query = query.eq('is_active', true).gt('expires_at', new Date().toISOString())
    } else if (status === 'expired') {
      query = query.or('is_active.eq.false,expires_at.lt.' + new Date().toISOString())
    }

    if (userId) {
      query = query.eq('created_by', userId)
    }

    const { data: polls, error, count } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      polls: polls || [],
      total: count || 0,
      page,
      limit
    })
  } catch (error) {
    console.error('Error fetching polls:', error)
    return NextResponse.json(
      { error: 'Failed to fetch polls' },
      { status: 500 }
    )
  }
}

// POST /api/polls - Create a new poll
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = CreatePollSchema.parse(body)

    // Calculate expiry time
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + validatedData.expiresIn)

    // Start transaction
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({
        title: validatedData.title,
        description: validatedData.description,
        created_by: user.id,
        expires_at: expiresAt.toISOString(),
        allow_multiple_votes: validatedData.allowMultipleVotes,
        require_auth: validatedData.requireAuth,
      })
      .select()
      .single()

    if (pollError) {
      throw pollError
    }

    // Create poll options
    const optionsToInsert = validatedData.options.map((text, index) => ({
      poll_id: poll.id,
      text,
      order_index: index,
    }))

    const { error: optionsError } = await supabase
      .from('poll_options')
      .insert(optionsToInsert)

    if (optionsError) {
      // Rollback poll creation
      await supabase.from('polls').delete().eq('id', poll.id)
      throw optionsError
    }

    // Generate QR code (you'll implement this)
    const qrCodeUrl = await generateQRCode(`${process.env.NEXT_PUBLIC_APP_URL}/polls/${poll.id}`)
    
    // Update poll with QR code URL
    if (qrCodeUrl) {
      await supabase
        .from('polls')
        .update({ qr_code_url: qrCodeUrl })
        .eq('id', poll.id)
    }

    // Fetch complete poll data
    const { data: completePoll } = await supabase
      .from('polls')
      .select(`
        *,
        poll_options(*),
        profiles(username, full_name)
      `)
      .eq('id', poll.id)
      .single()

    return NextResponse.json({
      poll: completePoll,
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating poll:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create poll' },
      { status: 500 }
    )
  }
}

// Helper function to generate QR code (placeholder)
async function generateQRCode(url: string): Promise<string | null> {
  // TODO: Implement QR code generation using a service like QR Server API
  // or a library like 'qrcode'
  try {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`
    return qrUrl
  } catch (error) {
    console.error('Error generating QR code:', error)
    return null
  }
}
