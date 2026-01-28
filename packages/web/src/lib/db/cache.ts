/**
 * Database Query Caching Layer
 * 
 * Redis-backed caching for database queries with:
 * - TTL-based expiration
 * - Cache invalidation on mutations
 * - Cache key generation
 * - Cache hit/miss metrics
 */

import { safeRedisOperation } from '@/lib/redis/client';
import { trackMetric } from '@/lib/monitoring/metrics';

export interface CacheOptions {
  /** Cache TTL in seconds */
  ttl: number;
  /** Cache key prefix */
  prefix?: string;
  /** Skip cache (force fresh data) */
  skip?: boolean;
}

/**
 * Generate cache key from query parameters
 */
export function generateCacheKey(
  prefix: string,
  params: Record<string, unknown>
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}:${JSON.stringify(params[key])}`)
    .join('|');
  
  return `${prefix}:${sortedParams}`;
}

/**
 * Get cached value
 */
export async function getCached<T>(
  key: string,
  options: CacheOptions
): Promise<T | null> {
  if (options.skip) {
    return null;
  }

  try {
    const result = await safeRedisOperation(
      async (client) => {
        const cached = await client.get(key);
        return cached ? JSON.parse(cached) : null;
      },
      () => null // Fallback to no cache
    );

    if (result) {
      await trackMetric({ name: 'cache.hit', value: 1, tags: { key: key.substring(0, 50) } });
      return result as T;
    }

    await trackMetric({ name: 'cache.miss', value: 1, tags: { key: key.substring(0, 50) } });
    return null;
  } catch (error) {
    await trackMetric({ name: 'cache.error', value: 1, tags: { key: key.substring(0, 50) } });
    return null;
  }
}

/**
 * Set cached value
 */
export async function setCached<T>(
  key: string,
  value: T,
  options: CacheOptions
): Promise<void> {
  if (options.skip) {
    return;
  }

  try {
    await safeRedisOperation(
      async (client) => {
        await client.setex(key, options.ttl, JSON.stringify(value));
      },
      () => {} // Fallback to no-op
    );

    await trackMetric({ name: 'cache.set', value: 1, tags: { key: key.substring(0, 50) } });
  } catch (error) {
    await trackMetric({ name: 'cache.error', value: 1, tags: { key: key.substring(0, 50) } });
  }
}

/**
 * Invalidate cache by pattern
 */
export async function invalidateCache(pattern: string): Promise<void> {
  try {
    await safeRedisOperation(
      async (client) => {
        // Redis SCAN for pattern matching
        const keys: string[] = [];
        let cursor = '0';
        
        do {
          const result = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
          cursor = result[0];
          keys.push(...result[1]);
        } while (cursor !== '0');

        if (keys.length > 0) {
          await client.del(...keys);
        }
      },
      () => {} // Fallback to no-op
    );

    await trackMetric({ name: 'cache.invalidate', value: 1, tags: { pattern: pattern.substring(0, 50) } });
  } catch (error) {
    await trackMetric({ name: 'cache.error', value: 1, tags: { operation: 'invalidate' } });
  }
}

/**
 * Cache wrapper for async functions
 */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  options: CacheOptions
): Promise<T> {
  // Try cache first
  const cached = await getCached<T>(key, options);
  if (cached !== null) {
    return cached;
  }

  // Execute function
  const result = await fn();

  // Cache result
  await setCached(key, result, options);

  return result;
}

/**
 * Cache invalidation patterns for common entities
 */
export const CachePatterns = {
  apiKeys: (userId: string) => `api_keys:${userId}:*`,
  receipts: (billingAccountId: string) => `receipts:${billingAccountId}:*`,
  featureFlags: (billingAccountId: string) => `feature_flags:${billingAccountId}:*`,
  usage: (billingAccountId: string) => `usage:${billingAccountId}:*`,
  billing: (billingAccountId: string) => `billing:${billingAccountId}:*`,
};
