/**
 * Advanced Caching Strategies
 * Implements tag-based invalidation, cache warming, and coherency checks
 */

import { get, set, del } from "../../utils/cache";
import { logInfo, logWarn } from "../../utils/logger";

export interface CacheTag {
  tag: string;
  keys: string[];
}

// In-memory tag index (in production, use Redis SET operations)
const tagIndex = new Map<string, Set<string>>();

/**
 * Set cache value with tags for invalidation
 *
 * @param key - Cache key
 * @param value - Value to cache
 * @param ttlSeconds - Time to live in seconds
 * @param tags - Tags for invalidation
 */
export async function setWithTags<T>(
  key: string,
  value: T,
  ttlSeconds: number,
  tags: string[] = []
): Promise<void> {
  await set(key, value, ttlSeconds);

  // Index tags
  for (const tag of tags) {
    if (!tagIndex.has(tag)) {
      tagIndex.set(tag, new Set());
    }
    tagIndex.get(tag)!.add(key);
  }

  // Store tag metadata in cache
  if (tags.length > 0) {
    await set(`${key}:tags`, tags, ttlSeconds);
  }
}

/**
 * Invalidate all keys with a specific tag
 *
 * @param tag - Tag to invalidate
 */
export async function invalidateByTag(tag: string): Promise<number> {
  const keys = tagIndex.get(tag);
  if (!keys || keys.size === 0) {
    return 0;
  }

  let invalidated = 0;
  for (const key of keys) {
    await del(key);
    await del(`${key}:tags`);
    invalidated++;
  }

  tagIndex.delete(tag);
  logInfo(`Invalidated ${invalidated} cache entries for tag: ${tag}`);

  return invalidated;
}

/**
 * Invalidate multiple tags at once
 *
 * @param tags - Tags to invalidate
 */
export async function invalidateByTags(tags: string[]): Promise<number> {
  let total = 0;
  for (const tag of tags) {
    total += await invalidateByTag(tag);
  }
  return total;
}

/**
 * Warm cache with frequently accessed data
 *
 * @param warmupFn - Function that returns key-value pairs to cache
 * @param ttlSeconds - Time to live for warmed entries
 */
export async function warmCache(
  warmupFn: () => Promise<Array<{ key: string; value: unknown; tags?: string[] }>>,
  ttlSeconds: number = 3600
): Promise<void> {
  try {
    const entries = await warmupFn();
    for (const entry of entries) {
      await setWithTags(entry.key, entry.value, ttlSeconds, entry.tags || []);
    }
    logInfo(`Warmed cache with ${entries.length} entries`);
  } catch (error) {
    logWarn("Cache warming failed", { error });
  }
}

/**
 * Check cache coherency (verify cached data is still valid)
 *
 * @param key - Cache key to check
 * @param validator - Function that validates cached value
 * @returns True if cache is coherent, false if invalid
 */
export async function checkCoherency<T>(
  key: string,
  validator: (value: T) => Promise<boolean>
): Promise<boolean> {
  const cached = await get<T>(key);
  if (!cached) {
    return false;
  }

  try {
    const isValid = await validator(cached);
    if (!isValid) {
      await del(key);
      logWarn("Cache coherency check failed, invalidated", { key });
      return false;
    }
    return true;
  } catch (error) {
    logWarn("Cache coherency check error", { key, error });
    return false;
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  tagCount: number;
  tags: string[];
  totalKeys: number;
} {
  const allKeys = new Set<string>();
  for (const keys of tagIndex.values()) {
    for (const key of keys) {
      allKeys.add(key);
    }
  }

  return {
    tagCount: tagIndex.size,
    tags: Array.from(tagIndex.keys()),
    totalKeys: allKeys.size,
  };
}

/**
 * Clear all cache and tags
 */
export async function clearAllCache(): Promise<void> {
  tagIndex.clear();
  // Note: This would need to clear Redis cache as well
  // Implementation depends on cache utility
}
