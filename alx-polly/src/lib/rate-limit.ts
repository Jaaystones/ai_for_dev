import { redis } from './redis';

// Types for Next.js compatibility
interface NextRequest {
  headers: Headers;
  url: string;
  method: string;
  ip?: string;
}

interface NextResponse {
  json: (body: unknown, init?: ResponseInit) => Response;
  headers: Headers;
}

// Rate limit configuration interface
export interface RateLimitConfig {
  requests: number;
  window: number; // in seconds
  message?: string;
}

// Rate limit rules for different endpoints
export const RATE_LIMIT_RULES: Record<string, RateLimitConfig> = {
  // General API endpoints
  'api:general': {
    requests: 100,
    window: 60, // 100 requests per minute
    message: 'Too many requests. Please try again later.'
  },
  
  // Poll creation (more restrictive)
  'api:polls:create': {
    requests: 10,
    window: 60, // 10 polls per minute
    message: 'Too many polls created. Please wait before creating another.'
  },
  
  // Voting (moderate restrictions)
  'api:polls:vote': {
    requests: 50,
    window: 60, // 50 votes per minute
    message: 'Too many votes. Please slow down.'
  },
  
  // Authentication
  'api:auth:login': {
    requests: 5,
    window: 300, // 5 login attempts per 5 minutes
    message: 'Too many login attempts. Please try again in 5 minutes.'
  },
  
  // Registration
  'api:auth:register': {
    requests: 3,
    window: 300, // 3 registration attempts per 5 minutes
    message: 'Too many registration attempts. Please try again later.'
  },
  
  // Password reset
  'api:auth:reset': {
    requests: 3,
    window: 900, // 3 reset attempts per 15 minutes
    message: 'Too many password reset attempts. Please try again later.'
  }
};

// Rate limit result interface
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  error?: string;
}

// Helper function to get client IP
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Fallback to localhost for development
  return '127.0.0.1';
}

// Redis-based rate limiting implementation
export class RedisRateLimit {
  private keyPrefix = 'ratelimit:';

  private getKey(identifier: string, ruleKey: string): string {
    return `${this.keyPrefix}${ruleKey}:${identifier}`;
  }

  async checkLimit(
    identifier: string,
    ruleKey: keyof typeof RATE_LIMIT_RULES
  ): Promise<RateLimitResult> {
    const rule = RATE_LIMIT_RULES[ruleKey];
    if (!rule) {
      throw new Error(`Rate limit rule not found: ${ruleKey}`);
    }

    const key = this.getKey(identifier, ruleKey);
    const now = Date.now();
    const window = rule.window * 1000; // Convert to milliseconds
    const resetTime = now + window;

    try {
      // Use Redis atomic operations
      const requestId = `${now}-${Math.random()}`;
      
      // Remove expired entries
      await redis.zremrangebyscore(key, 0, now - window);
      
      // Count current requests in window
      const currentCount = await redis.zcard(key);
      
      // Check if limit would be exceeded
      if (currentCount >= rule.requests) {
        return {
          success: false,
          limit: rule.requests,
          remaining: 0,
          resetTime,
          retryAfter: rule.window,
          error: rule.message
        };
      }
      
      // Add current request
      await redis.zadd(key, now, requestId);
      
      // Set expiration
      await redis.expire(key, rule.window);
      
      const remaining = Math.max(0, rule.requests - currentCount - 1);

      return {
        success: true,
        limit: rule.requests,
        remaining,
        resetTime,
        error: undefined
      };

    } catch (error) {
      console.error('Rate limit check error:', error);
      
      // Fallback: allow request but log error
      return {
        success: true,
        limit: rule.requests,
        remaining: rule.requests - 1,
        resetTime,
        error: 'Rate limit check failed, allowing request'
      };
    }
  }

  async getRemainingAttempts(
    identifier: string,
    ruleKey: keyof typeof RATE_LIMIT_RULES
  ): Promise<number> {
    const rule = RATE_LIMIT_RULES[ruleKey];
    if (!rule) {
      return 0;
    }

    const key = this.getKey(identifier, ruleKey);
    const now = Date.now();
    const window = rule.window * 1000;

    try {
      // Remove expired entries and count current requests
      await redis.zremrangebyscore(key, 0, now - window);
      const currentCount = await redis.zcard(key);
      
      return Math.max(0, rule.requests - currentCount);
    } catch (error) {
      console.error('Get remaining attempts error:', error);
      return rule.requests; // Fallback
    }
  }

  async resetLimit(
    identifier: string,
    ruleKey: keyof typeof RATE_LIMIT_RULES
  ): Promise<void> {
    const key = this.getKey(identifier, ruleKey);
    
    try {
      await redis.del(key);
    } catch (error) {
      console.error('Reset rate limit error:', error);
      throw error;
    }
  }

  async getStatus(
    identifier: string,
    ruleKey: keyof typeof RATE_LIMIT_RULES
  ): Promise<RateLimitResult> {
    const rule = RATE_LIMIT_RULES[ruleKey];
    if (!rule) {
      throw new Error(`Rate limit rule not found: ${ruleKey}`);
    }

    const key = this.getKey(identifier, ruleKey);
    const now = Date.now();
    const window = rule.window * 1000;

    try {
      // Remove expired entries and count current requests
      await redis.zremrangebyscore(key, 0, now - window);
      const currentCount = await redis.zcard(key);
      const remaining = Math.max(0, rule.requests - currentCount);
      
      return {
        success: currentCount < rule.requests,
        limit: rule.requests,
        remaining,
        resetTime: now + window
      };
    } catch (error) {
      console.error('Get rate limit status error:', error);
      
      return {
        success: true,
        limit: rule.requests,
        remaining: rule.requests,
        resetTime: now + window,
        error: 'Status check failed'
      };
    }
  }
}

