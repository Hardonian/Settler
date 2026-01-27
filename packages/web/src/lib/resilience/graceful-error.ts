/**
 * Graceful Error Handling
 * 
 * Utilities to ensure user-facing routes never return hard-500 errors.
 * Instead, they return 200 with error information and retry guidance.
 */

import { NextResponse } from 'next/server';
import { getCorrelationId } from '@/lib/monitoring/correlation';

export interface GracefulErrorResponse {
  error: string;
  message: string;
  correlationId: string;
  retryable: boolean;
  retryAfter?: number; // seconds
  degraded?: boolean; // If true, indicates degraded mode
}

/**
 * Create a graceful error response (never 500 for user routes)
 */
export async function createGracefulErrorResponse(
  error: unknown,
  options: {
    defaultMessage?: string;
    retryable?: boolean;
    retryAfter?: number;
    degraded?: boolean;
  } = {}
): Promise<NextResponse> {
  const correlationId = await getCorrelationId();
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  const defaultMessage = options.defaultMessage || 'An error occurred. Please try again.';

  // Determine if error is retryable
  const isRetryable =
    options.retryable !== undefined
      ? options.retryable
      : isErrorRetryable(error);

  const response: GracefulErrorResponse = {
    error: getErrorCode(error),
    message: errorMessage || defaultMessage,
    correlationId,
    retryable: isRetryable,
    retryAfter: options.retryAfter,
    degraded: options.degraded,
  };

  // Log error for debugging
  console.error('[Graceful Error]', {
    correlationId,
    error: errorMessage,
    retryable: isRetryable,
    stack: error instanceof Error ? error.stack : undefined,
  });

  // Return 200 with error info (never 500 for user routes)
  return NextResponse.json(response, { status: 200 });
}

/**
 * Determine if an error is retryable
 */
function isErrorRetryable(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  
  // Retryable errors
  const retryablePatterns = [
    'timeout',
    'network',
    'connection',
    'temporary',
    'rate limit',
    'too many requests',
    'service unavailable',
    'gateway',
    'econnreset',
    'etimedout',
  ];

  // Non-retryable errors
  const nonRetryablePatterns = [
    'not found',
    'unauthorized',
    'forbidden',
    'validation',
    'invalid',
    'malformed',
    'syntax',
  ];

  // Check non-retryable first
  if (nonRetryablePatterns.some((pattern) => message.includes(pattern))) {
    return false;
  }

  // Check retryable
  if (retryablePatterns.some((pattern) => message.includes(pattern))) {
    return true;
  }

  // Default to retryable for unknown errors (safer)
  return true;
}

/**
 * Get error code from error
 */
function getErrorCode(error: unknown): string {
  if (error instanceof Error) {
    // Use error name if it's a known error type
    if (error.name && error.name !== 'Error') {
      return error.name.toUpperCase().replace(/\s+/g, '_');
    }
    
    // Extract code from message
    const message = error.message.toLowerCase();
    if (message.includes('timeout')) return 'TIMEOUT';
    if (message.includes('network')) return 'NETWORK_ERROR';
    if (message.includes('not found')) return 'NOT_FOUND';
    if (message.includes('unauthorized')) return 'UNAUTHORIZED';
    if (message.includes('forbidden')) return 'FORBIDDEN';
    if (message.includes('validation')) return 'VALIDATION_ERROR';
  }

  return 'INTERNAL_ERROR';
}

/**
 * Wrap an API handler to never return 500
 */
export function withGracefulErrors<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>,
  options: {
    defaultMessage?: string;
    retryable?: boolean;
  } = {}
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch {
      return createGracefulErrorResponse(error, options);
    }
  };
}
