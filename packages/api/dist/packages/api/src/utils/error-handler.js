"use strict";
/**
 * Standardized Error Handling Utilities
 * Provides type-safe error extraction and handling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getErrorMessage = getErrorMessage;
exports.getErrorStack = getErrorStack;
exports.isHttpError = isHttpError;
exports.handleRouteError = handleRouteError;
const api_response_1 = require("./api-response");
const logger_1 = require("./logger");
const typed_errors_1 = require("./typed-errors");
/**
 * Safely extracts error message from unknown error type
 */
function getErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === "string") {
        return error;
    }
    return "An unexpected error occurred";
}
/**
 * Safely extracts error stack trace
 */
function getErrorStack(error) {
    if (error instanceof Error) {
        return error.stack;
    }
    return undefined;
}
function isHttpError(error) {
    return ((0, typed_errors_1.isApiError)(error) ||
        (error instanceof Error &&
            "statusCode" in error &&
            typeof error.statusCode === "number"));
}
/**
 * Handles errors in route handlers with proper typing
 */
function handleRouteError(res, error, defaultMessage = "An error occurred", _defaultStatusCode = 500, context) {
    const apiError = (0, typed_errors_1.toApiError)(error);
    const message = apiError.message || defaultMessage;
    const statusCode = apiError.statusCode ?? _defaultStatusCode;
    const errorCode = apiError.errorCode || "INTERNAL_ERROR";
    const details = apiError.details;
    (0, logger_1.logError)(defaultMessage, error, context);
    // Extract traceId from request if available
    const traceId = res.req.traceId;
    (0, api_response_1.sendError)(res, statusCode, errorCode, message, details, traceId);
}
//# sourceMappingURL=error-handler.js.map