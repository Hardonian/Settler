/**
 * Graceful Error Handling Utility
 * 
 * Provides consistent error handling for API routes that never returns 500.
 * All errors are returned as 200 with error information in the response body.
 * 
 * Usage:
 * ```ts
 * try {
 *   // ... route logic
 * } catch {
 *   return gracefulError(error, 'Unable to process request');
 * }
 * ```
 */

import { NextResponse } from 'next/server';

export interface GracefulErrorResponse {
  success?: boolean;
  error: string;
  message: string;
  data?: any;
  details?: string;
}

/**
 * Create a graceful error response (200 status, never 500)
 * 
 * @param error - The error that occurred
 * @param defaultMessage - Default error message if error doesn't have one
 * @param emptyData - Data to return (empty array, null, etc.) based on context
 * @returns NextResponse with 200 status and error information
 */
export function gracefulError(
  error: unknown,
  defaultMessage: string = 'An error occurred',
  emptyData: any = null
): NextResponse<GracefulErrorResponse> {
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
 */
export function gracefulErrorList(
  error: unknown,
  defaultMessage: string = 'Unable to fetch data'
): NextResponse<GracefulErrorResponse & { data: any[] }> {
  return gracefulError(error, defaultMessage, []) as NextResponse<GracefulErrorResponse & { data: any[] }>;
}

/**
 * Create a graceful error response for single resource endpoints (returns null)
 */
export function gracefulErrorSingle(
  error: unknown,
  defaultMessage: string = 'Unable to fetch resource'
): NextResponse<GracefulErrorResponse & { data: null }> {
  return gracefulError(error, defaultMessage, null) as NextResponse<GracefulErrorResponse & { data: null }>;
}
