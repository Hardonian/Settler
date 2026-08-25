/**
 * Token Bucket Rate Limiting
 * Adaptive token bucket implementation for tenant rate limiting
 */

import Redis from "ioredis";
import { config } from "../../config";
import { logWarn, logInfo } from "../../utils/logger";

export interface TokenBucketConfig {
  capacity: number; // Maximum tokens
  refillRate: number; // Tokens per second
  adaptive?: boolean; // Enable adaptive rate limiting
}

interface InMemoryBucket {
  tokens: number;
  lastRefill: number;
}

export type RateLimitMode = "distributed" | "local-fallback";

export class TokenBucket {
  private redis: Redis;
  private _mode: RateLimitMode = "distributed";
  private _fallbackWarningEmitted = false;
  private inMemoryBuckets = new Map<string, InMemoryBucket>();

  /** Current rate limiting mode */
  get mode(): RateLimitMode {
    return this._mode;
  }

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

    // Use defineCommand to securely execute the Lua script by SHA under the hood
    this.redis.defineCommand("consumeTokens", {
      numberOfKeys: 1,
      lua: `
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
      `,
    });

    // Use defineCommand to securely execute the Lua script by SHA under the hood
    this.redis.defineCommand("consumeTokens", {
      numberOfKeys: 1,
      lua: `
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
      `,
    });

    this.redis.on("error", () => {
      this.enterFallbackMode();
    });

    this.redis.on("ready", () => {
      if (this._mode === "local-fallback") {
        logInfo("token_bucket_redis_recovered", {
          component: "TokenBucket",
          previousMode: "local-fallback",
          newMode: "distributed",
        });
        this._mode = "distributed";
        this._fallbackWarningEmitted = false;
        this.inMemoryBuckets.clear();
      }
    });
  }

  private enterFallbackMode(): void {
    this._mode = "local-fallback";
    if (!this._fallbackWarningEmitted) {
      this._fallbackWarningEmitted = true;
      logWarn("token_bucket_redis_fallback", {
        severity: "warning",
        component: "TokenBucket",
        mode: "local-fallback",
        message:
          "Redis unavailable for token bucket rate limiting; using in-memory fallback. Rate limits are per-instance and reset on restart.",
      });
    }
  }

  private consumeInMemory(
    key: string,
    tokens: number,
    bucketConfig: TokenBucketConfig
  ): { allowed: boolean; remaining: number; resetAt: Date } {
    const now = Date.now();
    const windowMs = (bucketConfig.capacity / bucketConfig.refillRate) * 1000;
    let bucket = this.inMemoryBuckets.get(key);

    if (!bucket) {
      bucket = { tokens: bucketConfig.capacity, lastRefill: now };
      this.inMemoryBuckets.set(key, bucket);
    }

    // Refill tokens based on elapsed time
    const elapsed = (now - bucket.lastRefill) / 1000;
    const tokensToAdd = Math.floor(elapsed * bucketConfig.refillRate);
    bucket.tokens = Math.min(bucketConfig.capacity, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;

    if (bucket.tokens >= tokens) {
      bucket.tokens -= tokens;
      return { allowed: true, remaining: bucket.tokens, resetAt: new Date(now + windowMs) };
    }

    return {
      allowed: false,
      remaining: bucket.tokens,
      resetAt: new Date(bucket.lastRefill + windowMs),
    };
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

    // Validate inputs
    if (
      !Number.isFinite(tokens) ||
      tokens < 0 ||
      !Number.isFinite(config.capacity) ||
      config.capacity < 0 ||
      !Number.isFinite(config.refillRate) ||
      config.refillRate < 0
    ) {
      logWarn("invalid_rate_limit_params", {
        key,
        tokens,
        capacity: config.capacity,
        refillRate: config.refillRate,
      });
      return { allowed: false, remaining: 0, resetAt: new Date(now + windowMs) };
    }

    try {
      // Use defineCommand to securely execute the Lua script by SHA under the hood
      if (!(this.redis as any).consumeTokens) {
        this.redis.defineCommand("consumeTokens", {
          numberOfKeys: 1,
          lua: `
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
          `,
        });
      }

      const result = (await (this.redis as any).consumeTokens(
        redisKey,
        tokens.toString(),
        config.capacity.toString(),
        config.refillRate.toString(),
        now.toString(),
        windowMs.toString()
      )) as [number, number, number];

      const allowed = result[0] === 1;
      const remaining = result[1];
      const resetAt = new Date(result[2]);

      if (this._mode === "local-fallback") {
        this._mode = "distributed";
        this._fallbackWarningEmitted = false;
        this.inMemoryBuckets.clear();
        logInfo("token_bucket_redis_recovered", {
          component: "TokenBucket",
          previousMode: "local-fallback",
          newMode: "distributed",
        });
      }

      return { allowed, remaining, resetAt };
    } catch {
      this.enterFallbackMode();
      return this.consumeInMemory(key, tokens, config);
    }
  }

  /**
   * Get current bucket state without consuming
   */
  async peek(key: string, config: TokenBucketConfig): Promise<{ tokens: number; resetAt: Date }> {
    const now = Date.now();
    const windowMs = (config.capacity / config.refillRate) * 1000;
    const redisKey = `rate_limit:${key}`;

    try {
      const bucket = await this.redis.hmget(redisKey, "tokens", "lastRefill");
      const currentTokens = bucket[0] ? parseFloat(bucket[0]) : config.capacity;
      const lastRefill = bucket[1] ? parseFloat(bucket[1]) : now;

      // Calculate tokens to add
      const elapsed = (now - lastRefill) / 1000;
      const tokensToAdd = Math.floor(elapsed * config.refillRate);
      const tokens = Math.min(config.capacity, currentTokens + tokensToAdd);

      const resetAt = new Date(lastRefill + windowMs);

      return { tokens, resetAt };
    } catch {
      // Fallback: return from in-memory state or full bucket
      const memBucket = this.inMemoryBuckets.get(key);
      if (memBucket) {
        const elapsed = (now - memBucket.lastRefill) / 1000;
        const tokensToAdd = Math.floor(elapsed * config.refillRate);
        const tokens = Math.min(config.capacity, memBucket.tokens + tokensToAdd);
        return { tokens, resetAt: new Date(memBucket.lastRefill + windowMs) };
      }
      return { tokens: config.capacity, resetAt: new Date(now + windowMs) };
    }
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
