"use strict";
/**
 * Redis Client Configuration (Upstash Redis)
 *
 * Used for:
 * - In-memory matching engine (sub-second reconciliation)
 * - Caching reconciliation results
 * - Rate limiting
 * - Session storage
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cache = exports.redis = void 0;
exports.getRedisClient = getRedisClient;
exports.isRedisAvailable = isRedisAvailable;
const redis_1 = require("@upstash/redis");
// Upstash Redis configuration
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_TOKEN;
if (!redisUrl || !redisToken) {
    console.warn('Redis not configured. Some features will be disabled.');
}
/**
 * Upstash Redis client (serverless-friendly)
 */
exports.redis = redisUrl && redisToken
    ? new redis_1.Redis({
        url: redisUrl,
        token: redisToken,
    })
    : null;
/**
 * Fallback Redis client using ioredis (for local development)
 */
let ioredisClient = null;
if (!exports.redis && process.env.REDIS_HOST) {
    try {
        const Redis = require('ioredis');
        ioredisClient = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            db: parseInt(process.env.REDIS_DB || '0'),
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
        });
        ioredisClient.on('error', (err) => {
            console.error('Redis connection error:', err);
        });
    }
    catch (error) {
        console.warn('Failed to initialize Redis client:', error);
    }
}
/**
 * Get Redis client (Upstash or ioredis fallback)
 */
function getRedisClient() {
    return exports.redis || ioredisClient;
}
/**
 * Check if Redis is available
 */
function isRedisAvailable() {
    return exports.redis !== null || ioredisClient !== null;
}
/**
 * Cache helper functions
 */
exports.cache = {
    /**
     * Get value from cache
     */
    async get(key) {
        const client = getRedisClient();
        if (!client)
            return null;
        try {
            if (exports.redis) {
                return await exports.redis.get(key);
            }
            else {
                const value = await client.get(key);
                return value ? JSON.parse(value) : null;
            }
        }
        catch (error) {
            console.error('Redis get error:', error);
            return null;
        }
    },
    /**
     * Set value in cache
     */
    async set(key, value, ttlSeconds) {
        const client = getRedisClient();
        if (!client)
            return;
        try {
            if (exports.redis) {
                if (ttlSeconds) {
                    await exports.redis.setex(key, ttlSeconds, value);
                }
                else {
                    await exports.redis.set(key, value);
                }
            }
            else {
                const serialized = JSON.stringify(value);
                if (ttlSeconds) {
                    await client.setex(key, ttlSeconds, serialized);
                }
                else {
                    await client.set(key, serialized);
                }
            }
        }
        catch (error) {
            console.error('Redis set error:', error);
        }
    },
    /**
     * Delete value from cache
     */
    async del(key) {
        const client = getRedisClient();
        if (!client)
            return;
        try {
            await client.del(key);
        }
        catch (error) {
            console.error('Redis del error:', error);
        }
    },
    /**
     * Check if key exists
     */
    async exists(key) {
        const client = getRedisClient();
        if (!client)
            return false;
        try {
            if (exports.redis) {
                const result = await exports.redis.exists(key);
                return result === 1;
            }
            else {
                const result = await client.exists(key);
                return result === 1;
            }
        }
        catch (error) {
            console.error('Redis exists error:', error);
            return false;
        }
    },
};
//# sourceMappingURL=client.js.map