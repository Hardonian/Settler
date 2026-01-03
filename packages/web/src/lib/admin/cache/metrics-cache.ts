/**
 * Metrics Cache Layer
 * 
 * In-memory cache for metrics snapshots with TTL.
 * Can be extended to use Redis in production.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MetricsCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly DEFAULT_TTL = 30 * 1000; // 30 seconds

  /**
   * Get cached value
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cached value
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Invalidate cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getStats() {
    const now = Date.now();
    let valid = 0;
    let expired = 0;

    for (const entry of this.cache.values()) {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        expired++;
      } else {
        valid++;
      }
    }

    return {
      total: this.cache.size,
      valid,
      expired,
    };
  }
}

// Singleton instance
export const metricsCache = new MetricsCache();

/**
 * Cache key generators
 */
export const cacheKeys = {
  metrics: (range: string, tenantId?: string) =>
    `metrics:${range}:${tenantId || 'all'}`,
  exceptions: (params: Record<string, unknown>) =>
    `exceptions:${JSON.stringify(params)}`,
  runs: (params: Record<string, unknown>) =>
    `runs:${JSON.stringify(params)}`,
  audit: (params: Record<string, unknown>) =>
    `audit:${JSON.stringify(params)}`,
};
