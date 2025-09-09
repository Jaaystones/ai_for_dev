import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, burstRateLimit, RATE_LIMIT_RULES } from '@/lib/rate-limit'
import { isWhitelistedIP, getClientIP } from '@/lib/utils/auth'
import config from '@/lib/config'

// Rate limit middleware factory
export function withRateLimit(ruleKey: keyof typeof RATE_LIMIT_RULES) {
  return function middleware(handler: Function) {
    return async function(request: NextRequest, ...args: any[]) {
      // Skip rate limiting if disabled or IP is whitelisted
      if (!config.rateLimiting.enabled || isWhitelistedIP(getClientIP(request))) {
        return handler(request, ...args)
      }

      try {
        // Apply burst protection if enabled
        if (config.rateLimiting.burstProtection.enabled) {
          const burstResult = await burstRateLimit.checkBurst(
            request,
            config.rateLimiting.burstProtection.limit,
            config.rateLimiting.burstProtection.window
          )
          
          if (!burstResult.success) {
            return NextResponse.json(
              { 
                error: burstResult.error,
                rateLimitExceeded: true,
                type: 'burst',
                limit: burstResult.limit,
                remaining: burstResult.remaining,
                resetTime: burstResult.resetTime
              },
              { 
                status: 429,
                headers: {
                  'Content-Type': 'application/json',
                  'X-RateLimit-Type': 'burst',
                  'X-RateLimit-Limit': burstResult.limit.toString(),
                  'X-RateLimit-Remaining': burstResult.remaining.toString(),
                  'X-RateLimit-Reset': Math.ceil(burstResult.resetTime / 1000).toString(),
                  'Retry-After': Math.ceil((burstResult.resetTime - Date.now()) / 1000).toString()
                }
              }
            )
          }
        }

        // Apply standard rate limiting
        const rateLimitResult = await rateLimit(request, ruleKey)
        
        if (!rateLimitResult.success) {
          return NextResponse.json(
            { 
              error: rateLimitResult.error,
              rateLimitExceeded: true,
              type: 'standard',
              limit: rateLimitResult.limit,
              remaining: rateLimitResult.remaining,
              resetTime: rateLimitResult.resetTime
            },
            { 
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'X-RateLimit-Type': 'standard',
                'X-RateLimit-Limit': rateLimitResult.limit.toString(),
                'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
                'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime / 1000).toString(),
                'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
              }
            }
          )
        }

        // Call the original handler
        const response = await handler(request, ...args)
        
        // Add rate limit headers to successful responses
        if (response instanceof NextResponse) {
          response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString())
          response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
          response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimitResult.resetTime / 1000).toString())
        }
        
        return response
      } catch (error) {
        console.error('Rate limiting error:', error)
        
        // If rate limiting fails, continue with the request in non-strict mode
        if (!config.rateLimiting.strictMode) {
          console.warn('Rate limiting failed, continuing with request')
          return handler(request, ...args)
        }
        
        // In strict mode, fail the request
        return NextResponse.json(
          { error: 'Rate limiting service unavailable' },
          { status: 503 }
        )
      }
    }
  }
}

// Specific middleware for common operations
export const withPollCreateRateLimit = withRateLimit('polls:create')
export const withPollVoteRateLimit = withRateLimit('polls:vote')
export const withPollViewRateLimit = withRateLimit('polls:view')
export const withAuthRateLimit = withRateLimit('auth:login')
export const withUploadRateLimit = withRateLimit('upload:avatar')
export const withGeneralAPIRateLimit = withRateLimit('api:general')

// Utility function to handle rate limit responses consistently
export function createRateLimitResponse(
  error: string,
  type: 'burst' | 'standard',
  limit: number,
  remaining: number,
  resetTime: number
): NextResponse {
  return NextResponse.json(
    { 
      error,
      rateLimitExceeded: true,
      type,
      limit,
      remaining,
      resetTime
    },
    { 
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Type': type,
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
        'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString()
      }
    }
  )
}

// Rate limit error types for type safety
export interface RateLimitError {
  error: string
  rateLimitExceeded: true
  type: 'burst' | 'standard'
  limit: number
  remaining: number
  resetTime: number
}
