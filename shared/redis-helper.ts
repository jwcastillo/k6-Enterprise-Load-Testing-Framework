import { Client } from 'k6/experimental/redis';

/**
 * RedisHelper - Utility class for Redis operations in k6 tests
 * 
 * Usage:
 *   const redis = new RedisHelper('localhost:6379');
 *   await redis.set('key', 'value');
 *   const value = await redis.get('key');
 */
export class RedisHelper {
  private client: Client;

  constructor(addr?: string) {
    const redisAddr = addr || this.parseAddr(__ENV.REDIS_URL || 'redis://localhost:6379');
    this.client = new Client({
      socket: {
        host: redisAddr.split(':')[0],
        port: parseInt(redisAddr.split(':')[1] || '6379'),
      },
    });
  }

  /**
   * Set a key-value pair with optional TTL
   */
  public async set(key: string, value: string, ttl?: number): Promise<void> {
    await this.client.set(key, value, 0);
    if (ttl) {
      await this.client.expire(key, ttl);
    }
  }

  /**
   * Get a value by key
   */
  public async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (err: any) {
      if (err && err.toString().includes('redis: nil')) {
        return null;
      }
      throw err;
    }
  }

  /**
   * Delete a key
   */
  public async del(key: string): Promise<void> {
    await this.client.del([key]);
  }

  /**
   * Check if key exists
   */
  public async exists(key: string): Promise<boolean> {
    const result = await this.client.exists([key]);
    return result > 0;
  }

  /**
   * Get multiple values by keys
   */
  public async mget(keys: string[]): Promise<string[]> {
    // k6 Redis client expects individual arguments
    const result: any = await (this.client as any).mget(...keys);
    return result;
  }

  /**
   * Increment a counter
   */
  public async incr(key: string): Promise<number> {
    return await this.client.incr(key);
  }

  /**
   * Add item to a list
   */
  public async lpush(key: string, value: string): Promise<void> {
    await this.client.lpush(key, value);
  }

  /**
   * Get list length
   */
  public async llen(key: string): Promise<number> {
    return await this.client.llen(key);
  }

  /**
   * Get all items from a list
   */
  public async lrange(key: string, start: number = 0, stop: number = -1): Promise<string[]> {
    return await this.client.lrange(key, start, stop);
  }

  /**
   * Set hash field
   */
  public async hset(key: string, field: string, value: string): Promise<void> {
    await this.client.hset(key, field, value);
  }

  /**
   * Get hash field
   */
  public async hget(key: string, field: string): Promise<string> {
    return await this.client.hget(key, field);
  }

  /**
   * Get all hash fields
   */
  public async hgetall(key: string): Promise<Record<string, string>> {
    const result = await this.client.hgetall(key);
    
    // k6 Redis client returns object directly, not array
    if (result && typeof result === 'object' && !Array.isArray(result)) {
      return result as Record<string, string>;
    }
    
    // Fallback: Convert array response to object (for compatibility)
    const obj: Record<string, string> = {};
    if (Array.isArray(result)) {
      for (let i = 0; i < result.length; i += 2) {
        obj[result[i]] = result[i + 1];
      }
    }
    return obj;
  }

  /**
   * Set expiration on key
   */
  public async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds);
  }

  // Helper methods
  private parseAddr(url: string): string {
    // Parse redis://host:port to host:port
    const match = url.match(/redis:\/\/([^:]+):?(\d+)?/);
    if (match) {
      const host = match[1];
      const port = match[2] || '6379';
      return `${host}:${port}`;
    }
    return url;
  }
}

