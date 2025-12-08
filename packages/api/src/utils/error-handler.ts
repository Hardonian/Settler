/**
 * Standardized Error Handling Utilities
 * Provides type-safe error extraction and handling
 */

import { Response } from 'express';
import { sendError } from './api-response';
import { logError } from './logger';
import { isApiError, toApiError } from './typed-errors';

/**
 * Safely extracts error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}

/**
 * Safely extracts error stack trace
 */
export function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.stack;
  }
  return undefined;
}

/**
 * Checks if error is a known error type with status code
 * @deprecated Use isApiError from typed-errors instead
 */
export interface HttpError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export function isHttpError(error: unknown): error is HttpError {
  return isApiError(error) || (
    error instanceof Error &&
    'statusCode' in error &&
    typeof (error as HttpError).statusCode === 'number'
  );
}

/**
 * Handles errors in route handlers with proper typing
 */
export function handleRouteError(
  res: Response,
  error: unknown,
  defaultMessage: string = 'An error occurred',
  _defaultStatusCode: number = 500,
  context?: Record<string, unknown>
): void {
  const apiError = toApiError(error);
  const message = apiError.message || defaultMessage;
  const statusCode = apiError.statusCode ?? _defaultStatusCode;
  const errorCode = apiError.errorCode || 'INTERNAL_ERROR';
  const details = apiError.details;

  logError(defaultMessage, error, context);

  // Extract traceId from request if available
  const traceId = (res.req as any).traceId;

  sendError(res, statusCode, errorCode, message, details, traceId);
}
