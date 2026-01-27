"use strict";
/**
 * Standardized API Response Utilities
 * Provides consistent response format across all endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = sendSuccess;
exports.sendError = sendError;
exports.sendPaginated = sendPaginated;
exports.sendCreated = sendCreated;
exports.sendNoContent = sendNoContent;
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
function sendSuccess(res, data, message, statusCode = 200) {
    const response = {
        data,
    };
    if (message) {
        response.message = message;
    }
    res.status(statusCode).json(response);
}
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
function sendError(res, statusCode, code, message, details, traceId) {
    const response = {
        error: code,
        message,
    };
    if (details) {
        response.details = details;
    }
    // Extract traceId from request if available
    const requestTraceId = res.req.traceId;
    const finalTraceId = traceId || requestTraceId;
    if (finalTraceId) {
        response.traceId = finalTraceId;
    }
    res.status(statusCode).json(response);
}
/**
 * Send paginated response
 */
function sendPaginated(res, data, meta) {
    const response = {
        data,
        meta: {
            page: meta.page,
            limit: meta.limit,
            total: meta.total,
            ...(meta.cursor !== undefined && { cursor: meta.cursor }),
        },
    };
    res.status(200).json(response);
}
/**
 * Send created response
 */
function sendCreated(res, data, message) {
    sendSuccess(res, data, message, 201);
}
/**
 * Send no content response
 */
function sendNoContent(res) {
    res.status(204).send();
}
//# sourceMappingURL=api-response.js.map