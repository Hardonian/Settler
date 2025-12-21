/**
 * Rate Limiting Utilities
 * 
 * Provides rate limiting for API routes to prevent abuse.
 * Uses in-memory store (can be replaced with Redis for distributed systems).
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

const store: RateLimitStore = {};
const CLEANUP_INTERVAL = 60000; // 1 minute

// Cleanup expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const key in store) {
    if (store[key].resetAt < now) {
      delete store[key];
    }
  }
}, CLEANUP_INTERVAL);

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (request: Request) => string; // Custom key generator
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

/**
 * Check rate limit
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = store[key];
  
  // If no entry or expired, create new entry
  if (!entry || entry.resetAt < now) {
    store[key] = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    };
  }
  
  // Increment count
  entry.count++;
  
  // Check if limit exceeded
  if (entry.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }
  
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Generate rate limit key from request
 */
export function generateRateLimitKey(request: Request, prefix: string = 'api'): string {
  const url = new URL(request.url);
  const userId = request.headers.get('x-user-id') || 'anonymous';
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  return `${prefix}:${url.pathname}:${userId}:${ip}`;
}

import type { NextRequest, NextResponse } from 'next/server';

/**
 * Rate limit middleware for Next.js route handlers
 */
export function withRateLimit(
  config: RateLimitConfig,
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const { NextResponse: NextResponseClass } = await import('next/server');
    const key = config.keyGenerator 
      ? config.keyGenerator(request as Request)
      : generateRateLimitKey(request as Request);
    
    const result = checkRateLimit(key, config);
    
    if (!result.allowed) {
      return NextResponseClass.json(
        {
          error: 'Rate Limit Exceeded',
          message: `Too many requests. Please try again after ${result.retryAfter} seconds.`,
          retryAfter: result.retryAfter,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': new Date(result.resetAt).toISOString(),
            'Retry-After': result.retryAfter?.toString() || '60',
          },
        }
      );
    }
    
    // Add rate limit headers to response
    const response = await handler(request);
    const headers = new Headers(response.headers);
    headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    headers.set('X-RateLimit-Remaining', result.remaining.toString());
    headers.set('X-RateLimit-Reset', new Date(result.resetAt).toISOString());
    
    return new NextResponseClass(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}

/**
 * Default rate limit configs
 */
export const RATE_LIMIT_CONFIGS = {
  // Strict limits for authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  },
  
  // Standard API limits
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
  },
  
  // Console API limits
  console: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
  
  // Logging endpoints (more lenient)
  logs: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200,
  },
  
  // Admin endpoints (stricter)
  admin: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
  },
} as const;
