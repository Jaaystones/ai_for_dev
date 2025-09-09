import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/utils/auth'
import { getRateLimitStatus } from '@/lib/rate-limit'

// GET /api/admin/rate-limit/status?ip=x.x.x.x - Get rate limit status for specific IP
export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const user = await getUser(request)
    if (!user || !isUserAdmin(user)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const ip = searchParams.get('ip')

    if (!ip) {
      return NextResponse.json(
        { error: 'IP address is required' },
        { status: 400 }
      )
    }

    // Check rate limit status for different rules
    const statuses = {
      'api:general': getRateLimitStatus(ip, 'api:general'),
      'polls:create': getRateLimitStatus(ip, 'polls:create'),
      'polls:vote': getRateLimitStatus(ip, 'polls:vote'),
      'polls:view': getRateLimitStatus(ip, 'polls:view'),
    }

    // Find the most restrictive status
    const mostRestrictive = Object.entries(statuses).reduce((prev, [rule, status]) => {
      if (!status) return prev
      if (!prev || status.remaining < prev.remaining) {
        return { ...status, rule }
      }
      return prev
    }, null)

    if (!mostRestrictive) {
      return NextResponse.json({
        ip,
        rule: 'none',
        count: 0,
        limit: 0,
        remaining: 0,
        resetTime: Date.now(),
        blocked: false
      })
    }

    return NextResponse.json({
      ip,
      ...mostRestrictive,
      blocked: !mostRestrictive.success
    })
  } catch (error) {
    console.error('Error checking IP status:', error)
    return NextResponse.json(
      { error: 'Failed to check IP status' },
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
