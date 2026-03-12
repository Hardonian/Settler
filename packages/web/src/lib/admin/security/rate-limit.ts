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
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private readonly DEFAULT_WINDOW_MS = 60 * 1000; // 1 minute
  private readonly DEFAULT_MAX_REQUESTS = 60; // 60 requests per minute

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
      // First request - create entry
      const resetAt = now + windowMs;
      this.store.set(key, {
        count: 1,
        resetAt,
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
  // Use IP address + user agent for rate limiting
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  // Hash for privacy
  return createHash("sha256").update(`${ip}:${userAgent}`).digest("hex");
}
