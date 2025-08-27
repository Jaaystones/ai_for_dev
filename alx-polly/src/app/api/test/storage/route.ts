import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

// Test API to check if storage bucket is accessible
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Test bucket access
    const { data, error } = await supabase.storage
      .from('avatars')
      .list('', {
        limit: 1
      })

    if (error) {
      return NextResponse.json({ 
        error: 'Storage bucket not accessible',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Storage bucket is accessible',
      user_id: session.user.id
    })

  } catch (error) {
    console.error('Storage test error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
