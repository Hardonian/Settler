/**
 * Graceful Error Handling Utility
 *
 * Provides consistent error handling for API routes that never returns 500.
 * All errors are returned as 200 with error information in the response body.
 *
 * Scale-Readiness: Generic types ensure type safety across all API responses
 * while maintaining backward compatibility.
 *
 * Usage:
 * ```ts
 * try {
 *   // ... route logic
 * } catch (error) {
 *   return gracefulError(error, 'Unable to process request');
 * }
 * ```
 */

import { NextResponse } from 'next/server';

/**
 * Generic graceful error response
 * Use type parameter to specify the type of data returned
 */
export interface GracefulErrorResponse<T = unknown> {
  success?: boolean;
  error: string;
  message: string;
  data?: T;
  details?: string;
}

/**
 * Create a graceful error response (200 status, never 500)
 *
 * Scale-Readiness: Generic type parameter ensures type safety at scale
 *
 * @param error - The error that occurred
 * @param defaultMessage - Default error message if error doesn't have one
 * @param emptyData - Data to return (empty array, null, etc.) based on context
 * @returns NextResponse with 200 status and error information
 */
export function gracefulError<T = null>(
  error: unknown,
  defaultMessage: string = 'An error occurred',
  emptyData: T | null = null
): NextResponse<GracefulErrorResponse<T | null>> {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  // Log error server-side (never expose to client)
  console.error('[API Error]', {
    error: errorMessage,
    ...(process.env.NODE_ENV === 'development' && errorStack ? { stack: errorStack } : {}),
  });

  return NextResponse.json(
    {
      success: false,
      error: defaultMessage,
      message: 'Please try again later or contact support if the issue persists',
      ...(emptyData !== null ? { data: emptyData } : {}),
      ...(process.env.NODE_ENV === 'development' ? { details: errorMessage } : {}),
    },
    { status: 200 }
  );
}

/**
 * Create a graceful error response for list endpoints (returns empty array)
 *
 * Scale-Readiness: Array type parameter ensures proper type inference
 */
export function gracefulErrorList<T>(
  error: unknown,
  defaultMessage: string = 'Unable to fetch data'
): NextResponse<GracefulErrorResponse<T[]>> {
  return gracefulError<T[]>(error, defaultMessage, []);
}

/**
 * Create a graceful error response for single resource endpoints (returns null)
 */
export function gracefulErrorSingle(
  error: unknown,
  defaultMessage: string = 'Unable to fetch resource'
): NextResponse<GracefulErrorResponse<null>> {
  return gracefulError<null>(error, defaultMessage, null);
}
