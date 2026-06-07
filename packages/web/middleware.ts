/**
 * Next.js Middleware
 *
 * CTO Mode: Deployment Guardrails
 * - Handles Supabase auth cookie refresh
 * - Protects routes requiring authentication
 * - Must be at root of project (not in src/)
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { addSecurityHeaders } from "./src/middleware/security-headers";
import { generateTraceId } from "./src/lib/observability/trace";
import { isAppAuthRequiredRoute } from "./src/lib/auth/route-gating";
import { getAppEnvStatus } from "./src/lib/env/runtime-access";
// Use edge-safe logger — middleware runs on Edge Runtime where Node-only APIs are unavailable.
import { edgeLogger as serverLogger } from "./src/lib/observability/edge-logger";

export async function middleware(request: NextRequest): Promise<NextResponse> {
  // CRITICAL: Wrap entire middleware in try-catch to prevent any 500 errors
  try {
    const pathname = request.nextUrl.pathname;
    const isApiRoute = pathname.startsWith("/api");
    const nonce = createCspNonce();
    // Generate or get trace_id
    let traceId = request.headers.get("x-trace-id") || request.cookies.get("trace-id")?.value;
    if (!traceId) {
      traceId = generateTraceId();
    }
    const traceCookieOptions: CookieOptions = {
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    };
    if (process.env.MIDDLEWARE_LOG_REQUESTS === "true") {
      serverLogger.info("middleware.request", {
        trace_id: traceId,
        method: request.method,
        path: pathname,
      });
    }

    const applyTraceContext = (
      nextResponse: NextResponse,
      options: { persistTraceCookie?: boolean } = {}
    ): NextResponse => {
      const { persistTraceCookie = true } = options;
      nextResponse.headers.set("x-trace-id", traceId);
      nextResponse.headers.set("x-request-id", traceId);
      if (nonce) {
        nextResponse.headers.set("x-csp-nonce", nonce);
      }
      if (persistTraceCookie) {
        nextResponse.cookies.set("trace-id", traceId, traceCookieOptions);
      }
      return nextResponse;
    };

    // Explicitly bypass Stripe webhook - it needs raw body and no auth
    if (request.nextUrl.pathname === "/api/stripe/webhook") {
      const response = NextResponse.next({
        request: {
          headers: new Headers(request.headers),
        },
      });
      applyTraceContext(response, { persistTraceCookie: false });
      return addSecurityHeaders(response, { nonce });
    }

    const isAuthRequiredRoute = !isApiRoute && isAppAuthRequiredRoute(pathname);

    let response = NextResponse.next({
      request: {
        headers: new Headers(request.headers),
      },
    });

    // Add trace_id to response headers
    applyTraceContext(response, { persistTraceCookie: !isApiRoute });

    const appEnvStatus = getAppEnvStatus();
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey =
      process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!appEnvStatus.ok || !supabaseUrl || !supabaseAnonKey) {
      // If Supabase not configured, skip auth middleware for public/API routes
      // Public routes should still work; protected routes fail closed.
      if (isAuthRequiredRoute) {
        const redirectUrl = new URL("/login", request.url);
        redirectUrl.searchParams.set("next", pathname);
        const redirectResponse = NextResponse.redirect(redirectUrl);
        redirectResponse.headers.set("x-trace-id", traceId);
        redirectResponse.headers.set("x-request-id", traceId);
        if (nonce) {
          redirectResponse.headers.set("x-csp-nonce", nonce);
        }
        return addSecurityHeaders(redirectResponse, { nonce });
      }
      return addSecurityHeaders(response, { nonce });
    }

    // For public and API routes, skip auth entirely
    if (!isAuthRequiredRoute) {
      return addSecurityHeaders(response, { nonce });
    }

    // For protected routes, attempt auth refresh but never throw
    try {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value,
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value,
              ...options,
            });
            applyTraceContext(response);
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value: "",
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value: "",
              ...options,
            });
            applyTraceContext(response);
          },
        },
      });

      // Refresh session if expired - required for Server Components
      // Wrap in try/catch to prevent middleware from crashing on auth errors
      try {
        const { data, error } = await supabase.auth.getUser();
        if (isAuthRequiredRoute && (error || !data?.user)) {
          const redirectUrl = new URL("/login", request.url);
          redirectUrl.searchParams.set("next", pathname);
          const redirectResponse = NextResponse.redirect(redirectUrl);
          redirectResponse.headers.set("x-trace-id", traceId);
          redirectResponse.headers.set("x-request-id", traceId);
          if (nonce) {
            redirectResponse.headers.set("x-csp-nonce", nonce);
          }
          return addSecurityHeaders(redirectResponse, { nonce });
        }
      } catch (authError) {
        // Log but don't fail - let the route handler deal with auth
        serverLogger.warn("middleware.auth_refresh_failed", {
          trace_id: traceId,
          path: pathname,
          error: authError instanceof Error ? authError.message : "Unknown error",
        });
        if (isAuthRequiredRoute) {
          const redirectUrl = new URL("/login", request.url);
          redirectUrl.searchParams.set("next", pathname);
          const redirectResponse = NextResponse.redirect(redirectUrl);
          redirectResponse.headers.set("x-trace-id", traceId);
          redirectResponse.headers.set("x-request-id", traceId);
          if (nonce) {
            redirectResponse.headers.set("x-csp-nonce", nonce);
          }
          return addSecurityHeaders(redirectResponse, { nonce });
        }
      }
    } catch (error) {
      // If Supabase client creation fails, log but continue
      // Routes will handle auth errors themselves
      serverLogger.error("middleware.supabase_client_failed", {
        trace_id: traceId,
        path: pathname,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      if (isAuthRequiredRoute) {
        const redirectUrl = new URL("/login", request.url);
        redirectUrl.searchParams.set("next", pathname);
        const redirectResponse = NextResponse.redirect(redirectUrl);
        redirectResponse.headers.set("x-trace-id", traceId);
        redirectResponse.headers.set("x-request-id", traceId);
        if (nonce) {
          redirectResponse.headers.set("x-csp-nonce", nonce);
        }
        return addSecurityHeaders(redirectResponse, { nonce });
      }
    }
    // Add security headers to all responses
    // CRITICAL: Always return a response, never throw
    return addSecurityHeaders(response, { nonce });
  } catch (error) {
    // CRITICAL: Middleware must NEVER throw - always return a valid response
    // Log error but continue with basic response
    serverLogger.error("middleware.unexpected_error", {
      error: error instanceof Error ? error.message : "Unknown error",
      path: request.nextUrl.pathname,
    });

    // Return a basic response with security headers
    const fallbackResponse = NextResponse.next({
      request: {
        headers: new Headers(request.headers),
      },
    });

    // Generate trace ID even on error
    const traceId = generateTraceId();
    fallbackResponse.headers.set("x-trace-id", traceId);
    fallbackResponse.headers.set("x-request-id", traceId);

    return addSecurityHeaders(fallbackResponse);
  }
}

function createCspNonce(): string | undefined {
  const bytes = new Uint8Array(16);

  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    const hex = crypto.randomUUID().replace(/-/g, "");
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2) || "00", 16);
    }
  } else {
    return undefined;
  }

  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  if (typeof btoa === "function") {
    return btoa(binary);
  }

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";

  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] ?? 0;
    const b = bytes[i + 1] ?? 0;
    const c = bytes[i + 2] ?? 0;

    const chunk = (a << 16) | (b << 8) | c;
    result += alphabet[(chunk >> 18) & 63];
    result += alphabet[(chunk >> 12) & 63];
    result += i + 1 < bytes.length ? alphabet[(chunk >> 6) & 63] : "=";
    result += i + 2 < bytes.length ? alphabet[chunk & 63] : "=";
  }

  return result;
}

export const config = {
  matcher: [
    /*
     * Scope middleware explicitly to authenticated routes and API
     * Marketing routes (/, /home, /pricing, etc.) are excluded to
     * ensure zero auth/env assumptions and maximum performance.
     */
    "/app/:path*",
    "/console/:path*",
    "/admin/:path*",
    "/api/:path*",
  ],
};
