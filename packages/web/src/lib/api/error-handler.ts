/**
 * Unified API Error Handler
 * 
 * Provides consistent error handling for all API routes.
 * Ensures no 500 errors leak to clients.
 * Includes trace_id in all error responses.
 */

import { NextResponse } from 'next/server';
import { ZodError, type ZodIssue } from 'zod';
import { getTraceId } from '@/lib/observability/trace';
import { logger } from '@/lib/observability/logger';

export interface ErrorEnvelope {
  error: string;
  code?: string;
  details?: Record<string, any>;
  timestamp: string;
}

/**
 * Error codes for different error types
 */
export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

/**
 * Handle errors in API routes
 * Always returns 200 with error envelope (never 500)
 * Includes trace_id in response
 */
export async function handleApiError(
  error: unknown,
  defaultMessage: string = 'An error occurred',
  context?: { route?: string; userId?: string; tenantId?: string }
): Promise<NextResponse<ErrorEnvelope & { trace_id: string }>> {
  // Get trace_id
  const traceId = await getTraceId();
  
  // Log error server-side with trace_id (never expose to client)
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  await logger.error('API Error', {
    trace_id: traceId,
    route: context?.route,
    user_id: context?.userId,
    tenant_id: context?.tenantId,
    error: errorMessage,
    stack: errorStack,
  });

  const baseResponse = {
    trace_id: traceId,
    timestamp: new Date().toISOString(),
  };

  // Handle specific error types
  if (error instanceof ZodError) {
    const response = NextResponse.json(
      {
        ...baseResponse,
        error: 'Validation error',
        code: ErrorCode.VALIDATION_ERROR,
        details: {
          issues: error.issues.map((issue: ZodIssue) => ({
            path: issue.path.map(String).join('.'),
            message: issue.message,
          })),
        },
      },
      { status: 200 } // Return 200 even for validation errors
    );
    response.headers.set('x-trace-id', traceId);
    return response;
  }

  // Handle auth errors
  if (errorMessage.includes('Unauthorized') || errorMessage.includes('authentication')) {
    const response = NextResponse.json(
      {
        ...baseResponse,
        error: 'Authentication required',
        code: ErrorCode.UNAUTHORIZED,
      },
      { status: 200 } // Return 200, client can check code
    );
    response.headers.set('x-trace-id', traceId);
    return response;
  }

  // Handle permission errors
  if (errorMessage.includes('Permission denied') || errorMessage.includes('Forbidden')) {
    const response = NextResponse.json(
      {
        ...baseResponse,
        error: 'Permission denied',
        code: ErrorCode.FORBIDDEN,
      },
      { status: 200 }
    );
    response.headers.set('x-trace-id', traceId);
    return response;
  }

  // Handle not found errors
  if (errorMessage.includes('not found') || errorMessage.includes('Not Found')) {
    const response = NextResponse.json(
      {
        ...baseResponse,
        error: 'Resource not found',
        code: ErrorCode.NOT_FOUND,
      },
      { status: 200 }
    );
    response.headers.set('x-trace-id', traceId);
    return response;
  }

  // Handle rate limiting
  if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
    const response = NextResponse.json(
      {
        ...baseResponse,
        error: 'Rate limit exceeded',
        code: ErrorCode.RATE_LIMIT,
      },
      { status: 200 }
    );
    response.headers.set('x-trace-id', traceId);
    return response;
  }

  // Handle service unavailable
  if (errorMessage.includes('connection') || errorMessage.includes('timeout') || errorMessage.includes('unavailable')) {
    const response = NextResponse.json(
      {
        ...baseResponse,
        error: 'Service temporarily unavailable',
        code: ErrorCode.SERVICE_UNAVAILABLE,
      },
      { status: 200 }
    );
    response.headers.set('x-trace-id', traceId);
    return response;
  }

  // Default error (never expose internal details)
  const response = NextResponse.json(
    {
      ...baseResponse,
      error: defaultMessage,
      code: ErrorCode.INTERNAL_ERROR,
    },
    { status: 200 } // Always return 200, never 500
  );
  response.headers.set('x-trace-id', traceId);
  return response;
}

/**
 * Wrap API route handler with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
  context?: { route?: string; userId?: string; tenantId?: string }
): T {
  return (async (...args: Parameters<T>) => {
    try {
      const result = await handler(...args);
      // Add trace_id to successful responses too
      const traceId = await getTraceId();
      result.headers.set('x-trace-id', traceId);
      return result;
    } catch (error) {
      return handleApiError(error, 'An error occurred', context);
    }
  }) as T;
}

/**
 * Create success response
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}
