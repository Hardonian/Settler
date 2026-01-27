"use strict";
/**
 * Error Standardization Utilities
 * Ensures consistent error handling across the application
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCode = void 0;
exports.standardizeError = standardizeError;
exports.handleStandardizedError = handleStandardizedError;
const api_response_1 = require("./api-response");
const logger_1 = require("./logger");
var ErrorCode;
(function (ErrorCode) {
    // Client errors (4xx)
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    ErrorCode["FORBIDDEN"] = "FORBIDDEN";
    ErrorCode["NOT_FOUND"] = "NOT_FOUND";
    ErrorCode["CONFLICT"] = "CONFLICT";
    ErrorCode["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    ErrorCode["PAYLOAD_TOO_LARGE"] = "PAYLOAD_TOO_LARGE";
    // Server errors (5xx)
    ErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    ErrorCode["SERVICE_UNAVAILABLE"] = "SERVICE_UNAVAILABLE";
    ErrorCode["DATABASE_ERROR"] = "DATABASE_ERROR";
    ErrorCode["EXTERNAL_SERVICE_ERROR"] = "EXTERNAL_SERVICE_ERROR";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
/**
 * Map common errors to standardized error codes
 */
function standardizeError(error) {
    if (error instanceof Error) {
        // Database errors
        if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
            return {
                code: ErrorCode.CONFLICT,
                message: 'Resource already exists',
                statusCode: 409,
            };
        }
        if (error.message.includes('foreign key') || error.message.includes('violates foreign key')) {
            return {
                code: ErrorCode.VALIDATION_ERROR,
                message: 'Invalid reference to related resource',
                statusCode: 400,
            };
        }
        if (error.message.includes('not found')) {
            return {
                code: ErrorCode.NOT_FOUND,
                message: error.message,
                statusCode: 404,
            };
        }
        // Validation errors
        if (error.name === 'ZodError' || error.message.includes('validation')) {
            return {
                code: ErrorCode.VALIDATION_ERROR,
                message: 'Invalid input',
                statusCode: 400,
                details: error.message,
            };
        }
    }
    // Default to internal error
    return {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
        statusCode: 500,
    };
}
/**
 * Handle and send standardized error response
 */
function handleStandardizedError(res, error, traceId) {
    const standardized = standardizeError(error);
    // Log error
    (0, logger_1.logError)(`Error [${standardized.code}]: ${standardized.message}`, error, {
        code: standardized.code,
        statusCode: standardized.statusCode,
        traceId,
    });
    // Send standardized error response
    (0, api_response_1.sendError)(res, standardized.statusCode, standardized.code, standardized.message, standardized.details, traceId);
}
//# sourceMappingURL=error-standardization.js.map