/**
 * Server-Side Error Handler
 * 
 * Provides safe error handling for API routes and Server Actions.
 * Never exposes sensitive error details to clients.
 */

import { NextResponse } from 'next/server';

export interface ErrorResponse {
  error: string;
  code?: string;
  digest?: string;
}

/**
 * Create a safe error response for API routes
 * Never exposes stack traces or sensitive information
 */
export function createErrorResponse(
  error: unknown,
  statusCode = 500,
  code?: string
): NextResponse<ErrorResponse> {
  const isDev = process.env.NODE_ENV === 'development';
  
  // Extract error message safely
  let message = 'An error occurred';
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }

  // Don't expose sensitive errors in production
  if (!isDev) {
    // Generic messages for common errors
    if (message.includes('database') || message.includes('prisma')) {
      message = 'Database error. Please try again later.';
    } else if (message.includes('stripe')) {
      message = 'Payment processing error. Please try again.';
    } else if (message.includes('supabase')) {
      message = 'Authentication error. Please sign in again.';
    } else if (message.includes('network') || message.includes('fetch')) {
      message = 'Network error. Please check your connection.';
    } else {
      // Generic fallback
      message = 'An unexpected error occurred. Please try again.';
    }
  }

  // Log full error server-side
  console.error('[Server Error]', {
    message,
    code,
    stack: error instanceof Error ? error.stack : undefined,
  });

  return NextResponse.json<ErrorResponse>(
    {
      error: message,
      code: code || 'INTERNAL_ERROR',
    },
    { status: statusCode }
  );
}

/**
 * Handle async route handler errors safely
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (_error) {
      return createErrorResponse(error);
    }
  }) as T;
}

/**
 * Safe error codes for common scenarios
 */
export const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  STRIPE_ERROR: 'STRIPE_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;
