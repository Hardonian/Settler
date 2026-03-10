/**
 * Standardized Error Handling Utilities
 * Provides type-safe error extraction and handling
 */

import { Response } from "express";
import { sendError } from "./api-response";
import { logError } from "./logger";
import { isApiError, toApiError } from "./typed-errors";
import {
  buildErrorObservabilityMetadata,
  ERROR_CATEGORY,
  ERROR_SEVERITY,
  ErrorCategory,
  ErrorSeverity,
} from "../services/observability/error-taxonomy";
import { emitOperatorRuntimeEvent } from "../services/ops-intelligence/runtime-events";

interface RequestWithTraceId {
  traceId?: string;
  tenantId?: string;
  method?: string;
  route?: { path?: string };
  originalUrl?: string;
}

/**
 * Safely extracts error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unexpected error occurred";
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
  return (
    isApiError(error) ||
    (error instanceof Error &&
      "statusCode" in error &&
      typeof (error as HttpError).statusCode === "number")
  );
}

/**
 * Handles errors in route handlers with proper typing
 */
export function handleRouteError(
  res: Response,
  error: unknown,
  defaultMessage: string = "An error occurred",
  defaultStatusCode: number = 500,
  context?: Record<string, unknown>
): void {
  const apiError = toApiError(error);
  const message = apiError.message || defaultMessage;
  const statusCode = apiError.statusCode ?? defaultStatusCode;
  const errorCode = apiError.errorCode || "INTERNAL_ERROR";
  const details = apiError.details;

  logError(defaultMessage, error, context);

  emitStructuredRouteError(res, error, statusCode, context);

  // Extract traceId from request if available
  const traceId = (res.req as RequestWithTraceId).traceId;

  sendError(res, statusCode, errorCode, message, details, traceId);
}

function emitStructuredRouteError(
  res: Response,
  error: unknown,
  statusCode: number,
  context?: Record<string, unknown>
): void {
  const req = res.req as RequestWithTraceId;
  const tenantId = typeof context?.tenant_id === "string" ? context.tenant_id : req.tenantId;
  if (!tenantId) {
    return;
  }

  const routePath = typeof context?.route === "string" ? context.route : deriveRoute(req);
  const moduleName = typeof context?.module === "string" ? context.module : "routes/unknown-module";

  const { category, severity, retryable } = classifyStatusCode(statusCode);
  const metadata = buildErrorObservabilityMetadata({
    tenant_id: tenantId,
    run_id: typeof context?.run_id === "string" ? context.run_id : undefined,
    route: routePath,
    module: moduleName,
    category,
    severity,
    retryable,
    errorName: error instanceof Error ? error.name : "RouteError",
  });

  void emitOperatorRuntimeEvent({
    eventType: "error_thrown",
    tenantId,
    runId: metadata.run_id,
    metadata: {
      ...metadata,
      status_code: statusCode,
    },
  });
}

function deriveRoute(req: RequestWithTraceId): string {
  const method = req.method || "UNKNOWN";
  const route = req.route?.path || req.originalUrl || "unknown_route";
  return `${method} ${route}`;
}

function classifyStatusCode(statusCode: number): {
  category: ErrorCategory;
  severity: ErrorSeverity;
  retryable: boolean;
} {
  if (statusCode >= 500) {
    return {
      category: ERROR_CATEGORY.INTERNAL,
      severity: ERROR_SEVERITY.SEV1,
      retryable: true,
    };
  }

  if (statusCode === 429) {
    return {
      category: ERROR_CATEGORY.THROTTLING,
      severity: ERROR_SEVERITY.SEV2,
      retryable: true,
    };
  }

  if (statusCode === 401) {
    return {
      category: ERROR_CATEGORY.AUTHENTICATION,
      severity: ERROR_SEVERITY.SEV3,
      retryable: false,
    };
  }

  if (statusCode === 403) {
    return {
      category: ERROR_CATEGORY.AUTHORIZATION,
      severity: ERROR_SEVERITY.SEV3,
      retryable: false,
    };
  }

  return {
    category: ERROR_CATEGORY.VALIDATION,
    severity: ERROR_SEVERITY.SEV3,
    retryable: false,
  };
}
