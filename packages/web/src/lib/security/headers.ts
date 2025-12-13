/**
 * Security Headers Configuration
 * 
 * Provides security headers for Next.js API routes and pages.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Security headers for API routes
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // 'unsafe-eval' needed for Next.js
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://*.stripe.com https://*.upstash.io",
    "frame-src 'self' https://js.stripe.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; ');

  // Set security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Content-Security-Policy', csp);

  // Strict Transport Security (only in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  return response;
}

/**
 * CORS headers for API routes
 */
export function addCorsHeaders(
  response: NextResponse,
  origin?: string | null
): NextResponse {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
  const isAllowed = allowedOrigins.includes('*') || 
                    (origin && allowedOrigins.includes(origin));

  if (isAllowed) {
    response.headers.set('Access-Control-Allow-Origin', origin || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400');
  }

  return response;
}

/**
 * Rate limit headers
 */
export function addRateLimitHeaders(
  response: NextResponse,
  remaining: number,
  reset: number
): NextResponse {
  response.headers.set('X-RateLimit-Remaining', String(remaining));
  response.headers.set('X-RateLimit-Reset', String(reset));
  return response;
}

/**
 * Request size limit check
 */
export function checkRequestSize(request: NextRequest, maxSizeBytes = 10 * 1024 * 1024): boolean {
  const contentLength = request.headers.get('content-length');
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    return size <= maxSizeBytes;
  }
  return true; // Unknown size, allow (will fail on actual read if too large)
}
