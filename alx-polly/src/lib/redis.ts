import { createClient, RedisClientType } from 'redis';

// Redis client configuration
class RedisClient {
  private client: RedisClientType | null = null;
  private isConnecting = false;

  async getClient(): Promise<RedisClientType> {
    if (this.client && this.client.isOpen) {
      return this.client;
    }

    if (this.isConnecting) {
      // Wait for connection to complete
      while (this.isConnecting) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (this.client && this.client.isOpen) {
        return this.client;
      }
    }

    this.isConnecting = true;

    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.client = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 10000,
          lazyConnect: true,
          reconnectStrategy: (retries) => {
            if (retries > 3) {
              console.error('Redis connection failed after 3 retries');
              return false;
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });

      this.client.on('connect', () => {
        console.log('Redis client connected');
      });

      this.client.on('ready', () => {
        console.log('Redis client ready');
      });

      this.client.on('end', () => {
        console.log('Redis client connection ended');
      });

      await this.client.connect();
      this.isConnecting = false;
      return this.client;
    } catch (error) {
      this.isConnecting = false;
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.client.isOpen) {
      await this.client.disconnect();
      this.client = null;
    }
  }

  // Utility methods
  async get(key: string): Promise<string | null> {
    try {
      const client = await this.getClient();
      return await client.get(key);
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  async set(key: string, value: string, options?: { EX?: number; PX?: number }): Promise<boolean> {
    try {
      const client = await this.getClient();
      const result = await client.set(key, value, options);
      return result === 'OK';
    } catch (error) {
      console.error('Redis SET error:', error);
      return false;
    }
  }

  async incr(key: string): Promise<number> {
    try {
      const client = await this.getClient();
      return await client.incr(key);
    } catch (error) {
      console.error('Redis INCR error:', error);
      return 0;
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const client = await this.getClient();
      return await client.expire(key, seconds);
    } catch (error) {
      console.error('Redis EXPIRE error:', error);
      return false;
    }
  }

  async del(key: string): Promise<number> {
    try {
      const client = await this.getClient();
      return await client.del(key);
    } catch (error) {
      console.error('Redis DEL error:', error);
      return 0;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      const client = await this.getClient();
      return await client.ttl(key);
    } catch (error) {
      console.error('Redis TTL error:', error);
      return -1;
    }
  }

  async exists(key: string): Promise<number> {
    try {
      const client = await this.getClient();
      return await client.exists(key);
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return 0;
    }
  }

  async hget(key: string, field: string): Promise<string | null> {
    try {
      const client = await this.getClient();
      return await client.hGet(key, field);
    } catch (error) {
      console.error('Redis HGET error:', error);
      return null;
    }
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    try {
      const client = await this.getClient();
      return await client.hSet(key, field, value);
    } catch (error) {
      console.error('Redis HSET error:', error);
      return 0;
    }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    try {
      const client = await this.getClient();
      return await client.hGetAll(key);
    } catch (error) {
      console.error('Redis HGETALL error:', error);
      return {};
    }
  }

  async zadd(key: string, score: number, member: string): Promise<number> {
    try {
      const client = await this.getClient();
      return await client.zAdd(key, { score, value: member });
    } catch (error) {
      console.error('Redis ZADD error:', error);
      return 0;
    }
  }

  async zremrangebyscore(key: string, min: number, max: number): Promise<number> {
    try {
      const client = await this.getClient();
      return await client.zRemRangeByScore(key, min, max);
    } catch (error) {
      console.error('Redis ZREMRANGEBYSCORE error:', error);
      return 0;
    }
  }

  async zcard(key: string): Promise<number> {
    try {
      const client = await this.getClient();
      return await client.zCard(key);
    } catch (error) {
      console.error('Redis ZCARD error:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const redis = new RedisClient();

// Cache utility functions
export class CacheService {
  private prefix = 'cache:';

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(this.getKey(key));
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache GET error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds = 3600): Promise<boolean> {
    try {
      return await redis.set(
        this.getKey(key),
        JSON.stringify(value),
        { EX: ttlSeconds }
      );
    } catch (error) {
      console.error('Cache SET error:', error);
      return false;
    }
  }

  async del(key: string): Promise<number> {
    return await redis.del(this.getKey(key));
  }

  async exists(key: string): Promise<boolean> {
    const result = await redis.exists(this.getKey(key));
    return result > 0;
  }

  async clear(pattern?: string): Promise<number> {
    try {
      const client = await redis.getClient();
      const keys = await client.keys(pattern ? `${this.prefix}${pattern}` : `${this.prefix}*`);
      if (keys.length === 0) return 0;
      return await client.del(keys);
    } catch (error) {
      console.error('Cache CLEAR error:', error);
      return 0;
    }
  }
}

export const cache = new CacheService();
