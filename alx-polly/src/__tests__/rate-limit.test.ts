import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { rateLimit, burstRateLimit, RATE_LIMIT_RULES } from '@/lib/rate-limit'
import { getClientIP } from '@/lib/utils/auth'

// Mock the auth utils
vi.mock('@/lib/utils/auth', () => ({
  getClientIP: vi.fn(() => '127.0.0.1')
}))

// Mock the config
vi.mock('@/lib/config', () => ({
  default: {
    rateLimiting: {
      enabled: true,
      strictMode: false,
      whitelistedIPs: [],
      burstProtection: {
        enabled: true,
        limit: 50,
        window: 10
      }
    }
  }
}))

describe('Rate Limiting', () => {
  let mockRequest: NextRequest

  beforeEach(() => {
    vi.clearAllMocks()
    mockRequest = new NextRequest('http://localhost:3000/api/test', {
      headers: {
        'x-forwarded-for': '127.0.0.1',
        'user-agent': 'test-agent'
      }
    })
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Basic Rate Limiting', () => {
    it('should allow requests within limit', async () => {
      const result = await rateLimit(mockRequest, 'polls:create')
      
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(4) // 5 - 1 = 4
      expect(result.limit).toBe(5)
    })

    it('should block requests when limit exceeded', async () => {
      // Make requests up to the limit
      for (let i = 0; i < 5; i++) {
        await rateLimit(mockRequest, 'polls:create')
      }

      // This should be blocked
      const result = await rateLimit(mockRequest, 'polls:create')
      
      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.error).toContain('Rate limit exceeded')
    })

    it('should reset after time window', async () => {
      vi.useFakeTimers()
      
      // Exhaust the limit
      for (let i = 0; i < 5; i++) {
        await rateLimit(mockRequest, 'polls:create')
      }

      // Should be blocked
      const blockedResult = await rateLimit(mockRequest, 'polls:create')
      expect(blockedResult.success).toBe(false)

      // Fast forward past the window (5 minutes + 1 second)
      vi.advanceTimersByTime(301000)

      // Should be allowed again
      const allowedResult = await rateLimit(mockRequest, 'polls:create')
      expect(allowedResult.success).toBe(true)
      expect(allowedResult.remaining).toBe(4)

      vi.useRealTimers()
    })

    it('should handle different rate limit rules', async () => {
      // Test voting limits (10 per minute)
      const voteResult = await rateLimit(mockRequest, 'polls:vote')
      expect(voteResult.limit).toBe(10)

      // Test creation limits (5 per 5 minutes)
      const createResult = await rateLimit(mockRequest, 'polls:create')
      expect(createResult.limit).toBe(5)

      // Test view limits (50 per minute)
      const viewResult = await rateLimit(mockRequest, 'polls:view')
      expect(viewResult.limit).toBe(50)
    })
  })

  describe('Burst Rate Limiting', () => {
    it('should allow requests within burst limit', async () => {
      const result = await burstRateLimit.checkBurst(mockRequest, 10, 5)
      
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(9) // 10 - 1 = 9
    })

    it('should block requests when burst limit exceeded', async () => {
      // Make requests up to burst limit
      for (let i = 0; i < 10; i++) {
        await burstRateLimit.checkBurst(mockRequest, 10, 5)
      }

      // This should be blocked
      const result = await burstRateLimit.checkBurst(mockRequest, 10, 5)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Burst limit exceeded')
    })
  })

  describe('IP-based Rate Limiting', () => {
    it('should track different IPs separately', async () => {
      const ip1Request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1' }
      })
      
      const ip2Request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.2' }
      })

      // Mock different IPs
      vi.mocked(getClientIP).mockReturnValueOnce('192.168.1.1')
      const result1 = await rateLimit(ip1Request, 'polls:create')
      
      vi.mocked(getClientIP).mockReturnValueOnce('192.168.1.2')
      const result2 = await rateLimit(ip2Request, 'polls:create')

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      expect(result1.remaining).toBe(4)
      expect(result2.remaining).toBe(4) // Fresh count for different IP
    })

    it('should create unique identifiers for users', async () => {
      const request1 = new NextRequest('http://localhost:3000/api/test', {
        headers: { 
          'x-forwarded-for': '127.0.0.1',
          'user-agent': 'Mozilla/5.0 Chrome'
        }
      })
      
      const request2 = new NextRequest('http://localhost:3000/api/test', {
        headers: { 
          'x-forwarded-for': '127.0.0.1',
          'user-agent': 'Mozilla/5.0 Firefox'
        }
      })

      const result1 = await rateLimit(request1, 'polls:vote')
      const result2 = await rateLimit(request2, 'polls:vote')

      // Different user agents should be treated as different users
      expect(result1.remaining).toBe(9)
      expect(result2.remaining).toBe(9)
    })
  })

  describe('Rate Limit Configuration', () => {
    it('should respect configured limits', () => {
      expect(RATE_LIMIT_RULES['polls:create'].requests).toBe(5)
      expect(RATE_LIMIT_RULES['polls:create'].window).toBe(300) // 5 minutes
      
      expect(RATE_LIMIT_RULES['polls:vote'].requests).toBe(10)
      expect(RATE_LIMIT_RULES['polls:vote'].window).toBe(60) // 1 minute
      
      expect(RATE_LIMIT_RULES['api:general'].requests).toBe(100)
      expect(RATE_LIMIT_RULES['api:general'].window).toBe(60) // 1 minute
    })

    it('should handle custom identifiers', async () => {
      const result1 = await rateLimit(mockRequest, 'polls:vote', 'user-123')
      const result2 = await rateLimit(mockRequest, 'polls:vote', 'user-456')

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      // Different custom identifiers should have separate limits
      expect(result1.remaining).toBe(9)
      expect(result2.remaining).toBe(9)
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed requests gracefully', async () => {
      const malformedRequest = new NextRequest('http://localhost:3000/api/test')
      
      const result = await rateLimit(malformedRequest, 'polls:vote')
      
      // Should still work with fallback IP
      expect(result.success).toBe(true)
    })

    it('should provide helpful error messages', async () => {
      // Exhaust the limit
      for (let i = 0; i < 5; i++) {
        await rateLimit(mockRequest, 'polls:create')
      }

      const result = await rateLimit(mockRequest, 'polls:create')
      
      expect(result.error).toBe('Rate limit exceeded. Max 5 requests per 300 seconds.')
      expect(result.resetTime).toBeGreaterThan(Date.now())
    })
  })

  describe('Memory Store', () => {
    it('should clean up expired entries', () => {
      vi.useFakeTimers()
      
      // This would normally be tested by calling the cleanup method
      // In a real test, you'd need to access the internal store
      
      vi.useRealTimers()
    })

    it('should handle concurrent requests', async () => {
      const promises = []
      
      // Make multiple concurrent requests
      for (let i = 0; i < 3; i++) {
        promises.push(rateLimit(mockRequest, 'polls:vote'))
      }

      const results = await Promise.all(promises)
      
      // All should succeed but with decreasing remaining counts
      results.forEach(result => {
        expect(result.success).toBe(true)
      })

      // Check that remaining counts are properly tracked
      expect(results[0].remaining).toBeGreaterThanOrEqual(7) // 10 - 3 = 7 minimum
    })
  })
})
