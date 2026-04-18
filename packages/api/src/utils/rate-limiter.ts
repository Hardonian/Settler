import Redis from "ioredis";
import { config } from "../config";

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export class RedisRateLimiter {
  private redis: Redis;

  constructor(redisClient?: Redis) {
    this.redis = redisClient || new Redis(config.redisUrl);
  }

  /**
   * Checks if a request should be rate limited using a fixed window.
   * @param key The unique identifier (IP, API Key, etc.)
   * @param limit Maximum requests allowed in the window
   * @param windowSeconds Window size in seconds
   */
  async checkLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    const now = Math.floor(Date.now() / 1000);
    const windowKey = `ratelimit:${key}:${Math.floor(now / windowSeconds)}`;

    const multi = this.redis.multi();
    multi.incr(windowKey);
    multi.expire(windowKey, windowSeconds + 1);

    const results = await multi.exec();
    if (!results) throw new Error("Rate limit execution failed");

    const count = results[0][1] as number;
    const remaining = Math.max(0, limit - count);
    const reset = (Math.floor(now / windowSeconds) + 1) * windowSeconds;

    return {
      success: count <= limit,
      limit,
      remaining,
      reset,
    };
  }
}

// Singleton instance for the application
export const rateLimiter = new RedisRateLimiter();
