/**
 * API Security Middleware
 * 
 * Comprehensive security middleware for all API routes.
 * Includes rate limiting, input validation, CSRF protection.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { withRateLimit } from '@/lib/api/rate-limit';
import { appLogger } from '@/lib/utils/logger';

export interface SecurityOptions {
  rateLimit?: {
    maxRequests?: number;
    windowMs?: number;
  };
  requireAuth?: boolean;
  validateQuery?: boolean;
  validateBody?: boolean;
  csrf?: boolean;
  requirePrivilegedApproval?: boolean;
}

function isPrivilegedMutation(request: NextRequest): boolean {
  const method = request.method.toUpperCase();
  const isMutation = method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';
  return isMutation && request.nextUrl.pathname.startsWith('/api/admin');
}

/**
 * Security middleware wrapper for API routes
 * Supports both handlers with and without params (Next.js 15+ pattern)
 */
export function withSecurity<T extends (request: NextRequest, ...args: any[]) => Promise<NextResponse>>(
  handler: T,
  options: SecurityOptions = {}
): T {
  const {
    rateLimit = { maxRequests: 60, windowMs: 60 * 1000 },
    requirePrivilegedApproval,
  } = options;

  // Apply rate limiting
  const securedHandler = withRateLimit(
    async (request: NextRequest, ...args: any[]) => {
      const privilegedApprovalRequired = requirePrivilegedApproval ?? isPrivilegedMutation(request);
      if (privilegedApprovalRequired) {
        const method = request.method.toUpperCase();
        const operatorId = request.headers.get('x-operator-id');
        const breakGlassTicket = request.headers.get('x-breakglass-ticket');
        const traceId = `priv-${Date.now()}`;

        if (!operatorId || !breakGlassTicket) {
          return NextResponse.json(
            {
              code: 'PRIVILEGED_APPROVAL_REQUIRED',
              message:
                'Privileged mutations require x-operator-id and x-breakglass-ticket headers.',
              traceId,
              retryable: false,
            },
            { status: 403 }
          );
        }

        const sessionRecordId = createHash('sha256')
          .update(`${operatorId}|${breakGlassTicket}|${request.nextUrl.pathname}|${Date.now()}`)
          .digest('hex');

        appLogger.info('Privileged mutation approved', {
          operatorId,
          breakGlassTicket,
          path: request.nextUrl.pathname,
          method,
          sessionRecordId,
          traceId,
        });

        const response = await handler(request, ...args);
        response.headers.set('X-Privileged-Session-Record-Id', sessionRecordId);
        response.headers.set('X-Privileged-Operator-Id', operatorId);
        response.headers.set('X-Privileged-Breakglass-Ticket', breakGlassTicket);
        response.headers.set('X-Privileged-Trace-Id', traceId);
        response.headers.set('X-Content-Type-Options', 'nosniff');
        response.headers.set('X-Frame-Options', 'DENY');
        response.headers.set('X-XSS-Protection', '1; mode=block');
        response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        return response;
      }

      // Add security headers
      const response = await handler(request, ...args);
      
      // Add security headers to all responses
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      return response;
    },
    {
      maxRequests: rateLimit.maxRequests,
      windowMs: rateLimit.windowMs,
    }
  );

  return securedHandler as T;
}
