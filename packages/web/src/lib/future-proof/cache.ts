/**
 * Future-Proof Caching Utilities
 *
 * Provides caching layer that can be upgraded to Redis/CDN later.
 * Currently uses in-memory cache with TTL.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class MemoryCache {
  private store: Map<string, CacheEntry<any>> = new Map();

  set<T>(key: string, value: T, ttlSeconds: number): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

const memoryCache = new MemoryCache();

// Cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
  const cleanupTimer = setInterval(
    () => {
      memoryCache.cleanup();
    },
    5 * 60 * 1000
  );

  cleanupTimer.unref?.();
}

/**
 * Cache wrapper that can be upgraded to Redis
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  // Try Redis first if available
  try {
    const { getRedisClient, safeRedisOperation } = await import("@/lib/redis/client");
    const client = getRedisClient();
    if (client) {
      return await safeRedisOperation(
        async (redis) => {
          const value = await redis.get(key);

          return value as T | null;
        },
        () => memoryCache.get<T>(key)
      );
    }
  } catch {
    // Redis not available, fall back to memory
  }

  return memoryCache.get<T>(key);
}

/**
 * Cache set wrapper that can be upgraded to Redis
 */
export async function cacheSet<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
  // Try Redis first if available
  try {
    const { getRedisClient, safeRedisOperation } = await import("@/lib/redis/client");
    const client = getRedisClient();
    if (client) {
      await safeRedisOperation(
        async (redis) => {
          await redis.set(key, value, { ex: ttlSeconds });
        },
        () => {
          memoryCache.set(key, value, ttlSeconds);
        }
      );
      return;
    }
  } catch {
    // Redis not available, fall back to memory
  }

  memoryCache.set(key, value, ttlSeconds);
}

/**
 * Cache delete wrapper
 */
export async function cacheDelete(key: string): Promise<void> {
  try {
    const { getRedisClient, safeRedisOperation } = await import("@/lib/redis/client");
    const client = getRedisClient();
    if (client) {
      await safeRedisOperation(
        async (redis) => {
          await redis.del(key);
        },
        () => {
          memoryCache.delete(key);
        }
      );
      return;
    }
  } catch {
    // Redis not available, fall back to memory
  }

  memoryCache.delete(key);
}
