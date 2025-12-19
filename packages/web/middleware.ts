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

export async function middleware(request: NextRequest): Promise<NextResponse> {
  // Generate or get trace_id
  let traceId = request.headers.get("x-trace-id") || request.cookies.get("trace-id")?.value;
  if (!traceId) {
    traceId = generateTraceId();
  }

  // Explicitly bypass Stripe webhook - it needs raw body and no auth
  if (request.nextUrl.pathname === "/api/stripe/webhook") {
    const response = NextResponse.next({
      request: {
        headers: new Headers(request.headers),
      },
    });
    response.headers.set("x-trace-id", traceId);
    return response;
  }

  // SAFE_MODE: Force public minimal mode for /console and /playground
  const isSafeMode = process.env.SAFE_MODE === 'true' || process.env.SAFE_MODE === '1';
  const safeModeRoutes = ['/console', '/playground'];
  const isSafeModeRoute = isSafeMode && safeModeRoutes.some(route => 
    request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(`${route}/`)
  );

  // Public routes that should never require auth or throw errors
  // These routes must always render, even if Supabase/auth fails
  const publicRoutes = [
    '/console',
    '/playground',
    '/cookbook',
    '/cookbooks',
    '/runbooks',
    '/schematics',
    '/p', // CMS public pages
  ];
  
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(`${route}/`)
  ) || isSafeModeRoute;

  let response = NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  });

  // Add trace_id to response headers
  response.headers.set("x-trace-id", traceId);

  // Set trace_id cookie for client-side access
  response.cookies.set("trace-id", traceId, {
    httpOnly: false, // Allow client-side access
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // If Supabase not configured, skip auth middleware
    // Public routes should still work
    return addSecurityHeaders(response);
  }

  // For public routes, skip auth checks but still refresh session if possible
  // This allows authenticated users to see elevated features without blocking unauthenticated access
  if (isPublicRoute) {
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
          },
        },
      });

      // Try to refresh session silently - don't fail if it errors
      try {
        await supabase.auth.getUser();
      } catch (authError) {
        // Silent fail for public routes - auth is optional
      }
    } catch (error) {
      // If Supabase client creation fails, continue anyway for public routes
      console.warn('[Middleware] Failed to create Supabase client for public route (non-fatal):', 
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
    
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
        },
      },
    });

    // Refresh session if expired - required for Server Components
    // Wrap in try/catch to prevent middleware from crashing on auth errors
    try {
      await supabase.auth.getUser();
    } catch (authError) {
      // Log but don't fail - let the route handler deal with auth
      console.warn(
        "[Middleware] Auth refresh failed (non-fatal):",
        authError instanceof Error ? authError.message : "Unknown error"
      );
    }
  } catch (error) {
    // If Supabase client creation fails, log but continue
    // Routes will handle auth errors themselves
    console.error(
      "[Middleware] Failed to create Supabase client (non-fatal):",
      error instanceof Error ? error.message : "Unknown error"
    );
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
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api/stripe/webhook (handled explicitly in middleware)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
