"use strict";
/**
 * Cache Implementation
 * Supports both in-memory (dev) and Redis (production) caching
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisClient = getRedisClient;
exports.get = get;
exports.set = set;
exports.del = del;
exports.delPattern = delPattern;
exports.clear = clear;
exports.cacheKey = cacheKey;
exports.close = close;
const ioredis_1 = __importDefault(require("ioredis"));
const config_1 = require("../config");
const logger_1 = require("./logger");
// In-memory cache fallback
const memoryCache = new Map();
// Redis client (lazy initialization)
let redisClient = null;
function getRedisClient() {
    if (redisClient) {
        return redisClient;
    }
    try {
        if (config_1.config.redis.url) {
            redisClient = new ioredis_1.default(config_1.config.redis.url, {
                maxRetriesPerRequest: 3,
                enableReadyCheck: true,
                lazyConnect: true,
            });
            return redisClient;
        }
        else if (config_1.config.redis.host) {
            redisClient = new ioredis_1.default({
                host: config_1.config.redis.host,
                port: config_1.config.redis.port,
                maxRetriesPerRequest: 3,
                enableReadyCheck: true,
                lazyConnect: true,
            });
            return redisClient;
        }
    }
    catch (error) {
        (0, logger_1.logWarn)('Redis connection failed, falling back to memory cache', { error });
    }
    return null;
}
/**
 * Get value from cache
 */
async function get(key) {
    const redis = getRedisClient();
    if (redis) {
        try {
            const value = await redis.get(key);
            if (value) {
                return JSON.parse(value);
            }
        }
        catch (error) {
            (0, logger_1.logWarn)('Redis get failed, falling back to memory cache', { error });
        }
    }
    // Fallback to memory cache
    const entry = memoryCache.get(key);
    if (!entry) {
        return null;
    }
    if (entry.expiresAt < Date.now()) {
        memoryCache.delete(key);
        return null;
    }
    return entry.value;
}
/**
 * Set value in cache
 */
async function set(key, value, ttlSeconds) {
    const redis = getRedisClient();
    if (redis) {
        try {
            await redis.setex(key, ttlSeconds, JSON.stringify(value));
            return;
        }
        catch (error) {
            (0, logger_1.logWarn)('Redis set failed, falling back to memory cache', { error });
        }
    }
    // Fallback to memory cache
    memoryCache.set(key, {
        value,
        expiresAt: Date.now() + ttlSeconds * 1000,
    });
    // Cleanup expired entries periodically
    if (memoryCache.size > 10000) {
        const now = Date.now();
        for (const [k, v] of memoryCache.entries()) {
            if (v.expiresAt < now) {
                memoryCache.delete(k);
            }
        }
    }
}
/**
 * Delete value from cache
 */
async function del(key) {
    const redis = getRedisClient();
    if (redis) {
        try {
            await redis.del(key);
        }
        catch (error) {
            (0, logger_1.logWarn)('Redis del failed', { error });
        }
    }
    memoryCache.delete(key);
}
/**
 * Delete multiple keys matching pattern
 */
async function delPattern(pattern) {
    const redis = getRedisClient();
    if (redis) {
        try {
            const keys = await redis.keys(pattern);
            if (keys.length > 0) {
                await redis.del(...keys);
            }
        }
        catch (error) {
            (0, logger_1.logWarn)('Redis delPattern failed', { error });
        }
    }
    // Fallback: delete from memory cache
    for (const key of memoryCache.keys()) {
        if (key.includes(pattern.replace('*', ''))) {
            memoryCache.delete(key);
        }
    }
}
/**
 * Clear all cache
 */
async function clear() {
    const redis = getRedisClient();
    if (redis) {
        try {
            await redis.flushdb();
        }
        catch (error) {
            (0, logger_1.logWarn)('Redis clear failed', { error });
        }
    }
    memoryCache.clear();
}
/**
 * Generate cache key with namespace
 */
function cacheKey(namespace, ...parts) {
    return `${namespace}:${parts.join(':')}`;
}
/**
 * Close Redis connection
 */
async function close() {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
    }
}
//# sourceMappingURL=cache.js.map