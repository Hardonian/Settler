/**
 * Token Bucket Rate Limiting
 * Adaptive token bucket implementation for tenant rate limiting
 */

import Redis from 'ioredis';
import { config } from '../../config';

export interface TokenBucketConfig {
  capacity: number; // Maximum tokens
  refillRate: number; // Tokens per second
  adaptive?: boolean; // Enable adaptive rate limiting
}

export class TokenBucket {
  private redis: Redis;

  constructor() {
    const redisOptions: {
      host: string;
      port: number;
      url?: string;
      retryStrategy?: (times: number) => number;
    } = {
      host: config.redis.host,
      port: config.redis.port,
      retryStrategy: (times: number) => {
        return Math.min(times * 50, 2000);
      },
    };
    if (config.redis.url) {
      redisOptions.url = config.redis.url;
    }
    this.redis = new Redis(redisOptions);
  }

  /**
   * Try to consume tokens from bucket
   * Returns { allowed: boolean, remaining: number, resetAt: Date }
   */
  async consume(
    key: string,
    tokens: number,
    config: TokenBucketConfig
  ): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    const now = Date.now();
    const windowMs = (config.capacity / config.refillRate) * 1000;
    const redisKey = `rate_limit:${key}`;

    // Use Lua script for atomic operations
    const luaScript = `
      local key = KEYS[1]
      local tokens = tonumber(ARGV[1])
      local capacity = tonumber(ARGV[2])
      local refillRate = tonumber(ARGV[3])
      local now = tonumber(ARGV[4])
      local windowMs = tonumber(ARGV[5])
      
      local bucket = redis.call('HMGET', key, 'tokens', 'lastRefill')
      local currentTokens = tonumber(bucket[1]) or capacity
      local lastRefill = tonumber(bucket[2]) or now
      
      -- Calculate tokens to add based on time elapsed
      local elapsed = (now - lastRefill) / 1000
      local tokensToAdd = math.floor(elapsed * refillRate)
      currentTokens = math.min(capacity, currentTokens + tokensToAdd)
      
      -- Check if we can consume
      if currentTokens >= tokens then
        currentTokens = currentTokens - tokens
        redis.call('HMSET', key, 'tokens', currentTokens, 'lastRefill', now)
        redis.call('EXPIRE', key, math.ceil(windowMs / 1000))
        return {1, currentTokens, now + windowMs}
      else
        -- Update last refill time even if we can't consume
        redis.call('HMSET', key, 'tokens', currentTokens, 'lastRefill', now)
        redis.call('EXPIRE', key, math.ceil(windowMs / 1000))
        return {0, currentTokens, lastRefill + windowMs}
      end
    `;

    const result = await this.redis.eval(
      luaScript,
      1,
      redisKey,
      tokens.toString(),
      config.capacity.toString(),
      config.refillRate.toString(),
      now.toString(),
      windowMs.toString()
    ) as [number, number, number];

    const allowed = result[0] === 1;
    const remaining = result[1];
    const resetAt = new Date(result[2]);

    return { allowed, remaining, resetAt };
  }

  /**
   * Get current bucket state without consuming
   */
  async peek(key: string, config: TokenBucketConfig): Promise<{ tokens: number; resetAt: Date }> {
    const now = Date.now();
    const windowMs = (config.capacity / config.refillRate) * 1000;
    const redisKey = `rate_limit:${key}`;

    const bucket = await this.redis.hmget(redisKey, 'tokens', 'lastRefill');
    const currentTokens = bucket[0] ? parseFloat(bucket[0]) : config.capacity;
    const lastRefill = bucket[1] ? parseFloat(bucket[1]) : now;

    // Calculate tokens to add
    const elapsed = (now - lastRefill) / 1000;
    const tokensToAdd = Math.floor(elapsed * config.refillRate);
    const tokens = Math.min(config.capacity, currentTokens + tokensToAdd);

    const resetAt = new Date(lastRefill + windowMs);

    return { tokens, resetAt };
  }

  /**
   * Reset bucket for a key
   */
  async reset(key: string): Promise<void> {
    const redisKey = `rate_limit:${key}`;
    await this.redis.del(redisKey);
  }

  /**
   * Adaptive rate limiting: adjust rate based on tenant behavior
   */
  async adjustRate(
    _key: string,
    currentConfig: TokenBucketConfig,
    successRate: number // 0-1, percentage of successful requests
  ): Promise<TokenBucketConfig> {
    if (!currentConfig.adaptive) {
      return currentConfig;
    }

    // If success rate is high (>95%), increase rate slightly
    // If success rate is low (<80%), decrease rate
    let newRefillRate = currentConfig.refillRate;

    if (successRate > 0.95) {
      newRefillRate = Math.min(
        currentConfig.refillRate * 1.1,
        currentConfig.capacity / 60 // Max 1 refill per minute
      );
    } else if (successRate < 0.8) {
      newRefillRate = Math.max(
        currentConfig.refillRate * 0.9,
        currentConfig.capacity / 3600 // Min 1 refill per hour
      );
    }

    return {
      ...currentConfig,
      refillRate: newRefillRate,
    };
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    await this.redis.quit();
  }
}

export const tokenBucket = new TokenBucket();