// Global rate limiter instance
export const rateLimiter = new RedisRateLimit();

// Main rate limiting function
export async function rateLimit(
  request: NextRequest,
  ruleKey: keyof typeof RATE_LIMIT_RULES,
  customIdentifier?: string
): Promise<RateLimitResult> {
  const identifier = customIdentifier || getClientIP(request);
  return await rateLimiter.checkLimit(identifier, ruleKey);
}

// Rate limit middleware for API routes
export function withRateLimit(
  ruleKey: keyof typeof RATE_LIMIT_RULES,
  customIdentifier?: (request: NextRequest) => string
) {
      return function (handler: (request: NextRequest, ...args: unknown[]) => Promise<Response>) {
        return async function (request: NextRequest, ...args: unknown[]): Promise<Response> {
      try {
        const identifier = customIdentifier ? customIdentifier(request) : getClientIP(request);
        const result = await rateLimiter.checkLimit(identifier, ruleKey);

        if (!result.success) {
              return new Response(
            JSON.stringify({
              error: result.error || 'Rate limit exceeded',
              limit: result.limit,
              remaining: result.remaining,
              resetTime: result.resetTime,
              retryAfter: result.retryAfter
            }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'X-RateLimit-Limit': result.limit.toString(),
                'X-RateLimit-Remaining': result.remaining.toString(),
                'X-RateLimit-Reset': result.resetTime.toString(),
                'Retry-After': result.retryAfter?.toString() || '60'
              }
            }
          );
        }

        // Add rate limit headers to successful responses
        const response = await handler(request, ...args);
        
        response.headers.set('X-RateLimit-Limit', result.limit.toString());
        response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
        response.headers.set('X-RateLimit-Reset', result.resetTime.toString());

        return response;
      } catch (error) {
        console.error('Rate limit middleware error:', error);
        // If rate limiting fails, allow the request to proceed
        return await handler(request, ...args);
      }
    };
  };
}

// Burst protection for additional security
export class BurstProtection {
  private keyPrefix = 'burst:';

  private getKey(identifier: string): string {
    return `${this.keyPrefix}${identifier}`;
  }

  async checkBurst(
    request: NextRequest,
    maxRequests: number = 20,
    windowSeconds: number = 10
  ): Promise<RateLimitResult> {
    const identifier = getClientIP(request);
    const key = this.getKey(identifier);
    const now = Date.now();
    const window = windowSeconds * 1000;

    try {
      // Use Redis operations for burst protection
      const requestId = `${now}-${Math.random()}`;
      
      // Remove expired entries
      await redis.zremrangebyscore(key, 0, now - window);
      
      // Count current requests
      const currentCount = await redis.zcard(key);
      
      // Check if burst limit would be exceeded
      if (currentCount >= maxRequests) {
        return {
          success: false,
          limit: maxRequests,
          remaining: 0,
          resetTime: now + window,
          retryAfter: windowSeconds,
          error: 'Burst limit exceeded. Please slow down.'
        };
      }
      
      // Add current request
      await redis.zadd(key, now, requestId);
      
      // Set expiration
      await redis.expire(key, windowSeconds);
      
      const remaining = Math.max(0, maxRequests - currentCount - 1);

      return {
        success: true,
        limit: maxRequests,
        remaining,
        resetTime: now + window,
        error: undefined
      };

    } catch (error) {
      console.error('Burst protection error:', error);
      
      return {
        success: true,
        limit: maxRequests,
        remaining: maxRequests - 1,
        resetTime: now + window,
        error: 'Burst protection check failed'
      };
    }
  }
}

// Global burst protection instance
export const burstProtection = new BurstProtection();

// Helper function to apply both rate limiting and burst protection
export async function applyRateLimit(
  request: NextRequest,
  ruleKey: keyof typeof RATE_LIMIT_RULES,
  options?: {
    customIdentifier?: string;
    enableBurst?: boolean;
    burstMax?: number;
    burstWindow?: number;
  }
): Promise<RateLimitResult> {
  // Check burst protection first if enabled
  if (options?.enableBurst !== false) {
    const burstResult = await burstProtection.checkBurst(
      request,
      options?.burstMax || 20,
      options?.burstWindow || 10
    );
    
    if (!burstResult.success) {
      return burstResult;
    }
  }

  // Then check normal rate limit
  return await rateLimit(request, ruleKey, options?.customIdentifier);
}

// Utility function to get rate limit status without incrementing counter
export async function getRateLimitStatus(
  request: NextRequest,
  ruleKey: keyof typeof RATE_LIMIT_RULES,
  customIdentifier?: string
): Promise<RateLimitResult> {
  const identifier = customIdentifier || getClientIP(request);
  return await rateLimiter.getStatus(identifier, ruleKey);
}

// Utility function to reset rate limit for a specific identifier
export async function resetRateLimit(
  identifier: string,
  ruleKey: keyof typeof RATE_LIMIT_RULES
): Promise<void> {
  await rateLimiter.resetLimit(identifier, ruleKey);
}
