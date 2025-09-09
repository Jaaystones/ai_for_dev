import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/utils/auth'

// POST /api/admin/rate-limit/reset - Reset rate limits for a specific IP
export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const user = await getUser(request)
    if (!user || !isUserAdmin(user)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { ip } = body

    if (!ip) {
      return NextResponse.json(
        { error: 'IP address is required' },
        { status: 400 }
      )
    }

    // Reset rate limits for the IP
    // In a real implementation, you'd clear the rate limit store entries for this IP
    console.log(`Admin ${user.email} reset rate limits for IP: ${ip}`)

    // Mock implementation - in production, you'd actually clear the entries
    // rateLimitStore.clearIP(ip) or similar

    return NextResponse.json({
      success: true,
      message: `Rate limits reset for IP: ${ip}`,
      resetBy: user.email,
      resetAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error resetting rate limits:', error)
    return NextResponse.json(
      { error: 'Failed to reset rate limits' },
      { status: 500 }
    )
  }
}

// Helper function to check if user is admin
function isUserAdmin(user: any): boolean {
  return user.email?.endsWith('@admin.alxpolly.com') || 
         user.user_metadata?.role === 'admin' ||
         user.app_metadata?.role === 'admin'
}
