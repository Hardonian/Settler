/**
 * API Security Middleware
 *
 * Provides CSRF protection, origin validation, request size limits,
 * and other security measures for API routes
 *
 * Priority: P0 (Critical - API security)
 */

import { NextRequest, NextResponse } from "next/server";
import { withRateLimit, RATE_LIMIT_CONFIGS } from "./rate-limiter";

/**
 * CSRF token validation
 */
export function validateCSRFToken(req: NextRequest): boolean {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return true;
  }

  // Skip CSRF for webhooks (they use signature validation instead)
  const path = req.nextUrl.pathname;
  if (path.includes("/webhook/") || path.includes("/api/webhook/")) {
    return true;
  }

  // Get CSRF token from header
  const csrfToken = req.headers.get("x-csrf-token");
  const cookieToken = req.cookies.get("csrf-token")?.value;

  // For API routes, we can skip CSRF if using API key authentication
  const apiKey = req.headers.get("x-api-key");
  if (apiKey) {
    return true; // API key authentication bypasses CSRF
  }

  // Validate CSRF token
  if (!csrfToken || csrfToken !== cookieToken) {
    return false;
  }

  return true;
}

/**
 * Origin validation
 */
export function validateOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  // Allow same-origin requests
  if (!origin && !referer) {
    return true; // Same-origin (no origin header)
  }

  // Get allowed origins from environment
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ];

  // Check origin
  if (origin) {
    try {
      const originUrl = new URL(origin);
      const isAllowed = allowedOrigins.some((allowed) => {
        try {
          const allowedUrl = new URL(allowed);
          return (
            originUrl.protocol === allowedUrl.protocol &&
            originUrl.hostname === allowedUrl.hostname &&
            originUrl.port === allowedUrl.port
          );
        } catch {
          return origin === allowed; // Fallback to string comparison
        }
      });

      if (!isAllowed) {
        return false;
      }
    } catch {
      return false; // Invalid origin URL
    }
  }

  return true;
}

/**
 * Request size validation
 */
export function validateRequestSize(req: NextRequest, maxSizeBytes: number = 1024 * 1024): boolean {
  const contentLength = req.headers.get("content-length");
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (size > maxSizeBytes) {
      return false;
    }
  }

  return true;
}

/**
 * API security middleware wrapper
 */
export function withAPISecurity(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: {
    rateLimit?: "auth" | "api" | "billing" | "webhook" | "public";
    requireAuth?: boolean;
    requireCSRF?: boolean;
    requireOrigin?: boolean;
    maxRequestSize?: number;
  } = {}
): (req: NextRequest) => Promise<NextResponse> {
  let wrappedHandler = handler;
  
  // Rate limiting
  if (options.rateLimit) {
    const config = RATE_LIMIT_CONFIGS[options.rateLimit] || RATE_LIMIT_CONFIGS.api;
    wrappedHandler = withRateLimit(config, wrappedHandler);
  }
  
  return async (req: NextRequest): Promise<NextResponse> => {

    // Request size validation
    if (options.maxRequestSize) {
      if (!validateRequestSize(req, options.maxRequestSize)) {
        return NextResponse.json({ error: "Request too large" }, { status: 413 });
      }
    }

    // Origin validation
    if (options.requireOrigin !== false) {
      if (!validateOrigin(req)) {
        return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
      }
    }

    // CSRF protection
    if (options.requireCSRF !== false) {
      if (!validateCSRFToken(req)) {
        return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
      }
    }

    // Authentication (basic check - actual auth should be done in handler)
    if (options.requireAuth) {
      const apiKey = req.headers.get("x-api-key");
      const authHeader = req.headers.get("authorization");

      if (!apiKey && !authHeader) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }
    }

    // Call wrapped handler (with rate limiting if applied)
    return wrappedHandler(req);
  };
}

/**
 * Error sanitization for production
 */
export function sanitizeError(error: unknown): {
  message: string;
  code?: string;
} {
  const isProduction = process.env.NODE_ENV === "production";

  if (error instanceof Error) {
    // In production, don't leak stack traces or internal details
    if (isProduction) {
      return {
        message: "An error occurred",
        code: "INTERNAL_ERROR",
      };
    }

    return {
      message: error.message,
      code: error.name,
    };
  }

  return {
    message: "An unknown error occurred",
    code: "UNKNOWN_ERROR",
  };
}

/**
 * Security headers for API responses
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // XSS protection
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Strict transport security (HTTPS only)
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  // Content security policy
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  );

  // Referrer policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}
