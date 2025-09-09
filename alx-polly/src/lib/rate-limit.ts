import { NextRequest } from 'next/server'
import { getClientIP } from '@/lib/utils/auth'
import { redisCache } from '@/lib/redis'

// Rate limit configuration
interface RateLimitConfig {
  requests: number; // Number of requests allowed
  window: number;   // Time window in seconds
  message?: string; // Custom error message
  useSliding?: boolean; // Use sliding window algorithm
}

// Rate limit rules for different endpoints
export const RATE_LIMIT_RULES: Record<string, RateLimitConfig> = {
  // General API limits
  'api:general': { requests: 100, window: 60, useSliding: true }, // 100 requests per minute
  
  // Poll operations
  'polls:create': { requests: 5, window: 300 }, // 5 polls per 5 minutes
  'polls:vote': { requests: 10, window: 60, useSliding: true }, // 10 votes per minute
  'polls:view': { requests: 50, window: 60, useSliding: true }, // 50 poll views per minute
  
  // Authentication
  'auth:login': { requests: 5, window: 300 }, // 5 login attempts per 5 minutes
  'auth:register': { requests: 3, window: 3600 }, // 3 registrations per hour
  
  // File uploads
  'upload:avatar': { requests: 3, window: 300 }, // 3 avatar uploads per 5 minutes
  
  // Analytics
  'analytics:view': { requests: 100, window: 300, useSliding: true }, // 100 analytics requests per 5 minutes
  
  // Admin operations
  'admin:dashboard': { requests: 50, window: 60 }, // 50 admin requests per minute
  'admin:reset-limits': { requests: 10, window: 300 }, // 10 reset operations per 5 minutes
} as const

// Redis-based rate limiting with fixed window algorithm
class RedisRateLimitStore {
  private keyPrefix = 'ratelimit:';

  private getKey(identifier: string): string {
    return `${this.keyPrefix}${identifier}`
  }

  async increment(key: string, windowSeconds: number): Promise<{ count: number; ttl: number }> {
    const redisKey = this.getKey(key)
    
    try {
      // Increment the counter and set TTL if this is the first request
      const count = await redisCache.increment(redisKey, windowSeconds)
      
      // Get TTL for reset time calculation
      const { ttl } = await redisCache.getRateLimitInfo(redisKey)
      
      return { count, ttl }
    } catch (error) {
      console.error('Redis rate limit increment error:', error)
      // Fallback: allow the request
      return { count: 1, ttl: windowSeconds }
    }
  }

  async get(key: string): Promise<{ count: number; ttl: number } | null> {
    const redisKey = this.getKey(key)
    
    try {
      const info = await redisCache.getRateLimitInfo(redisKey)
      
      if (info.count === 0) {
        return null
      }
      
      return info
    } catch (error) {
      console.error('Redis rate limit get error:', error)
      return null
    }
  }

  async reset(key: string): Promise<boolean> {
    const redisKey = this.getKey(key)
    return await redisCache.del(redisKey)
  }

  async getStatus(key: string): Promise<{ count: number; resetTime: number } | null> {
    const redisKey = this.getKey(key)
    
    try {
      const info = await redisCache.getRateLimitInfo(redisKey)
      
      if (info.count === 0) {
        return null
      }
      
      return {
        count: info.count,
        resetTime: Date.now() + (info.ttl * 1000)
      }
    } catch (error) {
      console.error('Redis rate limit status error:', error)
      return null
    }
  }
}

// Global Redis-based rate limit store
const rateLimitStore = new RedisRateLimitStore()

// Rate limit result interface
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  error?: string;
}

