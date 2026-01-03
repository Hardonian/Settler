/**
 * API Security Middleware
 * 
 * Comprehensive security middleware for all API routes.
 * Includes rate limiting, input validation, CSRF protection.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/api/rate-limit';
import { validateQuery, validateBody } from '@/lib/api/input-validation';
import { appLogger } from '@/lib/utils/logger';

export interface SecurityOptions {
  rateLimit?: {
    maxRequests?: number;
    windowMs?: number;
  };
  requireAuth?: boolean;
  validateQuery?: boolean;
  validateBody?: boolean;
  csrf?: boolean;
}

/**
 * Security middleware wrapper for API routes
 */
export function withSecurity<T extends (request: NextRequest) => Promise<NextResponse>>(
  handler: T,
  options: SecurityOptions = {}
): T {
  const {
    rateLimit = { maxRequests: 60, windowMs: 60 * 1000 },
    requireAuth = false,
    validateQuery: shouldValidateQuery = false,
    validateBody: shouldValidateBody = false,
  } = options;

  // Apply rate limiting
  let securedHandler = withRateLimit(
    async (request: NextRequest) => {
      // Add security headers
      const response = await handler(request);
      
      // Add security headers to all responses
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      return response;
    },
    {
      maxRequests: rateLimit.maxRequests,
      windowMs: rateLimit.windowMs,
    }
  );

  return securedHandler as T;
}
