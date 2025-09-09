import { createClient, RedisClientType } from 'redis'
import config from '@/lib/config'

// Redis store implementation for production rate limiting
export class RedisRateLimitStore {
  private client: RedisClientType | null = null
  private connected = false

  constructor() {
    if (config.rateLimiting.store === 'redis' && config.rateLimiting.redisUrl) {
      this.initRedis()
    }
  }

  private async initRedis() {
    try {
      this.client = createClient({
        url: config.rateLimiting.redisUrl,
        socket: {
          reconnectStrategy: (retries) => Math.min(retries * 50, 1000)
        }
      })

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err)
        this.connected = false
      })

      this.client.on('connect', () => {
        console.log('Redis Client Connected')
        this.connected = true
      })

      await this.client.connect()
    } catch (error) {
      console.error('Failed to initialize Redis:', error)
      this.connected = false
    }
  }

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    if (!this.connected || !this.client) return null

    try {
      const data = await this.client.hGetAll(key)
      if (!data.count || !data.resetTime) return null

      const count = parseInt(data.count)
      const resetTime = parseInt(data.resetTime)

      // Check if window has expired
      if (Date.now() > resetTime) {
        await this.client.del(key)
        return null
      }

      return { count, resetTime }
    } catch (error) {
      console.error('Redis GET error:', error)
      return null
    }
  }

  async set(key: string, count: number, windowMs: number): Promise<void> {
    if (!this.connected || !this.client) return

    try {
      const resetTime = Date.now() + windowMs
      const ttl = Math.ceil(windowMs / 1000)

      await this.client.multi()
        .hSet(key, {
          count: count.toString(),
          resetTime: resetTime.toString()
        })
        .expire(key, ttl)
        .exec()
    } catch (error) {
      console.error('Redis SET error:', error)
    }
  }

  async increment(key: string, windowMs: number): Promise<number> {
    if (!this.connected || !this.client) {
      // Fallback to in-memory if Redis is not available
      return 1
    }

    try {
      const existing = await this.get(key)
      
      if (!existing) {
        await this.set(key, 1, windowMs)
        return 1
      }
      
      const newCount = existing.count + 1
      await this.set(key, newCount, windowMs)
      return newCount
    } catch (error) {
      console.error('Redis INCREMENT error:', error)
      return 1
    }
  }

  async cleanup(): Promise<void> {
    // Redis handles TTL automatically, but we can implement additional cleanup if needed
    if (!this.connected || !this.client) return

    try {
      // Get all rate limit keys and check for expired ones
      const keys = await this.client.keys('*:polls:*')
      const now = Date.now()
      
      for (const key of keys) {
        const data = await this.client.hGetAll(key)
        if (data.resetTime && parseInt(data.resetTime) < now) {
          await this.client.del(key)
        }
      }
    } catch (error) {
      console.error('Redis CLEANUP error:', error)
    }
  }

  async isHealthy(): Promise<boolean> {
    if (!this.client) return false
    
    try {
      await this.client.ping()
      return true
    } catch {
      return false
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect()
      this.connected = false
    }
  }
}

// Singleton Redis store
let redisStore: RedisRateLimitStore | null = null

export function getRedisRateLimitStore(): RedisRateLimitStore {
  if (!redisStore) {
    redisStore = new RedisRateLimitStore()
  }
  return redisStore
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (redisStore) {
    await redisStore.disconnect()
  }
})

process.on('SIGINT', async () => {
  if (redisStore) {
    await redisStore.disconnect()
  }
})
