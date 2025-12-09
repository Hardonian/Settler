"use strict";
/**
 * Token Bucket Rate Limiting
 * Adaptive token bucket implementation for tenant rate limiting
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenBucket = exports.TokenBucket = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const config_1 = require("../../config");
class TokenBucket {
    redis;
    constructor() {
        const redisOptions = {
            host: config_1.config.redis.host,
            port: config_1.config.redis.port,
            retryStrategy: (times) => {
                return Math.min(times * 50, 2000);
            },
        };
        if (config_1.config.redis.url) {
            redisOptions.url = config_1.config.redis.url;
        }
        this.redis = new ioredis_1.default(redisOptions);
    }
    /**
     * Try to consume tokens from bucket
     * Returns { allowed: boolean, remaining: number, resetAt: Date }
     */
    async consume(key, tokens, config) {
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
        const result = await this.redis.eval(luaScript, 1, redisKey, tokens.toString(), config.capacity.toString(), config.refillRate.toString(), now.toString(), windowMs.toString());
        const allowed = result[0] === 1;
        const remaining = result[1];
        const resetAt = new Date(result[2]);
        return { allowed, remaining, resetAt };
    }
    /**
     * Get current bucket state without consuming
     */
    async peek(key, config) {
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
    async reset(key) {
        const redisKey = `rate_limit:${key}`;
        await this.redis.del(redisKey);
    }
    /**
     * Adaptive rate limiting: adjust rate based on tenant behavior
     */
    async adjustRate(_key, currentConfig, successRate // 0-1, percentage of successful requests
    ) {
        if (!currentConfig.adaptive) {
            return currentConfig;
        }
        // If success rate is high (>95%), increase rate slightly
        // If success rate is low (<80%), decrease rate
        let newRefillRate = currentConfig.refillRate;
        if (successRate > 0.95) {
            newRefillRate = Math.min(currentConfig.refillRate * 1.1, currentConfig.capacity / 60 // Max 1 refill per minute
            );
        }
        else if (successRate < 0.8) {
            newRefillRate = Math.max(currentConfig.refillRate * 0.9, currentConfig.capacity / 3600 // Min 1 refill per hour
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
    async close() {
        await this.redis.quit();
    }
}
exports.TokenBucket = TokenBucket;
exports.tokenBucket = new TokenBucket();
//# sourceMappingURL=TokenBucket.js.map