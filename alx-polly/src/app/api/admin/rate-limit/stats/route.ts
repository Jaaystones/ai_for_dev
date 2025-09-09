import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/utils/auth'
import { getRateLimitStatus, RATE_LIMIT_RULES } from '@/lib/rate-limit'

// GET /api/admin/rate-limit/stats - Get rate limiting statistics
export async function GET(request: NextRequest) {
  try {
    // Check if user is admin (you'll need to implement admin check)
    const user = await getUser(request)
    if (!user || !isUserAdmin(user)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Mock implementation - in production, you'd pull this from your rate limit store
    const stats = {
      totalRequests: 15420,
      blockedRequests: 234,
      uniqueIPs: 1250,
      topBlocked: [
        {
          ip: '192.168.1.100',
          rule: 'polls:vote',
          count: 25,
          limit: 10,
          remaining: 0,
          resetTime: Date.now() + 300000,
          blocked: true
        },
        {
          ip: '10.0.0.50',
          rule: 'polls:create',
          count: 8,
          limit: 5,
          remaining: 0,
          resetTime: Date.now() + 180000,
          blocked: true
        }
      ],
      recentActivity: [
        {
          ip: '203.0.113.1',
          rule: 'api:general',
          count: 45,
          limit: 100,
          remaining: 55,
          resetTime: Date.now() + 120000,
          blocked: false
        },
        {
          ip: '198.51.100.1',
          rule: 'polls:view',
          count: 35,
          limit: 50,
          remaining: 15,
          resetTime: Date.now() + 90000,
          blocked: false
        }
      ]
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching rate limit stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rate limit statistics' },
      { status: 500 }
    )
  }
}

// Helper function to check if user is admin
function isUserAdmin(user: any): boolean {
  // Implement your admin check logic here
  // This could check user roles, email domains, etc.
  return user.email?.endsWith('@admin.alxpolly.com') || 
         user.user_metadata?.role === 'admin' ||
         user.app_metadata?.role === 'admin'
}
