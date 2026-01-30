/**
 * API Response Types - Discriminated Unions
 *
 * Scale-Readiness: Consistent, type-safe API responses across all endpoints
 *
 * WHY THIS HELPS AT SCALE:
 * - Predictable response format - easy to parse
 * - Type-safe client code - no runtime surprises
 * - Better error handling - structured error info
 * - Easier monitoring - consistent error codes
 * - Simpler testing - known response shapes
 *
 * Usage:
 * ```ts
 * // Server-side
 * export async function GET(req: Request): Promise<ApiResponse<User>> {
 *   const user = await getUser();
 *   return apiSuccess(user);
 * }
 *
 * // Client-side
 * const response = await fetch('/api/user');
 * const result = await response.json() as ApiResponse<User>;
 * if (result.success) {
 *   console.log('User:', result.data);
 * }
 * ```
 */

import { NextResponse } from 'next/server';

/**
 * Success response shape
 */
export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
    timestamp?: string;
  };
}

/**
 * Error response shape
 */
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    timestamp?: string;
    requestId?: string;
  };
}

/**
 * API Response - discriminated union
 */
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

/**
 * Create a success response
 *
 * Scale-Readiness: Standardized success responses
 */
export function apiSuccess<T>(
  data: T,
  meta?: ApiSuccess<T>['meta']
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({
    success: true,
    data,
    ...(meta ? { meta } : {}),
  });
}

/**
 * Create an error response
 *
 * Scale-Readiness: Standardized error responses with structured info
 */
export function apiError(
  code: string,
  message: string,
  details?: Record<string, unknown>,
  status: number = 400
): NextResponse<ApiError> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

/**
 * Create a not found error response
 */
export function apiNotFound(
  resource: string = 'Resource'
): NextResponse<ApiError> {
  return apiError(
    'NOT_FOUND',
    `${resource} not found`,
    undefined,
    404
  );
}

/**
 * Create an unauthorized error response
 */
export function apiUnauthorized(
  message: string = 'Authentication required'
): NextResponse<ApiError> {
  return apiError(
    'UNAUTHORIZED',
    message,
    undefined,
    401
  );
}

/**
 * Create a forbidden error response
 */
export function apiForbidden(
  message: string = 'Access denied'
): NextResponse<ApiError> {
  return apiError(
    'FORBIDDEN',
    message,
    undefined,
    403
  );
}

/**
 * Create a validation error response
 */
export function apiValidationError(
  validationErrors: Record<string, string>
): NextResponse<ApiError> {
  return apiError(
    'VALIDATION_ERROR',
    'Validation failed',
    { fields: validationErrors },
    400
  );
}

/**
 * Create an internal server error response
 */
export function apiInternalError(
  message: string = 'Internal server error',
  details?: Record<string, unknown>
): NextResponse<ApiError> {
  // Log the error server-side
  console.error('[API Internal Error]', { message, details });

  // Don't expose internal details in production
  const exposedDetails = process.env.NODE_ENV === 'development' ? details : undefined;

  return apiError(
    'INTERNAL_ERROR',
    message,
    exposedDetails,
    500
  );
}

/**
 * Create a rate limit error response
 */
export function apiRateLimitError(
  retryAfter?: number
): NextResponse<ApiError> {
  const response = apiError(
    'RATE_LIMIT_EXCEEDED',
    'Too many requests',
    retryAfter ? { retryAfter } : undefined,
    429
  );

  // Add Retry-After header if provided
  if (retryAfter) {
    response.headers.set('Retry-After', String(retryAfter));
  }

  return response;
}

/**
 * Paginated response helper
 */
export function apiPaginatedSuccess<T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number
): NextResponse<ApiSuccess<T[]>> {
  return apiSuccess(data, {
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Type guard for API success
 */
export function isApiSuccess<T>(
  response: ApiResponse<T>
): response is ApiSuccess<T> {
  return response.success === true;
}

/**
 * Type guard for API error
 */
export function isApiError<T>(
  response: ApiResponse<T>
): response is ApiError {
  return response.success === false;
}

/**
 * Unwrap API response data
 * Throws if response is an error
 */
export function unwrapApiResponse<T>(response: ApiResponse<T>): T {
  if (response.success) {
    return response.data;
  }
  throw new Error(response.error.message);
}
