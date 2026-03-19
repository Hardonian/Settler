/**
 * Rate Limiting Utilities
 *
 * Simple in-memory rate limiting for admin endpoints.
 * Can be extended to use Redis in production.
 */

import { createHash } from "crypto";

interface RateLimitEntry {
  count: number;
  resetAt: number;
  createdAt: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private readonly DEFAULT_WINDOW_MS = 60 * 1000; // 1 minute
  private readonly DEFAULT_MAX_REQUESTS = 60; // 60 requests per minute
  private readonly MAX_TRACKED_KEYS = 10_000;

  /**
   * Check if request should be rate limited
   */
  check(
    key: string,
    maxRequests: number = this.DEFAULT_MAX_REQUESTS,
    windowMs: number = this.DEFAULT_WINDOW_MS
  ): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    // Clean up expired entries
    if (entry && entry.resetAt < now) {
      this.store.delete(key);
    }

    const currentEntry = this.store.get(key);

    if (!currentEntry) {
      if (this.store.size >= this.MAX_TRACKED_KEYS) {
        this.pruneStore();
      }

      // First request - create entry
      const resetAt = now + windowMs;
      this.store.set(key, {
        count: 1,
        resetAt,
        createdAt: now,
      });

      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetAt,
      };
    }

    if (currentEntry.count >= maxRequests) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetAt: currentEntry.resetAt,
      };
    }

    // Increment count
    currentEntry.count++;
    this.store.set(key, currentEntry);

    return {
      allowed: true,
      remaining: maxRequests - currentEntry.count,
      resetAt: currentEntry.resetAt,
    };
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt < now) {
        this.store.delete(key);
      }
    }
  }

  private pruneStore(): void {
    this.cleanup();
    if (this.store.size < this.MAX_TRACKED_KEYS) {
      return;
    }

    // If the store remains saturated, evict oldest reset windows first.
    const sorted = Array.from(this.store.entries()).sort((a, b) => a[1].resetAt - b[1].resetAt);
    const targetSize = Math.floor(this.MAX_TRACKED_KEYS * 0.9);
    const removeCount = Math.max(1, this.store.size - targetSize);

    for (let index = 0; index < removeCount && index < sorted.length; index += 1) {
      const key = sorted[index]?.[0];
      if (key) {
        this.store.delete(key);
      }
    }
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Cleanup expired entries every 5 minutes
if (typeof setInterval !== "undefined") {
  const cleanupTimer = setInterval(
    () => {
      rateLimiter.cleanup();
    },
    5 * 60 * 1000
  );

  cleanupTimer.unref?.();
}

/**
 * Get rate limit key from request
 */
export function getRateLimitKey(request: Request): string {
  // Use method + normalized route + client fingerprint for predictable buckets.
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0]?.trim() : "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  const method = request.method || "GET";
  const pathname = getPathname(request);
  const normalizedPath = normalizePathname(pathname);

  // Hash for privacy
  return createHash("sha256")
    .update(`${method}:${normalizedPath}:${ip}:${userAgent}`)
    .digest("hex");
}

function getPathname(request: Request): string {
  try {
    if ("nextUrl" in request && (request as { nextUrl?: URL }).nextUrl) {
      return ((request as { nextUrl: URL }).nextUrl.pathname || "/").toLowerCase();
    }

    return new URL(request.url).pathname.toLowerCase();
  } catch {
    return "/";
  }
}

function normalizePathname(pathname: string): string {
  return pathname
    .replace(
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi,
      ":uuid"
    )
    .replace(/\b\d{4,}\b/g, ":id")
    .replace(/\/{2,}/g, "/");
}
