/**
 * Cache Implementation
 * Supports both in-memory (dev) and Redis (production) caching
 */

import Redis from 'ioredis';
import { config } from '../config';
import { logWarn } from './logger';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

// In-memory cache fallback
const memoryCache = new Map<string, CacheEntry<unknown>>();

// Redis client (lazy initialization)
let redisClient: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (redisClient) {
    return redisClient;
  }

  try {
    if (config.redis.url) {
      redisClient = new Redis(config.redis.url, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true,
      });
      return redisClient;
    } else if (config.redis.host) {
      redisClient = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true,
      });
      return redisClient;
    }
  } catch (error) {
    logWarn('Redis connection failed, falling back to memory cache', { error });
  }

  return null;
}

/**
 * Get value from cache
 */
export async function get<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();

  if (redis) {
    try {
      const value = await redis.get(key);
      if (value) {
        return JSON.parse(value) as T;
      }
    } catch (error) {
      logWarn('Redis get failed, falling back to memory cache', { error });
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

  return entry.value as T;
}

/**
 * Set value in cache
 */
export async function set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const redis = getRedisClient();

  if (redis) {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
      return;
    } catch (error) {
      logWarn('Redis set failed, falling back to memory cache', { error });
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
export async function del(key: string): Promise<void> {
  const redis = getRedisClient();

  if (redis) {
    try {
      await redis.del(key);
    } catch (error) {
      logWarn('Redis del failed', { error });
    }
  }

  memoryCache.delete(key);
}

/**
 * Delete multiple keys matching pattern
 */
export async function delPattern(pattern: string): Promise<void> {
  const redis = getRedisClient();

  if (redis) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      logWarn('Redis delPattern failed', { error });
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
export async function clear(): Promise<void> {
  const redis = getRedisClient();

  if (redis) {
    try {
      await redis.flushdb();
    } catch (error) {
      logWarn('Redis clear failed', { error });
    }
  }

  memoryCache.clear();
}

/**
 * Generate cache key with namespace
 */
export function cacheKey(namespace: string, ...parts: (string | number)[]): string {
  return `${namespace}:${parts.join(':')}`;
}

/**
 * Close Redis connection
 */
export async function close(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
