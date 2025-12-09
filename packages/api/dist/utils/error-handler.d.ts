/**
 * Standardized Error Handling Utilities
 * Provides type-safe error extraction and handling
 */
import { Response } from 'express';
/**
 * Safely extracts error message from unknown error type
 */
export declare function getErrorMessage(error: unknown): string;
/**
 * Safely extracts error stack trace
 */
export declare function getErrorStack(error: unknown): string | undefined;
/**
 * Checks if error is a known error type with status code
 * @deprecated Use isApiError from typed-errors instead
 */
export interface HttpError extends Error {
    statusCode?: number;
    code?: string;
    details?: unknown;
}
export declare function isHttpError(error: unknown): error is HttpError;
/**
 * Handles errors in route handlers with proper typing
 */
export declare function handleRouteError(res: Response, error: unknown, defaultMessage?: string, _defaultStatusCode?: number, context?: Record<string, unknown>): void;
//# sourceMappingURL=error-handler.d.ts.map