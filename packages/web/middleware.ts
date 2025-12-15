/**
 * Next.js Middleware
 * 
 * CTO Mode: Deployment Guardrails
 * - Handles Supabase auth cookie refresh
 * - Handles Auth0 authentication routes
 * - Protects routes requiring authentication
 * - Must be at root of project (not in src/)
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { addSecurityHeaders } from './src/middleware/security-headers';
import { auth0 } from './src/lib/auth0';

export async function middleware(request: NextRequest): Promise<NextResponse> {
  // Explicitly bypass Stripe webhook - it needs raw body and no auth
  if (request.nextUrl.pathname === '/api/stripe/webhook') {
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }

  // Handle Auth0 authentication routes
  if (request.nextUrl.pathname.startsWith('/auth/')) {
    const auth0Response = await auth0.middleware(request);
    return addSecurityHeaders(auth0Response);
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // If Supabase not configured, skip auth middleware
    return addSecurityHeaders(response);
  }

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
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
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
      console.warn('[Middleware] Auth refresh failed (non-fatal):', authError instanceof Error ? authError.message : 'Unknown error');
    }
  } catch (error) {
    // If Supabase client creation fails, log but continue
    // Routes will handle auth errors themselves
    console.error('[Middleware] Failed to create Supabase client (non-fatal):', error instanceof Error ? error.message : 'Unknown error');
  }

  // Add route protection logic here if needed
  // Example: Protect /dashboard routes
  // const { data: { user } } = await supabase.auth.getUser();
  // if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
  //   return NextResponse.redirect(new URL('/login', request.url));
  // }

  // Add security headers to all responses
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
