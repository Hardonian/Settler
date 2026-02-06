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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.cache = exports.redis = void 0;
exports.getRedisClient = getRedisClient;
exports.isRedisAvailable = isRedisAvailable;
const redis_1 = require("@upstash/redis");
// Upstash Redis configuration
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_TOKEN;
if (!redisUrl || !redisToken) {
    // Note: Can't use logger here as it may depend on Redis - use console for initialization only
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
async function initializeIoredis() {
    if (ioredisClient || exports.redis || !process.env.REDIS_HOST) {
        return;
    }
    const ioredisModule = await Promise.resolve().then(() => __importStar(require('ioredis'))).catch((error) => {
        // Note: Can't use logger here as it may depend on Redis - use console for initialization only
        console.warn('Failed to load Redis client module:', error);
        return null;
    });
    if (!ioredisModule) {
        return;
    }
    try {
        const RedisClient = 'default' in ioredisModule ? ioredisModule.default : ioredisModule;
        ioredisClient = new RedisClient({
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
            // Note: Can't use logger here as it may depend on Redis - use console for initialization only
            console.error('Redis connection error:', err);
        });
    }
    catch (error) {
        // Note: Can't use logger here as it may depend on Redis - use console for initialization only
        console.warn('Failed to initialize Redis client:', error);
    }
}
void initializeIoredis();
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
            // Use dynamic import to avoid circular dependencies
            Promise.resolve().then(() => __importStar(require('../../utils/logger'))).then(({ logError }) => {
                logError('Redis get error', error);
            }).catch(() => {
                // Silent fail if logger unavailable
            });
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
            // Use dynamic import to avoid circular dependencies
            Promise.resolve().then(() => __importStar(require('../../utils/logger'))).then(({ logError }) => {
                logError('Redis set error', error);
            }).catch(() => {
                // Silent fail if logger unavailable
            });
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
            // Use dynamic import to avoid circular dependencies
            Promise.resolve().then(() => __importStar(require('../../utils/logger'))).then(({ logError }) => {
                logError('Redis del error', error);
            }).catch(() => {
                // Silent fail if logger unavailable
            });
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
            // Use dynamic import to avoid circular dependencies
            Promise.resolve().then(() => __importStar(require('../../utils/logger'))).then(({ logError }) => {
                logError('Redis exists error', error);
            }).catch(() => {
                // Silent fail if logger unavailable
            });
            return false;
        }
    },
};
//# sourceMappingURL=client.js.map