// Main rate limiting function
export async function rateLimit(
  request: NextRequest,
  ruleKey: keyof typeof RATE_LIMIT_RULES,
  customIdentifier?: string
): Promise<RateLimitResult> {
  const rule = RATE_LIMIT_RULES[ruleKey]
  
  // Create identifier (IP + endpoint + optional custom identifier)
  const ip = getClientIP(request)
  const userAgent = request.headers.get('user-agent') || ''
  const fingerprint = Buffer.from(`${ip}:${userAgent.slice(0, 50)}`).toString('base64')
  const identifier = customIdentifier 
    ? `${fingerprint}:${ruleKey}:${customIdentifier}`
    : `${fingerprint}:${ruleKey}`
  
  try {
    // Use sliding window for specific rules, fixed window for others
    if (rule.useSliding) {
      const result = await redisCache.slidingWindowRateLimit(
        `sliding:${identifier}`,
        rule.requests,
        rule.window
      )
      
      return {
        success: result.allowed,
        limit: rule.requests,
        remaining: result.remaining,
        resetTime: result.resetTime,
        error: result.allowed ? undefined : rule.message || `Rate limit exceeded. Max ${rule.requests} requests per ${rule.window} seconds.`
      }
    } else {
      // Fixed window rate limiting
      const { count, ttl } = await rateLimitStore.increment(identifier, rule.window)
      const resetTime = Date.now() + (ttl * 1000)
      
      // Check if limit exceeded
      if (count > rule.requests) {
        return {
          success: false,
          limit: rule.requests,
          remaining: 0,
          resetTime,
          error: rule.message || `Rate limit exceeded. Max ${rule.requests} requests per ${rule.window} seconds.`
        }
      }
      
      return {
        success: true,
        limit: rule.requests,
        remaining: rule.requests - count,
        resetTime
      }
    }
  } catch (error) {
    console.error('Rate limiting error:', error)
    // Fallback: allow the request on Redis error
    return {
      success: true,
      limit: rule.requests,
      remaining: rule.requests - 1,
      resetTime: Date.now() + (rule.window * 1000)
    }
  }
}

// Rate limit middleware for API routes
export function withRateLimit(
  ruleKey: keyof typeof RATE_LIMIT_RULES, 
  customIdentifier?: (request: NextRequest) => string 
) {
  return function (handler: Function) {
    return async function (request: NextRequest, ...args: any[]) {
      const identifier = customIdentifier ? customIdentifier(request) : undefined
      const result = await rateLimit(request, ruleKey, identifier)
      
      if (!result.success) {
        return new Response(
          JSON.stringify({ 
            error: result.error,
            rateLimitExceeded: true,
            limit: result.limit,
            resetTime: result.resetTime
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': result.limit.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
              'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
            }
          }
        )
      }
      
      // Add rate limit headers to successful responses
      const response = await handler(request, ...args)
      
      if (response instanceof Response) {
        response.headers.set('X-RateLimit-Limit', result.limit.toString())
        response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
        response.headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString())
      }
      
      return response
    }
  }
}

// Advanced rate limiting with burst protection
export class BurstRateLimit {
  private keyPrefix = 'burst:';
  
  async checkBurst(
    request: NextRequest,
    burstLimit: number,
    burstWindow: number // in seconds
  ): Promise<RateLimitResult> {
    const ip = getClientIP(request)
    const identifier = `${this.keyPrefix}${ip}`
    
    try {
      // Use Redis sliding window for burst protection
      const result = await redisCache.slidingWindowRateLimit(
        identifier,
        burstLimit,
        burstWindow
      )
      
      return {
        success: result.allowed,
        limit: burstLimit,
        remaining: result.remaining,
        resetTime: result.resetTime,
        error: result.allowed ? undefined : `Burst limit exceeded. Max ${burstLimit} requests in ${burstWindow} seconds.`
      }
    } catch (error) {
      console.error('Burst rate limit error:', error)
      // Fallback: allow the request on Redis error
      return {
        success: true,
        limit: burstLimit,
        remaining: burstLimit - 1,
        resetTime: Date.now() + (burstWindow * 1000)
      }
    }
  }
}

// Global burst rate limiter
export const burstRateLimit = new BurstRateLimit()

// Helper function to get rate limit status for an IP
export async function getRateLimitStatus(
  ip: string,
  ruleKey: keyof typeof RATE_LIMIT_RULES
): Promise<RateLimitResult> {
  const rule = RATE_LIMIT_RULES[ruleKey]
  const identifier = `${ip}:${ruleKey}`
  
  try {
    const current = await rateLimitStore.getStatus(identifier)
    
    if (!current) {
      return {
        success: true,
        limit: rule.requests,
        remaining: rule.requests,
        resetTime: Date.now() + (rule.window * 1000)
      }
    }
    
    return {
      success: current.count <= rule.requests,
      limit: rule.requests,
      remaining: Math.max(0, rule.requests - current.count),
      resetTime: current.resetTime
    }
  } catch (error) {
    console.error('Get rate limit status error:', error)
    // Fallback response
    return {
      success: true,
      limit: rule.requests,
      remaining: rule.requests,
      resetTime: Date.now() + (rule.window * 1000)
    }
  }
}

// Rate limit types for TypeScript
export type RateLimitRule = keyof typeof RATE_LIMIT_RULES
export type RateLimitMiddleware = ReturnType<typeof withRateLimit>
