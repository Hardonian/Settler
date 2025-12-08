/**
 * Redis Client Configuration (Upstash Redis)
 * 
 * Used for:
 * - In-memory matching engine (sub-second reconciliation)
 * - Caching reconciliation results
 * - Rate limiting
 * - Session storage
 */

import { Redis } from '@upstash/redis';

// Upstash Redis configuration
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_TOKEN;

if (!redisUrl || !redisToken) {
  console.warn('Redis not configured. Some features will be disabled.');
}

/**
 * Upstash Redis client (serverless-friendly)
 */
export const redis = redisUrl && redisToken
  ? new Redis({
      url: redisUrl,
      token: redisToken,
    })
  : null;

/**
 * Fallback Redis client using ioredis (for local development)
 */
let ioredisClient: any = null;

if (!redis && process.env.REDIS_HOST) {
  try {
    const Redis = require('ioredis');
    ioredisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    ioredisClient.on('error', (err: Error) => {
      console.error('Redis connection error:', err);
    });
  } catch (error) {
    console.warn('Failed to initialize Redis client:', error);
  }
}

/**
 * Get Redis client (Upstash or ioredis fallback)
 */
export function getRedisClient(): Redis | any {
  return redis || ioredisClient;
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return redis !== null || ioredisClient !== null;
}

/**
 * Cache helper functions
 */
export const cache = {
  /**
   * Get value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    const client = getRedisClient();
    if (!client) return null;

    try {
      if (redis) {
        return await redis.get<T>(key);
      } else {
        const value = await client.get(key);
        return value ? JSON.parse(value) : null;
      }
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  },

  /**
   * Set value in cache
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const client = getRedisClient();
    if (!client) return;

    try {
      if (redis) {
        if (ttlSeconds) {
          await redis.setex(key, ttlSeconds, value);
        } else {
          await redis.set(key, value);
        }
      } else {
        const serialized = JSON.stringify(value);
        if (ttlSeconds) {
          await client.setex(key, ttlSeconds, serialized);
        } else {
          await client.set(key, serialized);
        }
      }
    } catch (error) {
      console.error('Redis set error:', error);
    }
  },

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    const client = getRedisClient();
    if (!client) return;

    try {
      await client.del(key);
    } catch (error) {
      console.error('Redis del error:', error);
    }
  },

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const client = getRedisClient();
    if (!client) return false;

    try {
      if (redis) {
        const result = await redis.exists(key);
        return result === 1;
      } else {
        const result = await client.exists(key);
        return result === 1;
      }
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  },
};
