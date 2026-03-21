/**
 * Sentry Error Tracking Integration
 * Captures and reports errors to Sentry
 */

import * as Sentry from "@sentry/node";
import { NextFunction, Request, RequestHandler, Response } from "express";
import { validatedConfig } from "../config/validation";
import { AuthRequest } from "./auth";
import { logInfo } from "../utils/logger";

let sentryInitialized = false;

/**
 * Initialize Sentry
 */
export function initializeSentry(): void {
  if (sentryInitialized) {
    return;
  }

  if (!validatedConfig.sentry.dsn) {
    logInfo("Sentry DSN not configured, skipping Sentry initialization");
    return;
  }

  Sentry.init({
    dsn: validatedConfig.sentry.dsn,
    environment: validatedConfig.sentry.environment,
    tracesSampleRate: validatedConfig.sentry.tracesSampleRate,
    integrations: [Sentry.httpIntegration()],
    beforeSend(event, _hint) {
      // Don't send events in development unless explicitly enabled
      if (validatedConfig.nodeEnv === "development" && !process.env.SENTRY_ENABLE_DEV) {
        return null;
      }
      return event;
    },
  });

  sentryInitialized = true;
  logInfo("Sentry initialized");
}

/**
 * Sentry request handler middleware
 * Must be added before other middleware
 */
export function sentryRequestHandler(): RequestHandler {
  if (!sentryInitialized) {
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }

  return (_req: Request, _res: Response, next: NextFunction) => next();
}

/**
 * Sentry tracing handler middleware
 * Adds performance tracing
 */
export function sentryTracingHandler(): RequestHandler {
  if (!sentryInitialized) {
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }

  return (_req: Request, _res: Response, next: NextFunction) => next();
}

/**
 * Sentry error handler middleware
 * Must be added before error handler
 */
export function sentryErrorHandler(): (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => void {
  if (!sentryInitialized) {
    return (err: Error, _req: Request, _res: Response, next: NextFunction) => next(err);
  }

  return (err: Error, _req: Request, _res: Response, next: NextFunction) => {
    const apiError = err as { statusCode?: number };
    if (!apiError.statusCode || apiError.statusCode >= 500) {
      Sentry.captureException(err);
    }
    next(err);
  };
}

/**
 * Set user context for Sentry
 */
export function setSentryUser(req: AuthRequest): void {
  if (!sentryInitialized || !req.userId) {
    return;
  }

  const user: { id: string; ip_address?: string } = {
    id: req.userId,
  };
  if (req.ip !== undefined) {
    user.ip_address = req.ip;
  }
  Sentry.setUser(user);
}

/**
 * Capture exception to Sentry
 */
export function captureException(error: Error, context?: Record<string, unknown>): void {
  if (!sentryInitialized) {
    return;
  }

  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          scope.setContext(key, value as Record<string, unknown>);
        }
      });
    }
    Sentry.captureException(error);
  });
}

/**
 * Capture message to Sentry
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = "info",
  context?: Record<string, unknown>
): void {
  if (!sentryInitialized) {
    return;
  }

  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          scope.setContext(key, value as Record<string, unknown>);
        }
      });
    }
    Sentry.captureMessage(message, level);
  });
}
