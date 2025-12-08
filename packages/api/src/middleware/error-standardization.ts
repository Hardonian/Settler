/**
 * Error Standardization Middleware
 * Ensures all errors follow consistent format
 */

import { Response, Request } from "express";
import { AuthRequest } from "./auth";
import { logError } from "../utils/logger";

export interface StandardizedError {
  error: string;
  message: string;
  traceId?: string;
  details?: unknown;
  timestamp: string;
}

/**
 * Error code mapping
 */
const ERROR_CODE_MAP: Record<string, string> = {
  ValidationError: "VALIDATION_ERROR",
  UnauthorizedError: "UNAUTHORIZED",
  ForbiddenError: "FORBIDDEN",
  NotFoundError: "NOT_FOUND",
  ConflictError: "CONFLICT",
  RateLimitError: "RATE_LIMIT_EXCEEDED",
  QuotaExceededError: "QUOTA_EXCEEDED",
  InternalServerError: "INTERNAL_ERROR",
  ServiceUnavailableError: "SERVICE_UNAVAILABLE",
  BadRequestError: "BAD_REQUEST",
};

/**
 * Get error code from error
 */
function getErrorCode(error: unknown): string {
  if (error instanceof Error) {
    const errorName = error.constructor.name;
    return ERROR_CODE_MAP[errorName] || "INTERNAL_ERROR";
  }
  return "INTERNAL_ERROR";
}

/**
 * Get HTTP status code from error
 */
function getStatusCode(error: unknown): number {
  const code = getErrorCode(error);

  const statusMap: Record<string, number> = {
    VALIDATION_ERROR: 400,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    RATE_LIMIT_EXCEEDED: 429,
    QUOTA_EXCEEDED: 429,
    INTERNAL_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  };

  return statusMap[code] || 500;
}

/**
 * Get error message
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unexpected error occurred";
}

/**
 * Get error details
 */
function getErrorDetails(error: unknown): unknown {
  if (error instanceof Error && "details" in error) {
    const errorWithDetails = error as Error & { details?: unknown };
    return errorWithDetails.details;
  }
  return undefined;
}

/**
 * Standardize error response
 */
export function standardizeErrorResponse(error: unknown, req: Request, res: Response): void {
  const traceId = (req as AuthRequest).traceId;
  const code = getErrorCode(error);
  const message = getErrorMessage(error);
  const details = getErrorDetails(error);
  const statusCode = getStatusCode(error);

  const standardized: StandardizedError = {
    error: code,
    message,
    timestamp: new Date().toISOString(),
  };

  if (traceId) {
    standardized.traceId = traceId;
  }

  if (details) {
    standardized.details = details;
  }

  // Log error for monitoring
  if (statusCode >= 500) {
    logError("Server error", error, {
      traceId,
      code,
      path: req.path,
      method: req.method,
    });
  }

  res.status(statusCode).json(standardized);
}

/**
 * Error handler middleware
 */
export function errorStandardizationMiddleware(
  error: unknown,
  req: Request,
  res: Response,
  _next: () => void
): void {
  standardizeErrorResponse(error, req, res);
}
