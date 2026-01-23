/**
 * Error Normalization Utility
 *
 * Normalizes errors into a consistent shape for API responses and logging.
 *
 * Guarantees:
 * - Consistent error structure across all API endpoints
 * - Safe error messages (no stack traces to clients)
 * - Request ID correlation for debugging
 * - Proper HTTP status codes
 * - Full stack traces in server logs only
 *
 * Critical for:
 * - Production error handling (no hard-500s without context)
 * - Client error reporting
 * - Security (no information leakage)
 */

import { Request, Response } from 'express';
import { logError } from './logger';
import { redact } from './redaction';

/**
 * Standard error response shape
 */
export interface ErrorResponse {
  status: 'error';
  code: string;
  message: string;
  requestId?: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Extended error with HTTP status code
 */
export class HttpError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'HttpError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Common HTTP error constructors
 */
export class BadRequestError extends HttpError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, 'BAD_REQUEST', details);
    this.name = 'BadRequestError';
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message: string = 'Authentication required', details?: Record<string, unknown>) {
    super(message, 401, 'UNAUTHORIZED', details);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends HttpError {
  constructor(message: string = 'Access denied', details?: Record<string, unknown>) {
    super(message, 403, 'FORBIDDEN', details);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends HttpError {
  constructor(resource: string = 'Resource', details?: Record<string, unknown>) {
    super(`${resource} not found`, 404, 'NOT_FOUND', details);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends HttpError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 409, 'CONFLICT', details);
    this.name = 'ConflictError';
  }
}

export class TooManyRequestsError extends HttpError {
  constructor(
    message: string = 'Rate limit exceeded',
    details?: Record<string, unknown>
  ) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', details);
    this.name = 'TooManyRequestsError';
  }
}

export class InternalServerError extends HttpError {
  constructor(message: string = 'Internal server error', details?: Record<string, unknown>) {
    super(message, 500, 'INTERNAL_ERROR', details);
    this.name = 'InternalServerError';
  }
}

/**
 * Normalize any error into a safe client response
 *
 * @param error - Any error object
 * @param requestId - Request ID for correlation
 * @returns Normalized error response
 */
export function normalizeError(error: unknown, requestId?: string): ErrorResponse {
  const timestamp = new Date().toISOString();

  // Handle HttpError instances
  if (error instanceof HttpError) {
    return {
      status: 'error',
      code: error.code,
      message: error.message,
      requestId,
      details: error.details ? redact(error.details) : undefined,
      timestamp,
    };
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    // Check if it's a known error type by name
    if (error.name === 'ValidationError') {
      return {
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: error.message,
        requestId,
        timestamp,
      };
    }

    if (error.name === 'UnauthorizedError' || error.message.includes('unauthorized')) {
      return {
        status: 'error',
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        requestId,
        timestamp,
      };
    }

    // Generic error response (don't leak internal error messages)
    return {
      status: 'error',
      code: 'INTERNAL_ERROR',
      message: 'An internal error occurred',
      requestId,
      timestamp,
    };
  }

  // Handle unknown error types
  return {
    status: 'error',
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
    requestId,
    timestamp,
  };
}

/**
 * Send normalized error response
 *
 * Usage in route handlers:
 *   try {
 *     // ... handler logic
 *   } catch (error) {
 *     return sendErrorResponse(res, error, req.requestId);
 *   }
 *
 * @param res - Express response object
 * @param error - Any error object
 * @param requestId - Request ID for correlation
 * @param statusCodeOverride - Override status code (optional)
 */
export function sendErrorResponse(
  res: Response,
  error: unknown,
  requestId?: string,
  statusCodeOverride?: number
): void {
  const normalizedError = normalizeError(error, requestId);

  // Determine status code
  let statusCode = statusCodeOverride || 500;
  if (error instanceof HttpError) {
    statusCode = error.statusCode;
  }

  // Log the full error with stack trace (for internal debugging)
  logError(
    `Error handling request: ${normalizedError.message}`,
    error,
    {
      requestId,
      code: normalizedError.code,
      statusCode,
      ...normalizedError.details,
    }
  );

  // Send safe error response to client (no stack traces)
  res.status(statusCode).json(normalizedError);
}

/**
 * Express error handling middleware
 *
 * Usage:
 *   app.use(errorHandlerMiddleware);
 *
 * This should be the last middleware in your app.
 * Catches all unhandled errors and returns normalized responses.
 */
export function errorHandlerMiddleware(
  error: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: (error?: unknown) => void
): void {
  sendErrorResponse(res, error, req.requestId);
}

/**
 * Async route handler wrapper
 *
 * Wraps async route handlers to automatically catch errors and normalize responses.
 *
 * Usage:
 *   router.get('/jobs', asyncHandler(async (req, res) => {
 *     const jobs = await getJobs();
 *     res.json(jobs);
 *   }));
 *
 * Errors thrown in the handler are automatically caught and normalized.
 */
export function asyncHandler(
  fn: (req: Request, res: Response) => Promise<void>
): (req: Request, res: Response, next: (error?: unknown) => void) => void {
  return (req: Request, res: Response, next: (error?: unknown) => void) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
}

/**
 * Validation error helper
 *
 * Creates a BadRequestError with validation details.
 *
 * Usage:
 *   if (!isValid) {
 *     throw validationError('Invalid input', { field: 'email', issue: 'invalid format' });
 *   }
 */
export function validationError(
  message: string,
  details: Record<string, unknown>
): BadRequestError {
  return new BadRequestError(message, details);
}
