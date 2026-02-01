/**
 * Safe Error Handler Utility
 * 
 * CRITICAL: Never return 500 errors to users. Always return typed error responses.
 * This utility ensures all API routes handle errors gracefully.
 */

import { NextResponse } from 'next/server';
import { logger } from '@/lib/observability/logger';
import { getTraceId } from '@/lib/observability/trace';

export interface SafeErrorResponse {
  error: string;
  message: string;
  code?: string;
  retryable?: boolean;
  trace_id?: string;
}

/**
 * Normalize errors to safe responses
 * Never throws - always returns NextResponse
 */
export async function normalizeError(error: unknown, context?: string): Promise<NextResponse<SafeErrorResponse>> {
  const traceId = await getTraceId();
  
  // Log error for observability
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  logger.error(`API Error${context ? ` in ${context}` : ''}`, {
    trace_id: traceId,
    error: errorMessage,
    stack: errorStack,
    context,
  });

  // Determine error type and return appropriate response
  if (error instanceof Error) {
    // Validation errors (Zod, etc.)
    if (error.name === 'ZodError' || error.message.includes('validation')) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: error.message,
          code: 'VALIDATION_ERROR',
          trace_id: traceId,
        },
        { status: 400 }
      );
    }

    // Authentication errors
    if (error.message.includes('Unauthorized') || error.message.includes('Authentication')) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Authentication required',
          code: 'UNAUTHORIZED',
          trace_id: traceId,
        },
        { status: 401 }
      );
    }

    // Not found errors
    if (error.message.includes('not found') || error.message.includes('Not Found')) {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: error.message,
          code: 'NOT_FOUND',
          trace_id: traceId,
        },
        { status: 404 }
      );
    }

    // Rate limit errors
    if (error.message.includes('rate limit') || error.message.includes('Rate limit')) {
      return NextResponse.json(
        {
          error: 'Rate Limit Exceeded',
          message: 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryable: true,
          trace_id: traceId,
        },
        { status: 429 }
      );
    }
  }

  // Default: return 200 with error message (never 500)
  // This prevents hard failures and allows client to handle gracefully
  return NextResponse.json(
    {
      error: 'Request Failed',
      message: errorMessage || 'An unexpected error occurred. Please try again.',
      code: 'INTERNAL_ERROR',
      retryable: true,
      trace_id: traceId,
    },
    { status: 200 }
  );
}

/**
 * Wrap async route handlers with safe error handling
 * 
 * Usage:
 *   export const POST = safeRouteHandler(async (request) => {
 *     // Your handler code
 *     return NextResponse.json({ success: true });
 *   });
 */
export function safeRouteHandler<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
  context?: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (_error) {
      return await normalizeError(error, context);
    }
  }) as T;
}

/**
 * Wrap server actions with safe error handling
 * Returns typed error objects instead of throwing
 */
export async function safeServerAction<T>(
  action: () => Promise<T>,
  context?: string
): Promise<{ success: true; data: T } | { success: false; error: string; code?: string }> {
  try {
    const data = await action();
    return { success: true, data };
  } catch (_error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const traceId = await getTraceId();
    
    logger.error(`Server Action Error${context ? ` in ${context}` : ''}`, {
      trace_id: traceId,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      context,
    });

    // Determine error code
    let code = 'INTERNAL_ERROR';
    if (error instanceof Error) {
      if (error.name === 'ZodError') code = 'VALIDATION_ERROR';
      else if (error.message.includes('Unauthorized')) code = 'UNAUTHORIZED';
      else if (error.message.includes('not found')) code = 'NOT_FOUND';
    }

    return {
      success: false,
      error: errorMessage || 'An unexpected error occurred',
      code,
    };
  }
}
