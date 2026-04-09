/**
 * Cache Headers Middleware
 * Sets appropriate cache headers for safe GET endpoints
 */

import { Request, Response, NextFunction } from "express";

export interface CacheOptions {
  maxAge?: number; // Cache duration in seconds
  sMaxAge?: number; // Shared cache (CDN) duration in seconds
  staleWhileRevalidate?: number; // Serve stale content while revalidating
  mustRevalidate?: boolean; // Force revalidation after expiration
  noCache?: boolean; // Disable caching
  noStore?: boolean; // Don't store response
  private?: boolean; // Private cache only (no CDN)
}

/**
 * Set cache headers on response
 */
export function setCacheHeaders(res: Response, options: CacheOptions = {}): void {
  const {
    maxAge = 0,
    sMaxAge,
    staleWhileRevalidate,
    mustRevalidate = false,
    noCache = false,
    noStore = false,
    private: isPrivate = false,
  } = options;

  if (noStore) {
    res.setHeader("Cache-Control", "no-store");
    return;
  }

  if (noCache) {
    res.setHeader("Cache-Control", "no-cache, must-revalidate");
    return;
  }

  const directives: string[] = [];

  if (isPrivate) {
    directives.push("private");
  } else {
    directives.push("public");
  }

  if (maxAge > 0) {
    directives.push(`max-age=${maxAge}`);
  }

  if (sMaxAge !== undefined) {
    directives.push(`s-maxage=${sMaxAge}`);
  }

  if (staleWhileRevalidate !== undefined && staleWhileRevalidate > 0) {
    directives.push(`stale-while-revalidate=${staleWhileRevalidate}`);
  }

  if (mustRevalidate) {
    directives.push("must-revalidate");
  }

  res.setHeader("Cache-Control", directives.join(", "));
}

/**
 * Cache middleware factory
 */
export function cacheMiddleware(options: CacheOptions = {}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Only apply to GET/HEAD requests
    if (req.method !== "GET" && req.method !== "HEAD") {
      return next();
    }

    setCacheHeaders(res, options);
    next();
  };
}

/**
 * Cache headers for different endpoint types
 */
export const cachePresets = {
  // No caching (default for dynamic content)
  noCache: (): CacheOptions => ({ noCache: true }),

  // Short cache (1 minute) for frequently changing data
  short: (): CacheOptions => ({ maxAge: 60, staleWhileRevalidate: 300 }),

  // Medium cache (5 minutes) for moderately changing data
  medium: (): CacheOptions => ({ maxAge: 300, staleWhileRevalidate: 600 }),

  // Long cache (1 hour) for relatively static data
  long: (): CacheOptions => ({ maxAge: 3600, staleWhileRevalidate: 7200 }),

  // Static cache (1 day) for rarely changing data
  static: (): CacheOptions => ({ maxAge: 86400, sMaxAge: 86400 }),

  // Private cache only (user-specific data)
  private: (maxAge: number = 300): CacheOptions => ({
    private: true,
    maxAge,
    mustRevalidate: true,
  }),
};
