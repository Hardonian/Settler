/**
 * Vercel KV (Redis) Integration
 *
 * Provides a unified interface for Redis/KV operations using @vercel/kv
 * Falls back gracefully if KV is not configured
 *
 * Usage:
 *   import { kv } from '@/lib/vercel/kv';
 *   await kv.set('key', 'value');
 *   const value = await kv.get('key');
 */

import { kv as vercelKv } from "@vercel/kv";

/**
 * Check if Vercel KV is configured
 */
export function isKvConfigured(): boolean {
  return !!(
    process.env.KV_REST_API_URL &&
    process.env.KV_REST_API_TOKEN &&
    process.env.KV_REST_API_READ_ONLY_TOKEN
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
      return await vercelKv.get<T>(key);
    } catch (_error) {
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
      if (options?.ex) {
        await vercelKv.set(key, value, { ex: options.ex });
      } else {
        await vercelKv.set(key, value);
      }
      return true;
    } catch (_error) {
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
      await vercelKv.del(key);
      return true;
    } catch (_error) {
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
      const value = await vercelKv.get(key);
      return value !== null;
    } catch (_error) {
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
      const values = await Promise.all(keys.map((key) => vercelKv.get<T>(key)));
      return values;
    } catch (_error) {
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
      await Promise.all(
        entries.map(({ key, value }) =>
          options?.ex ? vercelKv.set(key, value, { ex: options.ex }) : vercelKv.set(key, value)
        )
      );
      return true;
    } catch (_error) {
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
      const current = (await vercelKv.get<number>(key)) || 0;
      const newValue = current + by;
      await vercelKv.set(key, newValue);
      return newValue;
    } catch (_error) {
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
      const current = (await vercelKv.get<number>(key)) || 0;
      const newValue = Math.max(0, current - by);
      await vercelKv.set(key, newValue);
      return newValue;
    } catch (_error) {
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
      // Vercel KV doesn't have a direct expire method, so we use set with ex option
      const value = await vercelKv.get(key);
      if (value !== null) {
        await vercelKv.set(key, value, { ex: seconds });
        return true;
      }
      return false;
    } catch (_error) {
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
