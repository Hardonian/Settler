/**
 * Enhanced Error Handler
 * 
 * Provides comprehensive error handling for API routes with proper logging,
 * sanitization, and user-friendly error messages.
 */

import { NextResponse } from 'next/server';
import { sanitizeApiData } from '@/lib/privacy/pii-filter';

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
  stack?: string;
}

/**
 * Create standardized API error response
 */
export function createErrorResponse(
  error: unknown,
  defaultMessage: string = 'An error occurred',
  defaultStatusCode: number = 500
): NextResponse {
  let apiError: ApiError;
  
  if (error instanceof Error) {
    // Determine status code from error message or type
    let statusCode = defaultStatusCode;
    
    if (error.message.includes('not found') || error.message.includes('does not exist')) {
      statusCode = 404;
    } else if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
      statusCode = 401;
    } else if (error.message.includes('forbidden') || error.message.includes('permission')) {
      statusCode = 403;
    } else if (error.message.includes('validation') || error.message.includes('invalid')) {
      statusCode = 400;
    } else if (error.message.includes('rate limit')) {
      statusCode = 429;
    }
    
    apiError = {
      code: error.name || 'INTERNAL_ERROR',
      message: error.message || defaultMessage,
      statusCode,
      ...(process.env.NODE_ENV === 'development' && error.stack ? { stack: error.stack } : {}),
    };
  } else if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>;
    apiError = {
      code: String(errorObj.code || 'UNKNOWN_ERROR'),
      message: String(errorObj.message || defaultMessage),
      statusCode: Number(errorObj.statusCode || defaultStatusCode),
      details: errorObj.details as Record<string, unknown> | undefined,
    };
  } else {
    apiError = {
      code: 'UNKNOWN_ERROR',
      message: defaultMessage,
      statusCode: defaultStatusCode,
    };
  }
  
  // Sanitize error details
  if (apiError.details) {
    apiError.details = sanitizeApiData({ body: apiError.details }).body as Record<string, unknown>;
  }
  
  // Log error (server-side only)
  console.error('[API Error]', {
    code: apiError.code,
    message: apiError.message,
    statusCode: apiError.statusCode,
    ...(process.env.NODE_ENV === 'development' && apiError.stack ? { stack: apiError.stack } : {}),
  });
  
  return NextResponse.json(
    {
      error: apiError.code,
      message: apiError.message,
      ...(apiError.details ? { details: apiError.details } : {}),
      ...(process.env.NODE_ENV === 'development' && apiError.stack ? { stack: apiError.stack } : {}),
    },
    { status: apiError.statusCode }
  );
}

/**
 * Wrap API handler with error handling
 */
export function withErrorHandling<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>,
  defaultMessage?: string,
  defaultStatusCode?: number
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch {
      return createErrorResponse(error, defaultMessage, defaultStatusCode);
    }
  };
}

/**
 * Validate and handle validation errors
 */
export function handleValidationError(errors: string[]): NextResponse {
  return NextResponse.json(
    {
      error: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      errors,
    },
    { status: 400 }
  );
}
