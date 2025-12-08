/**
 * Standardized API Response Utilities
 * Provides consistent response format across all endpoints
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    cursor?: string;
  };
}

export interface ApiError {
  error: string;
  message: string;
  code?: string;
  details?: unknown;
  traceId?: string;
}

/**
 * Send success response
 * 
 * @param res - Express response object
 * @param data - Response data
 * @param message - Optional success message
 * @param statusCode - HTTP status code (default: 200)
 * 
 * @example
 * ```typescript
 * sendSuccess(res, { id: '123', name: 'Job' }, 'Job created successfully', 201);
 * ```
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): void {
  const response: ApiResponse<T> = {
    data,
  };

  if (message) {
    response.message = message;
  }

  res.status(statusCode).json(response);
}

/**
 * Send standardized error response
 * 
 * @param res - Express response object
 * @param statusCode - HTTP status code (default: 400)
 * @param code - Machine-readable error code (e.g., "VALIDATION_ERROR")
 * @param message - Human-readable error message
 * @param details - Optional additional error details
 * @param traceId - Optional trace ID for debugging (auto-extracted from request if available)
 * 
 * @example
 * ```typescript
 * sendError(res, 400, 'VALIDATION_ERROR', 'Invalid input', { fields: ['name'] });
 * sendError(res, 404, 'NOT_FOUND', 'Job not found', undefined, req.traceId);
 * ```
 */
export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
  traceId?: string
): void {
  const response: ApiError = {
    error: code,
    message,
  };

  if (details) {
    response.details = details;
  }

  // Extract traceId from request if available
  const requestTraceId = (res.req as AuthRequest).traceId;
  const finalTraceId = traceId || requestTraceId;
  if (finalTraceId) {
    response.traceId = finalTraceId;
  }

  res.status(statusCode).json(response);
}

/**
 * Send paginated response
 */
export function sendPaginated<T>(
  res: Response,
  data: T[],
  meta: {
    page: number;
    limit: number;
    total: number;
    cursor?: string;
  }
): void {
  const response: ApiResponse<T[]> = {
    data,
    meta: {
      page: meta.page,
      limit: meta.limit,
      total: meta.total,
      ...(meta.cursor !== undefined && { cursor: meta.cursor }),
    },
  };

  res.status(200).json(response);
}

/**
 * Send created response
 */
export function sendCreated<T>(
  res: Response,
  data: T,
  message?: string
): void {
  sendSuccess(res, data, message, 201);
}

/**
 * Send no content response
 */
export function sendNoContent(res: Response): void {
  res.status(204).send();
}
