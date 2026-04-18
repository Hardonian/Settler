import { Request, Response, NextFunction } from "express";
import { logError } from "../utils/logger";
import { AuthRequest } from "./auth";
import { config } from "../config";
import { captureException, setSentryUser } from "./sentry";
import { toApiError } from "../utils/typed-errors";
import { sendProblemJson } from "../utils/problem-json";

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
  logError("Request error", err, {
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
    // SEC-13: Scrub sensitive data before sending to Sentry
    const safeHeaders = { ...req.headers };
    const sensitiveHeaders = ["authorization", "cookie", "x-api-key", "x-csrf-token"];
    for (const h of sensitiveHeaders) {
      if (safeHeaders[h]) {
        safeHeaders[h] = "[REDACTED]";
      }
    }
    captureException(error, {
      request: {
        method: req.method,
        url: req.url,
        headers: safeHeaders,
        query: req.query,
      },
      user: {
        id: authReq.userId,
      },
    });
  }

  const extra: Record<string, unknown> = {};
  if (apiError.details) {
    extra.details = apiError.details;
  }
  if (config.nodeEnv === "development" && err instanceof Error && err.stack !== undefined) {
    extra.stack = err.stack;
  }

  sendProblemJson(authReq, res, {
    status: statusCode,
    title: apiError.name,
    detail: apiError.message,
    code: apiError.errorCode,
    extra,
  });
};
