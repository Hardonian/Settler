/**
 * Standard error codes for the application.
 * Using string literals for better API debugging.
 */
export declare enum ErrorCode {
    BAD_REQUEST = "BAD_REQUEST",
    UNAUTHORIZED = "UNAUTHORIZED",
    FORBIDDEN = "FORBIDDEN",
    NOT_FOUND = "NOT_FOUND",
    CONFLICT = "CONFLICT",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
    INTERNAL_ERROR = "INTERNAL_ERROR",
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
    DATABASE_ERROR = "DATABASE_ERROR",
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
    TIMEOUT_ERROR = "TIMEOUT_ERROR"
}
/**
 * HTTP status codes mapped to error codes
 */
export declare const ERROR_CODE_TO_HTTP_STATUS: Record<ErrorCode, number>;
/**
 * Validation error detail for field-level errors
 */
export interface ValidationErrorDetail {
    field: string;
    message: string;
    code?: string;
}
/**
 * Standardized error envelope for all API responses.
 * Ensures consistent error handling across the application.
 */
export interface ErrorEnvelope {
    /** Machine-readable error code */
    code: ErrorCode;
    /** Human-readable error message */
    message: string;
    /** Unique request identifier for tracing */
    correlationId?: string;
    /** Additional context or validation errors */
    details?: ValidationErrorDetail[] | Record<string, unknown>;
    /** Stack trace (only in development) */
    stack?: string;
    /** ISO timestamp of when the error occurred */
    timestamp: string;
}
/**
 * Application error class with correlation ID support
 */
export declare class AppError extends Error {
    readonly code: ErrorCode;
    readonly correlationId?: string;
    readonly details?: ValidationErrorDetail[] | Record<string, unknown>;
    readonly isOperational: boolean;
    constructor(code: ErrorCode, message: string, options?: {
        correlationId?: string;
        details?: ValidationErrorDetail[] | Record<string, unknown>;
        cause?: Error;
        isOperational?: boolean;
    });
    /**
     * Convert error to standard envelope format
     */
    toEnvelope(includeStack?: boolean): ErrorEnvelope;
    /**
     * Get HTTP status code for this error
     */
    get httpStatus(): number;
}
//# sourceMappingURL=types.d.ts.map