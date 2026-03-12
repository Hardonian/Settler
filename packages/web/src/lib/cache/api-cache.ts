/**
 * API Response Caching
 *
 * Provides caching layer for API responses to improve performance.
 * Uses in-memory cache (can be replaced with Redis for distributed systems).
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  key: string;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CLEANUP_INTERVAL = 60000; // 1 minute

// Cleanup expired entries periodically. `unref` ensures this best-effort
// maintenance timer does not keep one-off processes (build/doctor) alive.
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt < now) {
      cache.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

cleanupTimer.unref?.();

export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  keyGenerator?: (request: Request) => string;
  shouldCache?: (response: Response) => boolean;
}

/**
 * Generate cache key from request
 */
export function generateCacheKey(request: Request, prefix: string = "api"): string {
  const url = new URL(request.url);
  const method = request.method;
  const userId = request.headers.get("x-user-id") || "anonymous";

  // Include query params in key
  const queryString = url.searchParams.toString();
  const queryHash = queryString ? `:${queryString}` : "";

  return `${prefix}:${method}:${url.pathname}${queryHash}:${userId}`;
}

/**
 * Get cached response
 */
export function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;

  if (!entry) {
    return null;
  }

  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

/**
 * Set cache entry
 */
export function setCached<T>(key: string, data: T, ttl: number): void {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttl,
    key,
  });
}

/**
 * Clear cache entry
 */
export function clearCache(key: string): void {
  cache.delete(key);
}

/**
 * Clear all cache
 */
export function clearAllCache(): void {
  cache.clear();
}

import type { NextRequest, NextResponse } from "next/server";

/**
 * Cache middleware for Next.js route handlers
 */
export function withCache(
  config: CacheConfig,
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const { NextResponse: NextResponseClass } = await import("next/server");
    // Only cache GET requests
    if (request.method !== "GET") {
      return handler(request);
    }

    const key = config.keyGenerator
      ? config.keyGenerator(request as Request)
      : generateCacheKey(request as Request);

    // Check cache
    const cached = getCached<{ body: unknown; headers: HeadersInit }>(key);
    if (cached) {
      return NextResponseClass.json(cached.body, {
        headers: {
          "X-Cache": "HIT",
          ...cached.headers,
        },
      });
    }

    // Execute handler
    const response = await handler(request);

    // Check if should cache
    if (config.shouldCache && !config.shouldCache(response)) {
      return response;
    }

    // Only cache successful responses
    if (response.status >= 200 && response.status < 300) {
      try {
        const clonedResponse = response.clone();
        const contentType = clonedResponse.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
          const data = await clonedResponse.json();
          const headers: HeadersInit = {};
          clonedResponse.headers.forEach((value, key) => {
            if (!key.toLowerCase().startsWith("x-")) {
              headers[key] = value;
            }
          });

          setCached(key, { body: data, headers }, config.ttl);
        }
      } catch {
        // Ignore caching errors
      }
    }

    // Add cache header
    const newHeaders = new Headers(response.headers);
    newHeaders.set("X-Cache", "MISS");

    return new NextResponseClass(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  };
}

/**
 * Default cache configs
 */
export const CACHE_CONFIGS = {
  // Short cache for frequently accessed data
  short: {
    ttl: 30 * 1000, // 30 seconds
  },

  // Medium cache for moderately changing data
  medium: {
    ttl: 5 * 60 * 1000, // 5 minutes
  },

  // Long cache for rarely changing data
  long: {
    ttl: 30 * 60 * 1000, // 30 minutes
  },

  // Cache for tenant data (longer TTL)
  tenant: {
    ttl: 10 * 60 * 1000, // 10 minutes
  },

  // Cache for API logs (shorter TTL)
  logs: {
    ttl: 10 * 1000, // 10 seconds
  },
} as const;
