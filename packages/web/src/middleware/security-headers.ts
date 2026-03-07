/**
 * Security Headers Middleware
 *
 * Adds hardened security headers to all responses.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

interface SecurityHeaderOptions {
  nonce?: string;
}

function buildCsp(nonce?: string): string {
  const scriptDirective = nonce
    ? `'self' 'nonce-${nonce}' https://vercel.live`
    : "'self' https://vercel.live";
  const styleDirective = nonce ? `'self' 'nonce-${nonce}'` : "'self'";

  return [
    "default-src 'self'",
    `script-src ${scriptDirective}`,
    `style-src ${styleDirective}`,
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://*.upstash.io https://vercel.live https://status.settler.dev wss://*.supabase.co",
    "frame-src 'self' https://vercel.live https://js.stripe.com",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

/**
 * Add security headers to response
 */
export function addSecurityHeaders(
  response: NextResponse,
  options: SecurityHeaderOptions = {}
): NextResponse {
  const csp = buildCsp(options.nonce);

  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Content-Security-Policy", csp);

  return response;
}

/**
 * Middleware function to apply security headers
 */
export function securityHeadersMiddleware(_request: NextRequest) {
  const response = NextResponse.next();
  return addSecurityHeaders(response);
}
