/**
 * Unified API Error Handler
 * 
 * Provides consistent error handling for all API routes.
 * Ensures no 500 errors leak to clients.
 */

import { NextResponse } from 'next/server';
import { ZodError, type ZodIssue } from 'zod';

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
 */
export function handleApiError(
  error: unknown,
  defaultMessage: string = 'An error occurred'
): NextResponse<ErrorEnvelope> {
  // Log error server-side (never expose to client)
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  console.error('[API Error]', {
    message: errorMessage,
    stack: errorStack,
    timestamp: new Date().toISOString(),
  });

  // Handle specific error types
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation error',
        code: ErrorCode.VALIDATION_ERROR,
        details: {
          issues: error.issues.map((issue: ZodIssue) => ({
            path: issue.path.map(String).join('.'),
            message: issue.message,
          })),
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 } // Return 200 even for validation errors
    );
  }

  // Handle auth errors
  if (errorMessage.includes('Unauthorized') || errorMessage.includes('authentication')) {
    return NextResponse.json(
      {
        error: 'Authentication required',
        code: ErrorCode.UNAUTHORIZED,
        timestamp: new Date().toISOString(),
      },
      { status: 200 } // Return 200, client can check code
    );
  }

  // Handle permission errors
  if (errorMessage.includes('Permission denied') || errorMessage.includes('Forbidden')) {
    return NextResponse.json(
      {
        error: 'Permission denied',
        code: ErrorCode.FORBIDDEN,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  }

  // Handle not found errors
  if (errorMessage.includes('not found') || errorMessage.includes('Not Found')) {
    return NextResponse.json(
      {
        error: 'Resource not found',
        code: ErrorCode.NOT_FOUND,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  }

  // Handle rate limiting
  if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        code: ErrorCode.RATE_LIMIT,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  }

  // Handle service unavailable
  if (errorMessage.includes('connection') || errorMessage.includes('timeout') || errorMessage.includes('unavailable')) {
    return NextResponse.json(
      {
        error: 'Service temporarily unavailable',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  }

  // Default error (never expose internal details)
  return NextResponse.json(
    {
      error: defaultMessage,
      code: ErrorCode.INTERNAL_ERROR,
      timestamp: new Date().toISOString(),
    },
    { status: 200 } // Always return 200, never 500
  );
}

/**
 * Wrap API route handler with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  }) as T;
}

/**
 * Create success response
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}
