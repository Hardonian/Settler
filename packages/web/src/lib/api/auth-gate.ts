/**
 * Auth Gating Utilities
 * 
 * Protects admin/diagnostic endpoints
 * Ensures unauthenticated access yields 401/403 with safe body
 * Prevents redirect loops
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTraceId } from '@/lib/observability/trace';
import { logger } from '@/lib/observability/logger';
import { ErrorCode } from '@/lib/api/error-handler';

export interface AuthGateOptions {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  allowedRoles?: string[];
}

/**
 * Check if user is authenticated
 */
export async function requireAuth(request: NextRequest): Promise<{
  authenticated: boolean;
  user?: { id: string; email?: string };
  error?: NextResponse;
}> {
  const traceId = await getTraceId(request);

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      await logger.warn('Unauthenticated access attempt', {
        trace_id: traceId,
        route: request.nextUrl.pathname,
      });

      return {
        authenticated: false,
        error: NextResponse.json(
          {
            error: 'Authentication required',
            code: ErrorCode.UNAUTHORIZED,
            trace_id: traceId,
            timestamp: new Date().toISOString(),
          },
          { status: 401 }
        ),
      };
    }

    return {
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  } catch (error) {
    await logger.error('Auth check failed', {
      trace_id: traceId,
      route: request.nextUrl.pathname,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      authenticated: false,
      error: NextResponse.json(
        {
          error: 'Authentication check failed',
          code: ErrorCode.INTERNAL_ERROR,
          trace_id: traceId,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      ),
    };
  }
}

/**
 * Check if user is admin
 */
export async function requireAdmin(request: NextRequest): Promise<{
  isAdmin: boolean;
  user?: { id: string; email?: string };
  error?: NextResponse;
}> {
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return { isAdmin: false, error: authResult.error };
  }

  const traceId = await getTraceId(request);

  // Check admin status (you may need to adjust this based on your user model)
  // For now, we'll check a custom claim or profile field
  try {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authResult.user!.id)
      .single();

    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

    if (!isAdmin) {
      await logger.warn('Non-admin access attempt to admin endpoint', {
        trace_id: traceId,
        route: request.nextUrl.pathname,
        user_id: authResult.user!.id,
      });

      return {
        isAdmin: false,
        error: NextResponse.json(
          {
            error: 'Admin access required',
            code: ErrorCode.FORBIDDEN,
            trace_id: traceId,
            timestamp: new Date().toISOString(),
          },
          { status: 403 }
        ),
      };
    }

    return {
      isAdmin: true,
      user: authResult.user,
    };
  } catch (error) {
    await logger.error('Admin check failed', {
      trace_id: traceId,
      route: request.nextUrl.pathname,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      isAdmin: false,
      error: NextResponse.json(
        {
          error: 'Admin check failed',
          code: ErrorCode.INTERNAL_ERROR,
          trace_id: traceId,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      ),
    };
  }
}

/**
 * Wrap API route handler with auth gating
 */
export function withAuthGate<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
  options: AuthGateOptions = {}
): T {
  return (async (...args: Parameters<T>) => {
    const request = args[0] as NextRequest;

    // Check authentication if required
    if (options.requireAuth !== false) {
      const authResult = await requireAuth(request);
      if (!authResult.authenticated) {
        return authResult.error!;
      }

      // Check admin if required
      if (options.requireAdmin) {
        const adminResult = await requireAdmin(request);
        if (!adminResult.isAdmin) {
          return adminResult.error!;
        }
      }
    }

    // Call original handler
    return handler(...args);
  }) as T;
}
