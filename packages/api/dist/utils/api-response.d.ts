/**
 * Standardized API Response Utilities
 * Provides consistent response format across all endpoints
 */
import { Response } from 'express';
export interface ApiResponse<T = unknown> {
    data?: T;
    error?: string;
    message?: string;
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        cursor?: string;
    };
}
export interface ApiError {
    error: string;
    message: string;
    code?: string;
    details?: unknown;
    traceId?: string;
}
/**
 * Send success response
 *
 * @param res - Express response object
 * @param data - Response data
 * @param message - Optional success message
 * @param statusCode - HTTP status code (default: 200)
 *
 * @example
 * ```typescript
 * sendSuccess(res, { id: '123', name: 'Job' }, 'Job created successfully', 201);
 * ```
 */
export declare function sendSuccess<T>(res: Response, data: T, message?: string, statusCode?: number): void;
/**
 * Send standardized error response
 *
 * @param res - Express response object
 * @param statusCode - HTTP status code (default: 400)
 * @param code - Machine-readable error code (e.g., "VALIDATION_ERROR")
 * @param message - Human-readable error message
 * @param details - Optional additional error details
 * @param traceId - Optional trace ID for debugging (auto-extracted from request if available)
 *
 * @example
 * ```typescript
 * sendError(res, 400, 'VALIDATION_ERROR', 'Invalid input', { fields: ['name'] });
 * sendError(res, 404, 'NOT_FOUND', 'Job not found', undefined, req.traceId);
 * ```
 */
export declare function sendError(res: Response, statusCode: number, code: string, message: string, details?: unknown, traceId?: string): void;
/**
 * Send paginated response
 */
export declare function sendPaginated<T>(res: Response, data: T[], meta: {
    page: number;
    limit: number;
    total: number;
    cursor?: string;
}): void;
/**
 * Send created response
 */
export declare function sendCreated<T>(res: Response, data: T, message?: string): void;
/**
 * Send no content response
 */
export declare function sendNoContent(res: Response): void;
//# sourceMappingURL=api-response.d.ts.map