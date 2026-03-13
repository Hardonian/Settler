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
const error_taxonomy_1 = require("../services/observability/error-taxonomy");
const runtime_events_1 = require("../services/ops-intelligence/runtime-events");
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
function handleRouteError(res, error, defaultMessage = "An error occurred", defaultStatusCode = 500, context) {
    const apiError = (0, typed_errors_1.toApiError)(error);
    const message = apiError.message || defaultMessage;
    const statusCode = apiError.statusCode ?? defaultStatusCode;
    const errorCode = apiError.errorCode || "INTERNAL_ERROR";
    const details = apiError.details;
    (0, logger_1.logError)(defaultMessage, error, context);
    emitStructuredRouteError(res, error, statusCode, context);
    // Extract traceId from request if available
    const traceId = res.req.traceId;
    (0, api_response_1.sendError)(res, statusCode, errorCode, message, details, traceId);
}
function emitStructuredRouteError(res, error, statusCode, context) {
    const req = res.req;
    const tenantId = typeof context?.tenant_id === "string" ? context.tenant_id : req.tenantId;
    if (!tenantId) {
        return;
    }
    const routePath = typeof context?.route === "string" ? context.route : deriveRoute(req);
    const moduleName = typeof context?.module === "string" ? context.module : "routes/unknown-module";
    const { category, severity, retryable } = classifyStatusCode(statusCode);
    const metadata = (0, error_taxonomy_1.buildErrorObservabilityMetadata)({
        tenant_id: tenantId,
        run_id: typeof context?.run_id === "string" ? context.run_id : undefined,
        route: routePath,
        module: moduleName,
        category,
        severity,
        retryable,
        errorName: error instanceof Error ? error.name : "RouteError",
    });
    void (0, runtime_events_1.emitOperatorRuntimeEvent)({
        eventType: "error_thrown",
        tenantId,
        runId: metadata.run_id,
        metadata: {
            ...metadata,
            status_code: statusCode,
        },
    });
}
function deriveRoute(req) {
    const method = req.method || "UNKNOWN";
    const route = req.route?.path || req.originalUrl || "unknown_route";
    return `${method} ${route}`;
}
function classifyStatusCode(statusCode) {
    if (statusCode >= 500) {
        return {
            category: error_taxonomy_1.ERROR_CATEGORY.INTERNAL,
            severity: error_taxonomy_1.ERROR_SEVERITY.SEV1,
            retryable: true,
        };
    }
    if (statusCode === 429) {
        return {
            category: error_taxonomy_1.ERROR_CATEGORY.THROTTLING,
            severity: error_taxonomy_1.ERROR_SEVERITY.SEV2,
            retryable: true,
        };
    }
    if (statusCode === 401) {
        return {
            category: error_taxonomy_1.ERROR_CATEGORY.AUTHENTICATION,
            severity: error_taxonomy_1.ERROR_SEVERITY.SEV3,
            retryable: false,
        };
    }
    if (statusCode === 403) {
        return {
            category: error_taxonomy_1.ERROR_CATEGORY.AUTHORIZATION,
            severity: error_taxonomy_1.ERROR_SEVERITY.SEV3,
            retryable: false,
        };
    }
    return {
        category: error_taxonomy_1.ERROR_CATEGORY.VALIDATION,
        severity: error_taxonomy_1.ERROR_SEVERITY.SEV3,
        retryable: false,
    };
}
//# sourceMappingURL=error-handler.js.map