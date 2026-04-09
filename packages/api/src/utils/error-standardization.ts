/**
 * Error Standardization Utilities
 * Ensures consistent error handling across the application
 */

import { Response } from "express";
import { sendError } from "./api-response";
import { logError } from "./logger";

export enum ErrorCode {
  // Client errors (4xx)
  VALIDATION_ERROR = "VALIDATION_ERROR",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  PAYLOAD_TOO_LARGE = "PAYLOAD_TOO_LARGE",

  // Server errors (5xx)
  INTERNAL_ERROR = "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
}

export interface StandardizedError {
  code: ErrorCode;
  message: string;
  statusCode: number;
  details?: unknown;
}

/**
 * Map common errors to standardized error codes
 */
export function standardizeError(error: unknown): StandardizedError {
  if (error instanceof Error) {
    // Database errors
    if (error.message.includes("duplicate key") || error.message.includes("unique constraint")) {
      return {
        code: ErrorCode.CONFLICT,
        message: "Resource already exists",
        statusCode: 409,
      };
    }

    if (error.message.includes("foreign key") || error.message.includes("violates foreign key")) {
      return {
        code: ErrorCode.VALIDATION_ERROR,
        message: "Invalid reference to related resource",
        statusCode: 400,
      };
    }

    if (error.message.includes("not found")) {
      return {
        code: ErrorCode.NOT_FOUND,
        message: error.message,
        statusCode: 404,
      };
    }

    // Validation errors
    if (error.name === "ZodError" || error.message.includes("validation")) {
      return {
        code: ErrorCode.VALIDATION_ERROR,
        message: "Invalid input",
        statusCode: 400,
        details: error.message,
      };
    }
  }

  // Default to internal error
  return {
    code: ErrorCode.INTERNAL_ERROR,
    message: "An unexpected error occurred",
    statusCode: 500,
  };
}

/**
 * Handle and send standardized error response
 */
export function handleStandardizedError(res: Response, error: unknown, traceId?: string): void {
  const standardized = standardizeError(error);

  // Log error
  logError(`Error [${standardized.code}]: ${standardized.message}`, error, {
    code: standardized.code,
    statusCode: standardized.statusCode,
    traceId,
  });

  // Send standardized error response
  sendError(
    res,
    standardized.statusCode,
    standardized.code,
    standardized.message,
    standardized.details,
    traceId
  );
}
