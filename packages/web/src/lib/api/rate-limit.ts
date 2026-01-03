/**
 * API Rate Limiting Middleware
 * 
 * Rate limiting for all API routes with configurable limits.
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter, getRateLimitKey } from '@/lib/admin/security/rate-limit';
import { appLogger } from '@/lib/utils/logger';

export interface RateLimitOptions {
  maxRequests?: number;
  windowMs?: number;
  message?: string;
}

/**
 * Rate limit middleware for API routes
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: RateLimitOptions = {}
) {
  const {
    maxRequests = 60,
    windowMs = 60 * 1000,
    message = 'Too many requests. Please try again later.',
  } = options;

  return async (request: NextRequest): Promise<NextResponse> => {
    const rateLimitKey = getRateLimitKey(request);
    const rateLimit = rateLimiter.check(rateLimitKey, maxRequests, windowMs);
    
    if (!rateLimit.allowed) {
      appLogger.warn('Rate limit exceeded', {
        key: rateLimitKey,
        path: request.nextUrl.pathname,
      });

      return NextResponse.json(
        { 
          error: 'Too Many Requests', 
          message,
          retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimit.resetAt),
          },
        }
      );
    }

    const response = await handler(request);

    // Add rate limit headers to successful responses
    if (response.status < 400) {
      response.headers.set('X-RateLimit-Limit', String(maxRequests));
      response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
      response.headers.set('X-RateLimit-Reset', String(rateLimit.resetAt));
    }

    return response;
  };
}
