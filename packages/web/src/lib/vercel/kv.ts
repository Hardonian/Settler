/**
 * Redis Integration
 *
 * Provides a unified interface for Redis/KV operations using @upstash/redis
 * Falls back gracefully if KV is not configured
 *
 * Usage:
 *   import { kv } from '@/lib/vercel/kv';
 *   await kv.set('key', 'value');
 *   const value = await kv.get('key');
 */

import { Redis } from "@upstash/redis";

let redisClient: Redis | null = null;

function getRedisClient(): Redis | null {
  if (!isKvConfigured()) {
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? "",
      token: process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? "",
    });
  }

  return redisClient;
}

/**
 * Check if Vercel KV is configured
 */
export function isKvConfigured(): boolean {
  return Boolean(
    (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
    (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  );
}

/**
 * Vercel KV client wrapper with error handling
 */
export const kv = {
  /**
   * Get value from KV store
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    if (!isKvConfigured()) {
      console.warn("[KV] KV not configured, returning null");
      return null;
    }

    try {
      const client = getRedisClient();
      return client ? await client.get<T>(key) : null;
    } catch (error) {
      console.error(`[KV] Error getting key "${key}":`, error);
      return null;
    }
  },

  /**
   * Set value in KV store
   */
  async set(key: string, value: unknown, options?: { ex?: number }): Promise<boolean> {
    if (!isKvConfigured()) {
      console.warn("[KV] KV not configured, skipping set");
      return false;
    }

    try {
      const client = getRedisClient();
      if (!client) {
        return false;
      }

      if (options?.ex) {
        await client.set(key, value, { ex: options.ex });
      } else {
        await client.set(key, value);
      }
      return true;
    } catch (error) {
      console.error(`[KV] Error setting key "${key}":`, error);
      return false;
    }
  },

  /**
   * Delete value from KV store
   */
  async del(key: string): Promise<boolean> {
    if (!isKvConfigured()) {
      console.warn("[KV] KV not configured, skipping delete");
      return false;
    }

    try {
      const client = getRedisClient();
      if (!client) {
        return false;
      }

      await client.del(key);
      return true;
    } catch (error) {
      console.error(`[KV] Error deleting key "${key}":`, error);
      return false;
    }
  },

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!isKvConfigured()) {
      return false;
    }

    try {
      const client = getRedisClient();
      const value = client ? await client.get(key) : null;
      return value !== null;
    } catch (error) {
      console.error(`[KV] Error checking existence of key "${key}":`, error);
      return false;
    }
  },

  /**
   * Get multiple keys
   */
  async mget<T = unknown>(keys: string[]): Promise<(T | null)[]> {
    if (!isKvConfigured()) {
      return keys.map(() => null);
    }

    try {
      const client = getRedisClient();
      if (!client) {
        return keys.map(() => null);
      }

      const values = await Promise.all(keys.map((key) => client.get<T>(key)));
      return values;
    } catch (error) {
      console.error(`[KV] Error getting multiple keys:`, error);
      return keys.map(() => null);
    }
  },

  /**
   * Set multiple key-value pairs
   */
  async mset(
    entries: Array<{ key: string; value: unknown }>,
    options?: { ex?: number }
  ): Promise<boolean> {
    if (!isKvConfigured()) {
      console.warn("[KV] KV not configured, skipping mset");
      return false;
    }

    try {
      const client = getRedisClient();
      if (!client) {
        return false;
      }

      await Promise.all(
        entries.map(({ key, value }) =>
          options?.ex ? client.set(key, value, { ex: options.ex }) : client.set(key, value)
        )
      );
      return true;
    } catch (error) {
      console.error(`[KV] Error setting multiple keys:`, error);
      return false;
    }
  },

  /**
   * Increment a numeric value
   */
  async incr(key: string, by = 1): Promise<number | null> {
    if (!isKvConfigured()) {
      return null;
    }

    try {
      const client = getRedisClient();
      if (!client) {
        return null;
      }

      const current = (await client.get<number>(key)) || 0;
      const newValue = current + by;
      await client.set(key, newValue);
      return newValue;
    } catch (error) {
      console.error(`[KV] Error incrementing key "${key}":`, error);
      return null;
    }
  },

  /**
   * Decrement a numeric value
   */
  async decr(key: string, by = 1): Promise<number | null> {
    if (!isKvConfigured()) {
      return null;
    }

    try {
      const client = getRedisClient();
      if (!client) {
        return null;
      }

      const current = (await client.get<number>(key)) || 0;
      const newValue = Math.max(0, current - by);
      await client.set(key, newValue);
      return newValue;
    } catch (error) {
      console.error(`[KV] Error decrementing key "${key}":`, error);
      return null;
    }
  },

  /**
   * Set expiration on a key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    if (!isKvConfigured()) {
      return false;
    }

    try {
      const client = getRedisClient();
      if (!client) {
        return false;
      }

      // Upstash REST does not expose a typed expire helper here, so preserve the
      // current value with a fresh TTL.
      const value = await client.get(key);
      if (value !== null) {
        await client.set(key, value, { ex: seconds });
        return true;
      }
      return false;
    } catch (error) {
      console.error(`[KV] Error setting expiration on key "${key}":`, error);
      return false;
    }
  },
};

/**
 * Cache helper with TTL
 */
export async function cacheGet<T>(key: string): Promise<{ value: T | null; cached: boolean }> {
  const cacheKey = `cache:${key}`;
  const cached = await kv.get<{ value: T; expires: number }>(cacheKey);

  if (cached && cached.expires > Date.now()) {
    return { value: cached.value, cached: true };
  }

  return { value: null, cached: false };
}

/**
 * Cache helper with TTL
 */
export async function cacheSet<T>(key: string, value: T, ttlSeconds = 3600): Promise<boolean> {
  const cacheKey = `cache:${key}`;
  const expires = Date.now() + ttlSeconds * 1000;
  return kv.set(cacheKey, { value, expires }, { ex: ttlSeconds });
}
