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
import { serverLogger } from "./src/lib/observability/server-logger";

export async function middleware(request: NextRequest): Promise<NextResponse> {
  // CRITICAL: Wrap entire middleware in try-catch to prevent any 500 errors
  try {
    const pathname = request.nextUrl.pathname;
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
    serverLogger.info("middleware.request", {
      trace_id: traceId,
      method: request.method,
      path: pathname,
    });

    const applyTraceContext = (nextResponse: NextResponse): NextResponse => {
      nextResponse.headers.set("x-trace-id", traceId);
      nextResponse.headers.set("x-request-id", traceId);
      nextResponse.headers.set("x-csp-nonce", nonce);
      nextResponse.cookies.set("trace-id", traceId, traceCookieOptions);
      return nextResponse;
    };

    // Explicitly bypass Stripe webhook - it needs raw body and no auth
    if (request.nextUrl.pathname === "/api/stripe/webhook") {
      const response = NextResponse.next({
        request: {
          headers: new Headers(request.headers),
        },
      });
      response.headers.set("x-trace-id", traceId);
      response.headers.set("x-request-id", traceId);
      response.headers.set("x-csp-nonce", nonce);
      return addSecurityHeaders(response, { nonce });
    }

    const isApiRoute = pathname.startsWith("/api");

    const isAuthRequiredRoute = !isApiRoute && isAppAuthRequiredRoute(pathname);

    let response = NextResponse.next({
      request: {
        headers: new Headers(request.headers),
      },
    });

    // Add trace_id to response headers
    applyTraceContext(response);

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
        redirectResponse.headers.set("x-csp-nonce", nonce);
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
          redirectResponse.headers.set("x-csp-nonce", nonce);
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
          redirectResponse.headers.set("x-csp-nonce", nonce);
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
        redirectResponse.headers.set("x-csp-nonce", nonce);
        return addSecurityHeaders(redirectResponse, { nonce });
      }
    }

    // Add route protection logic here if needed
    // Example: Protect /dashboard routes
    // const { data: { user } } = await supabase.auth.getUser();
    // if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    //   return NextResponse.redirect(new URL('/login', request.url));
    // }

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

    fallbackResponse.headers.set("x-csp-nonce", traceId);
    return addSecurityHeaders(fallbackResponse, { nonce: traceId });
  }
}

function createCspNonce(): string {
  const bytes = new Uint8Array(16);

  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
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
    "/api/:path*",
  ],
};
