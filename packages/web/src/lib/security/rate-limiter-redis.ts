/**
 * Redis-Backed Rate Limiting
 * 
 * Distributed rate limiting using Upstash Redis.
 * Falls back to in-memory store if Redis unavailable.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient, isRedisAvailable, safeRedisOperation } from '@/lib/redis/client';

// Optional Redis type - gracefully handles if package not installed
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Redis = any;

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory fallback store
const fallbackStore: RateLimitStore = {};

/**
 * Get rate limit key from request
 */
function getRateLimitKey(req: NextRequest, identifier?: string): string {
  if (identifier) {
    return `rate_limit:${identifier}`;
  }

  const apiKey = req.headers.get('x-api-key');
  if (apiKey) {
    return `rate_limit:api_key:${apiKey.substring(0, 20)}`;
  }

  const userId = req.headers.get('x-user-id');
  if (userId) {
    return `rate_limit:user:${userId}`;
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0] ||
    req.headers.get('x-real-ip') ||
    'unknown';
  return `rate_limit:ip:${ip}`;
}

/**
 * Redis-backed rate limit check
 */
async function checkRedisRateLimit(
  client: Redis,
  key: string,
  windowMs: number,
  maxRequests: number
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const now = Date.now();
  const windowKey = `${key}:${Math.floor(now / windowMs)}`;
  const resetTime = (Math.floor(now / windowMs) + 1) * windowMs;

  // Increment and get count atomically
  const count = await client.incr(windowKey);
  await client.expire(windowKey, Math.ceil(windowMs / 1000));

  const remaining = Math.max(0, maxRequests - count);
  const allowed = count <= maxRequests;

  return { allowed, remaining, resetTime };
}

/**
 * In-memory rate limit check (fallback)
 */
function checkMemoryRateLimit(
  key: string,
  windowMs: number,
  maxRequests: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  let entry = fallbackStore[key];

  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + windowMs,
    };
    fallbackStore[key] = entry;
  }

  entry.count++;
  const remaining = Math.max(0, maxRequests - entry.count);
  const allowed = entry.count <= maxRequests;

  return {
    allowed,
    remaining,
    resetTime: entry.resetTime,
  };
}

/**
 * Redis-backed rate limit middleware
 */
export function rateLimitRedis(
  config: RateLimitConfig
): (req: NextRequest) => Promise<NextResponse | null> {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    const key = getRateLimitKey(req);

    const result = await safeRedisOperation(
      async (client) => {
        return await checkRedisRateLimit(client, key, config.windowMs, config.maxRequests);
      },
      () => {
        return checkMemoryRateLimit(key, config.windowMs, config.maxRequests);
      }
    );

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: config.message || 'Too many requests',
          retryAfter,
          limit: config.maxRequests,
          remaining: 0,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.resetTime.toString(),
          },
        }
      );
    }

    // Add rate limit headers
    const response = new NextResponse();
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.resetTime.toString());

    return null; // Continue to next middleware
  };
}

/**
 * Pre-configured Redis-backed rate limiters
 */
export const redisRateLimiters = {
  auth: rateLimitRedis({
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    message: 'Too many authentication attempts. Please try again later.',
  }),
  api: rateLimitRedis({
    windowMs: 60 * 1000,
    maxRequests: 100,
    message: 'API rate limit exceeded. Please slow down.',
  }),
  billing: rateLimitRedis({
    windowMs: 60 * 1000,
    maxRequests: 20,
    message: 'Billing API rate limit exceeded.',
  }),
  webhook: rateLimitRedis({
    windowMs: 60 * 1000,
    maxRequests: 10,
    message: 'Webhook rate limit exceeded.',
  }),
  public: rateLimitRedis({
    windowMs: 60 * 1000,
    maxRequests: 200,
    message: 'Rate limit exceeded.',
  }),
};
