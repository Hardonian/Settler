/**
 * Error Standardization Utilities
 * Ensures consistent error handling across the application
 */
import { Response } from 'express';
export declare enum ErrorCode {
    VALIDATION_ERROR = "VALIDATION_ERROR",
    UNAUTHORIZED = "UNAUTHORIZED",
    FORBIDDEN = "FORBIDDEN",
    NOT_FOUND = "NOT_FOUND",
    CONFLICT = "CONFLICT",
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
    PAYLOAD_TOO_LARGE = "PAYLOAD_TOO_LARGE",
    INTERNAL_ERROR = "INTERNAL_ERROR",
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
    DATABASE_ERROR = "DATABASE_ERROR",
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR"
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
export declare function standardizeError(error: unknown): StandardizedError;
/**
 * Handle and send standardized error response
 */
export declare function handleStandardizedError(res: Response, error: unknown, traceId?: string): void;
//# sourceMappingURL=error-standardization.d.ts.map