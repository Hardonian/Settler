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

export async function middleware(request: NextRequest): Promise<NextResponse> {
  // CRITICAL: Wrap entire middleware in try-catch to prevent any 500 errors
  try {
    const pathname = request.nextUrl.pathname;
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
    const applyTraceContext = (nextResponse: NextResponse): NextResponse => {
      nextResponse.headers.set("x-trace-id", traceId);
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
      return addSecurityHeaders(response);
    }

    const isApiRoute = pathname.startsWith('/api');

    const isAuthRequiredRoute = !isApiRoute && isAppAuthRequiredRoute(pathname);

    let response = NextResponse.next({
      request: {
        headers: new Headers(request.headers),
      },
    });

    // Add trace_id to response headers
    applyTraceContext(response);

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey =
      process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      // If Supabase not configured, skip auth middleware for public/API routes
      // Public routes should still work; protected routes fail closed.
      if (isAuthRequiredRoute) {
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('next', pathname);
        const redirectResponse = NextResponse.redirect(redirectUrl);
        redirectResponse.headers.set('x-trace-id', traceId);
        return addSecurityHeaders(redirectResponse);
      }
      return addSecurityHeaders(response);
    }

    // For public and API routes, skip auth entirely
    if (!isAuthRequiredRoute) {
      return addSecurityHeaders(response);
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
          const redirectUrl = new URL('/login', request.url);
          redirectUrl.searchParams.set('next', pathname);
          const redirectResponse = NextResponse.redirect(redirectUrl);
          redirectResponse.headers.set('x-trace-id', traceId);
          return addSecurityHeaders(redirectResponse);
        }
      } catch (authError) {
        // Log but don't fail - let the route handler deal with auth
        console.warn(
          "[Middleware] Auth refresh failed (non-fatal):",
          authError instanceof Error ? authError.message : "Unknown error"
        );
        if (isAuthRequiredRoute) {
          const redirectUrl = new URL('/login', request.url);
          redirectUrl.searchParams.set('next', pathname);
          const redirectResponse = NextResponse.redirect(redirectUrl);
          redirectResponse.headers.set('x-trace-id', traceId);
          return addSecurityHeaders(redirectResponse);
        }
      }
    } catch (error) {
      // If Supabase client creation fails, log but continue
      // Routes will handle auth errors themselves
      console.error(
        "[Middleware] Failed to create Supabase client (non-fatal):",
        error instanceof Error ? error.message : "Unknown error"
      );
      if (isAuthRequiredRoute) {
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('next', pathname);
        const redirectResponse = NextResponse.redirect(redirectUrl);
        redirectResponse.headers.set('x-trace-id', traceId);
        return addSecurityHeaders(redirectResponse);
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
    return addSecurityHeaders(response);
  } catch (error) {
    // CRITICAL: Middleware must NEVER throw - always return a valid response
    // Log error but continue with basic response
    console.error('[Middleware] Unexpected error (non-fatal):',
      error instanceof Error ? error.message : 'Unknown error'
    );

    // Return a basic response with security headers
    const fallbackResponse = NextResponse.next({
      request: {
        headers: new Headers(request.headers),
      },
    });

    // Generate trace ID even on error
    const traceId = generateTraceId();
    fallbackResponse.headers.set("x-trace-id", traceId);

    return addSecurityHeaders(fallbackResponse);
  }
}

export const config = {
  matcher: [
    /*
     * Scope middleware explicitly to authenticated routes and API
     * Marketing routes (/, /home, /pricing, etc.) are excluded to
     * ensure zero auth/env assumptions and maximum performance.
     */
    "/app/:path*",
    "/admin/:path*",
    "/console/:path*",
    "/dashboard/:path*",
    "/api/:path*",
  ],
};
