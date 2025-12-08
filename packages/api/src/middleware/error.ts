import { Request, Response, NextFunction } from "express";
import { logError } from "../utils/logger";
import { AuthRequest } from "./auth";
import { config } from "../config";
import { captureException, setSentryUser } from "./sentry";
import { toApiError } from "../utils/typed-errors";

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const authReq = req as AuthRequest;
  const apiError = toApiError(err);
  
  // Set Sentry user context
  if (authReq.userId) {
    setSentryUser(authReq);
  }
  
  // Log error with context
  logError('Request error', err, {
    method: req.method,
    path: req.path,
    ip: req.ip,
    traceId: authReq.traceId,
    userId: authReq.userId,
  });

  // Capture exception to Sentry (only for 5xx errors)
  const statusCode = apiError.statusCode;
  if (statusCode >= 500) {
    const error = err instanceof Error ? err : new Error(String(err));
    captureException(error, {
      request: {
        method: req.method,
        url: req.url,
        headers: req.headers,
        query: req.query,
        body: req.body,
      },
      user: {
        id: authReq.userId,
      },
    });
  }

  // Build error response
  const response: {
    error: string;
    errorCode: string;
    message: string;
    traceId?: string;
    stack?: string;
    details?: unknown;
  } = {
    error: apiError.name,
    errorCode: apiError.errorCode,
    message: apiError.message,
  };
  if (authReq.traceId !== undefined) {
    response.traceId = authReq.traceId;
  }

  // Include details if present
  if (apiError.details) {
    response.details = apiError.details;
  }

  // Only include stack in development
  if (config.nodeEnv === "development" && err instanceof Error && err.stack !== undefined) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
