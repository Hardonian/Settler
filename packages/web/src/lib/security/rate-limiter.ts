/**
 * Rate Limiting Middleware for API Routes
 *
 * Implements per-IP, per-user, and per-API-key rate limiting
 * Uses in-memory store (for serverless) with optional Redis support
 *
 * Priority: P0 (Critical - API abuse prevention)
 */

import { NextRequest, NextResponse } from "next/server";

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (for serverless - consider Redis for production)
const rateLimitStore: RateLimitStore = {};

// Cleanup expired entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(
    () => {
      const now = Date.now();
      Object.keys(rateLimitStore).forEach((key) => {
        const entry = rateLimitStore[key];
        if (entry && entry.resetTime < now) {
          delete rateLimitStore[key];
        }
      });
    },
    5 * 60 * 1000
  );
}

/**
 * Get rate limit key from request
 */
function getRateLimitKey(req: NextRequest, identifier?: string): string {
  // Priority: API key > User ID > IP address
  if (identifier) {
    return `rate_limit:${identifier}`;
  }

  const apiKey = req.headers.get("x-api-key");
  if (apiKey) {
    return `rate_limit:api_key:${apiKey.substring(0, 20)}`;
  }

  const userId = req.headers.get("x-user-id");
  if (userId) {
    return `rate_limit:user:${userId}`;
  }

  // Fallback to IP address
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "unknown";
  return `rate_limit:ip:${ip}`;
}

/**
 * Rate limit middleware
 */
export function rateLimit(config: RateLimitConfig) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    const key = getRateLimitKey(req);
    const now = Date.now();

    // Get or create rate limit entry
    let entry = rateLimitStore[key];
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
      };
      rateLimitStore[key] = entry;
    }

    // Increment count
    entry.count++;

    // Check if limit exceeded
    if (entry.count > config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      return NextResponse.json(
        {
          error: config.message || "Too many requests",
          retryAfter,
          limit: config.maxRequests,
          remaining: 0,
        },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfter.toString(),
            "X-RateLimit-Limit": config.maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": entry.resetTime.toString(),
          },
        }
      );
    }

    // Add rate limit headers
    const response = new NextResponse();
    response.headers.set("X-RateLimit-Limit", config.maxRequests.toString());
    response.headers.set(
      "X-RateLimit-Remaining",
      Math.max(0, config.maxRequests - entry.count).toString()
    );
    response.headers.set("X-RateLimit-Reset", entry.resetTime.toString());

    return null; // Continue to next middleware
  };
}

/**
 * Pre-configured rate limiters for different endpoint types
 */
export const rateLimiters = {
  // Strict rate limit for authentication endpoints
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 requests per 15 minutes
    message: "Too many authentication attempts. Please try again later.",
  }),

  // Standard rate limit for API endpoints
  api: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    message: "API rate limit exceeded. Please slow down.",
  }),

  // Strict rate limit for billing endpoints
  billing: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // 20 requests per minute
    message: "Billing API rate limit exceeded.",
  }),

  // Very strict rate limit for webhook endpoints
  webhook: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute
    message: "Webhook rate limit exceeded.",
  }),

  // Lenient rate limit for public endpoints
  public: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200, // 200 requests per minute
    message: "Rate limit exceeded.",
  }),
};

/**
 * Get rate limit configuration from API key (if exists)
 */
export async function getRateLimitFromApiKey(_apiKey: string): Promise<RateLimitConfig | null> {
  // TODO: Query database for API key rate limit
  // For now, return null (use default)
  // Parameter prefixed with _ to indicate intentionally unused
  return null;
}
