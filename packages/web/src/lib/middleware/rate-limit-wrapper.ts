/**
 * Rate Limit Wrapper for API Routes
 * 
 * Applies rate limiting to API routes automatically.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit as withRateLimitMiddleware, RATE_LIMIT_CONFIGS } from '@/lib/security/rate-limiter';

export type RateLimitType = 'auth' | 'api' | 'billing' | 'webhook' | 'public';

/**
 * Wrap an API route handler with rate limiting
 */
export function withRateLimit<T>(
  handler: (request: NextRequest) => Promise<NextResponse<T>>,
  rateLimitType: RateLimitType = 'api'
) {
  const config = RATE_LIMIT_CONFIGS[rateLimitType] || RATE_LIMIT_CONFIGS.api;
  return withRateLimitMiddleware(config, handler);
}

/**
 * Get rate limit type for a route path
 */
export function getRateLimitTypeForRoute(pathname: string): RateLimitType {
  if (pathname.includes('/auth') || pathname.includes('/signup') || pathname.includes('/login')) {
    return 'auth';
  }
  if (pathname.includes('/billing') || pathname.includes('/stripe')) {
    return 'billing';
  }
  if (pathname.includes('/webhook')) {
    return 'webhook';
  }
  if (pathname.includes('/api/v1') || pathname.includes('/api/console')) {
    return 'api';
  }
  return 'public';
}
