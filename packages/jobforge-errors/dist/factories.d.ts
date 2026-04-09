import { AppError, ValidationErrorDetail } from "./types";
/**
 * Factory functions for creating standardized errors.
 * These ensure consistent error creation across the application.
 */
export declare function createBadRequestError(message: string, options?: {
    correlationId?: string;
    details?: Record<string, unknown>;
}): AppError;
export declare function createUnauthorizedError(message?: string, options?: {
    correlationId?: string;
}): AppError;
export declare function createForbiddenError(message?: string, options?: {
    correlationId?: string;
}): AppError;
export declare function createNotFoundError(resource: string, options?: {
    correlationId?: string;
}): AppError;
export declare function createConflictError(message: string, options?: {
    correlationId?: string;
    details?: Record<string, unknown>;
}): AppError;
export declare function createValidationError(message: string, validationDetails: ValidationErrorDetail[], options?: {
    correlationId?: string;
}): AppError;
export declare function createRateLimitError(message?: string, options?: {
    correlationId?: string;
    details?: Record<string, unknown>;
}): AppError;
export declare function createInternalError(message?: string, options?: {
    correlationId?: string;
    cause?: Error;
}): AppError;
export declare function createDatabaseError(message?: string, options?: {
    correlationId?: string;
    cause?: Error;
}): AppError;
export declare function createExternalServiceError(service: string, options?: {
    correlationId?: string;
    cause?: Error;
}): AppError;
export declare function createTimeoutError(operation: string, options?: {
    correlationId?: string;
}): AppError;
/**
 * Convert unknown error to AppError with correlation ID
 */
export declare function toAppError(error: unknown, correlationId?: string): AppError;
//# sourceMappingURL=factories.d.ts.map