/**
 * Sentry Error Tracking Integration
 * Captures and reports errors to Sentry
 */
import * as Sentry from '@sentry/node';
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
/**
 * Initialize Sentry
 */
export declare function initializeSentry(): void;
/**
 * Sentry request handler middleware
 * Must be added before other middleware
 */
export declare function sentryRequestHandler(): (_req: Request, _res: Response, next: NextFunction) => void;
/**
 * Sentry tracing handler middleware
 * Adds performance tracing
 */
export declare function sentryTracingHandler(): (_req: Request, _res: Response, next: NextFunction) => void;
/**
 * Sentry error handler middleware
 * Must be added before error handler
 */
export declare function sentryErrorHandler(): (err: Error, req: Request, res: Response, next: NextFunction) => void;
/**
 * Set user context for Sentry
 */
export declare function setSentryUser(req: AuthRequest): void;
/**
 * Capture exception to Sentry
 */
export declare function captureException(error: Error, context?: Record<string, unknown>): void;
/**
 * Capture message to Sentry
 */
export declare function captureMessage(message: string, level?: Sentry.SeverityLevel, context?: Record<string, unknown>): void;
//# sourceMappingURL=sentry.d.ts.map