/**
 * Sentry Error Tracking Integration
 * Captures and reports errors to Sentry
 */

import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { Request, Response, NextFunction } from 'express';
import { validatedConfig } from '../config/validation';
import { AuthRequest } from './auth';

let sentryInitialized = false;

/**
 * Initialize Sentry
 */
export function initializeSentry(): void {
  if (sentryInitialized) {
    return;
  }

  if (!validatedConfig.sentry.dsn) {
    console.log('Sentry DSN not configured, skipping Sentry initialization');
    return;
  }

  Sentry.init({
    dsn: validatedConfig.sentry.dsn,
    environment: validatedConfig.sentry.environment,
    tracesSampleRate: validatedConfig.sentry.tracesSampleRate,
    profilesSampleRate: validatedConfig.sentry.environment === 'production' ? 0.1 : 1.0,
    integrations: [
      new ProfilingIntegration(),
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express(),
    ],
    beforeSend(event, _hint) {
      // Don't send events in development unless explicitly enabled
      if (validatedConfig.nodeEnv === 'development' && !process.env.SENTRY_ENABLE_DEV) {
        return null;
      }
      return event;
    },
  });

  sentryInitialized = true;
  console.log('Sentry initialized');
}

/**
 * Sentry request handler middleware
 * Must be added before other middleware
 */
export function sentryRequestHandler() {
  if (!sentryInitialized) {
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }
  
  return Sentry.Handlers.requestHandler({
    user: ['id', 'email'],
    ip: true,
  });
}

/**
 * Sentry tracing handler middleware
 * Adds performance tracing
 */
export function sentryTracingHandler() {
  if (!sentryInitialized) {
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }
  
  return Sentry.Handlers.tracingHandler();
}

/**
 * Sentry error handler middleware
 * Must be added before error handler
 */
export function sentryErrorHandler(): (err: Error, req: Request, res: Response, next: NextFunction) => void {
  if (!sentryInitialized) {
    return (err: Error, _req: Request, _res: Response, next: NextFunction) => next(err);
  }
  
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Don't report 4xx errors (client errors)
      const apiError = error as { statusCode?: number };
      if (apiError.statusCode && apiError.statusCode < 500) {
        return false;
      }
      return true;
    },
  }) as (err: Error, req: Request, res: Response, next: NextFunction) => void;
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
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, unknown>): void {
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
