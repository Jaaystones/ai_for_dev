import Redis from 'ioredis';

// Redis client singleton
let redis: Redis | null = null;

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  retryDelayOnFailover: number;
  maxRetriesPerRequest: number;
  lazyConnect: boolean;
}

const getRedisConfig = (): RedisConfig => {
  const config: RedisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  };

  if (process.env.REDIS_PASSWORD) {
    config.password = process.env.REDIS_PASSWORD;
  }

  if (process.env.REDIS_DB) {
    config.db = parseInt(process.env.REDIS_DB);
  }

  return config;
};

export const getRedisClient = (): Redis => {
  if (!redis) {
    const config = getRedisConfig();
    redis = new Redis(config);

    redis.on('error', (error) => {
      console.error('Redis connection error:', error);
    });

    redis.on('connect', () => {
      console.log('Connected to Redis');
    });

    redis.on('ready', () => {
      console.log('Redis client ready');
    });
  }

  return redis;
};

export const closeRedisConnection = async (): Promise<void> => {
  if (redis) {
    await redis.quit();
    redis = null;
  }
};

// Redis cache helper functions
export class RedisCache {
  private client: Redis;

  constructor() {
    this.client = getRedisClient();
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    try {
      const serializedValue = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis del error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  async increment(key: string, ttlSeconds?: number): Promise<number> {
    try {
      const result = await this.client.incr(key);
      if (ttlSeconds && result === 1) {
        await this.client.expire(key, ttlSeconds);
      }
      return result;
    } catch (error) {
      console.error('Redis increment error:', error);
      throw error;
    }
  }

  async getMultiple<T>(keys: string[]): Promise<Record<string, T | null>> {
    try {
      const values = await this.client.mget(...keys);
      const result: Record<string, T | null> = {};
      
      keys.forEach((key, index) => {
        const value = values[index];
        result[key] = value ? JSON.parse(value) : null;
      });
      
      return result;
    } catch (error) {
      console.error('Redis getMultiple error:', error);
      return {};
    }
  }

  async setMultiple<T>(data: Record<string, T>, ttlSeconds?: number): Promise<boolean> {
    try {
      const pipeline = this.client.pipeline();
      
      Object.entries(data).forEach(([key, value]) => {
        const serializedValue = JSON.stringify(value);
        if (ttlSeconds) {
          pipeline.setex(key, ttlSeconds, serializedValue);
        } else {
          pipeline.set(key, serializedValue);
        }
      });
      
      await pipeline.exec();
      return true;
    } catch (error) {
      console.error('Redis setMultiple error:', error);
      return false;
    }
  }

  async flush(): Promise<boolean> {
    try {
      await this.client.flushdb();
      return true;
    } catch (error) {
      console.error('Redis flush error:', error);
      return false;
    }
  }

  async getKeys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      console.error('Redis getKeys error:', error);
      return [];
    }
  }

  // Rate limiting specific methods
  async getRateLimitInfo(key: string): Promise<{ count: number; ttl: number }> {
    try {
      const pipeline = this.client.pipeline();
      pipeline.get(key);
      pipeline.ttl(key);
      
      const results = await pipeline.exec();
      const count = results?.[0]?.[1] ? parseInt(results[0][1] as string) : 0;
      const ttl = results?.[1]?.[1] as number || 0;
      
      return { count, ttl };
    } catch (error) {
      console.error('Redis getRateLimitInfo error:', error);
      return { count: 0, ttl: 0 };
    }
  }

  async slidingWindowRateLimit(
    key: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    try {
      const now = Date.now();
      const windowStart = now - (windowSeconds * 1000);
      
      // Use sorted set for sliding window
      const pipeline = this.client.pipeline();
      
      // Remove expired entries
      pipeline.zremrangebyscore(key, 0, windowStart);
      
      // Count current requests
      pipeline.zcard(key);
      
      // Add current request
      pipeline.zadd(key, now, `${now}-${Math.random()}`);
      
      // Set expiration
      pipeline.expire(key, windowSeconds);
      
      const results = await pipeline.exec();
      const currentCount = (results?.[1]?.[1] as number) || 0;
      
      const allowed = currentCount < limit;
      const remaining = Math.max(0, limit - currentCount - 1);
      const resetTime = now + (windowSeconds * 1000);
      
      if (!allowed) {
        // Remove the request we just added if not allowed
        await this.client.zpopmax(key);
      }
      
      return { allowed, remaining, resetTime };
    } catch (error) {
      console.error('Redis slidingWindowRateLimit error:', error);
      // Fallback to allow request on Redis error
      return { allowed: true, remaining: limit - 1, resetTime: Date.now() + (windowSeconds * 1000) };
    }
  }
}

export const redisCache = new RedisCache();
