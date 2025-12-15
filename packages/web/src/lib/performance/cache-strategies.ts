/**
 * Cache Strategies for Performance Optimization
 * Implements various caching strategies for API routes and static content
 */

export interface CacheOptions {
  maxAge?: number; // seconds
  sMaxAge?: number; // seconds (CDN cache)
  staleWhileRevalidate?: number; // seconds
  revalidate?: number; // seconds (ISR)
}

/**
 * Generate Cache-Control header
 */
export function generateCacheControl(options: CacheOptions = {}): string {
  const {
    maxAge = 3600, // 1 hour default
    sMaxAge = 86400, // 24 hours for CDN
    staleWhileRevalidate = 86400, // 24 hours
  } = options;

  const directives = [
    `public`,
    `max-age=${maxAge}`,
    `s-maxage=${sMaxAge}`,
    `stale-while-revalidate=${staleWhileRevalidate}`,
  ];

  return directives.join(', ');
}

/**
 * Cache strategies for different content types
 */
export const CACHE_STRATEGIES = {
  // Static content - cache for a long time
  STATIC: {
    maxAge: 31536000, // 1 year
    sMaxAge: 31536000,
    staleWhileRevalidate: 86400,
  },
  
  // Dynamic content - short cache
  DYNAMIC: {
    maxAge: 60, // 1 minute
    sMaxAge: 300, // 5 minutes
    staleWhileRevalidate: 3600,
  },
  
  // API responses - medium cache
  API: {
    maxAge: 300, // 5 minutes
    sMaxAge: 3600, // 1 hour
    staleWhileRevalidate: 86400,
  },
  
  // User-specific content - no cache
  USER_SPECIFIC: {
    maxAge: 0,
    sMaxAge: 0,
    staleWhileRevalidate: 0,
  },
  
  // SEO content - long cache
  SEO: {
    maxAge: 3600, // 1 hour
    sMaxAge: 86400, // 24 hours
    staleWhileRevalidate: 86400,
  },
} as const;

/**
 * Get cache headers for response
 */
export function getCacheHeaders(strategy: keyof typeof CACHE_STRATEGIES): HeadersInit {
  const cacheControl = generateCacheControl(CACHE_STRATEGIES[strategy]);
  
  return {
    'Cache-Control': cacheControl,
    'Vary': 'Accept-Encoding',
  };
}

/**
 * In-memory cache for API responses (simple implementation)
 */
class SimpleCache {
  private cache = new Map<string, { data: any; expires: number }>();
  
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }
  
  set<T>(key: string, data: T, ttl: number = 3600): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl * 1000,
    });
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
}

export const apiCache = new SimpleCache();
