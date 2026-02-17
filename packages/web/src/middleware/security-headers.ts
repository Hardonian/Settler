/**
 * Security Headers Middleware
 *
 * Adds security headers to all responses.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  const cspReportOnly = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://*.upstash.io https://vercel.live https://status.settler.dev wss://*.supabase.co",
    "frame-src 'self' https://vercel.live https://js.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; ');

  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Content-Security-Policy-Report-Only', cspReportOnly);

  return response;
}

/**
 * Middleware function to apply security headers
 */
export function securityHeadersMiddleware(_request: NextRequest) {
  const response = NextResponse.next();
  return addSecurityHeaders(response);
}
