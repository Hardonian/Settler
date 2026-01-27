"use strict";
/**
 * Production-Grade Structured Logging
 *
 * Features:
 * - JSON structured logs for production parsing
 * - OpenTelemetry trace and span IDs for distributed tracing
 * - Request ID for client-server correlation
 * - Automatic secret redaction
 * - Log sampling for high-volume endpoints
 * - Tenant/user context propagation
 *
 * Integration:
 * - OpenTelemetry for distributed tracing
 * - Winston for structured logging
 * - Request ID middleware for correlation
 *
 * Critical for:
 * - Production debugging at 02:13 AM
 * - Error investigation with full context
 * - Performance monitoring and profiling
 * - Security audit trails
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.requestContext = void 0;
exports.logInfo = logInfo;
exports.logError = logError;
exports.logWarn = logWarn;
exports.logDebug = logDebug;
exports.logBusinessEvent = logBusinessEvent;
exports.logPerformance = logPerformance;
const winston_1 = __importDefault(require("winston"));
const redaction_1 = require("./redaction");
const api_1 = require("@opentelemetry/api");
const config_1 = require("../config");
const async_hooks_1 = require("async_hooks");
// AsyncLocalStorage for request-scoped data (requestId, tenantId, userId)
exports.requestContext = new async_hooks_1.AsyncLocalStorage();
// Get current trace and span IDs from OpenTelemetry context
function getTraceContext() {
    const span = api_1.trace.getActiveSpan();
    if (!span) {
        return {};
    }
    const spanContext = span.spanContext();
    return {
        trace_id: spanContext.traceId,
        span_id: spanContext.spanId,
    };
}
// Get request context (requestId, tenantId, userId) from AsyncLocalStorage
function getRequestContext() {
    const context = exports.requestContext.getStore();
    if (!context) {
        return {};
    }
    return {
        request_id: context.requestId,
        tenant_id: context.tenantId,
        user_id: context.userId,
    };
}
// Custom format that adds trace context and request context
const contextFormat = winston_1.default.format((info) => {
    const traceContext = getTraceContext();
    const reqContext = getRequestContext();
    return {
        ...info,
        ...traceContext,
        ...reqContext,
    };
})();
const logFormat = winston_1.default.format.combine(contextFormat, winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json());
exports.logger = winston_1.default.createLogger({
    level: config_1.config.logging.level,
    format: logFormat,
    defaultMeta: {
        service: "settler-api",
        environment: config_1.config.nodeEnv,
    },
    transports: [
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.printf(({ timestamp, level, message, request_id, trace_id, span_id, tenant_id, user_id, ...meta }) => {
                const metaStr = Object.keys(meta).length ? JSON.stringify((0, redaction_1.redact)(meta)) : "";
                const requestInfo = request_id && typeof request_id === "string"
                    ? `[req=${request_id.substring(0, 8)}]`
                    : "";
                const traceInfo = trace_id && typeof trace_id === "string" ? `[trace=${trace_id.substring(0, 8)}]` : "";
                const spanInfo = span_id && typeof span_id === "string" ? `[span=${span_id.substring(0, 8)}]` : "";
                const tenantInfo = tenant_id && typeof tenant_id === "string" ? `[tenant=${tenant_id}]` : "";
                const userInfo = user_id && typeof user_id === "string" ? `[user=${user_id}]` : "";
                const timestampStr = typeof timestamp === "string" ? timestamp : String(timestamp);
                const messageStr = typeof message === "string" ? message : String(message);
                const levelStr = typeof level === "string" ? level : String(level);
                return `${timestampStr} [${levelStr}]${requestInfo}${traceInfo}${spanInfo}${tenantInfo}${userInfo}: ${messageStr} ${metaStr}`;
            })),
        }),
    ],
});
// Log sampling configuration
function shouldLog() {
    if (config_1.config.logging.samplingRate >= 1.0) {
        return true;
    }
    return Math.random() < config_1.config.logging.samplingRate;
}
// Helper to log with automatic redaction and trace context
function logInfo(message, meta) {
    if (!shouldLog()) {
        return;
    }
    exports.logger.info(message, (0, redaction_1.redact)(meta));
}
function logError(message, error, meta) {
    // Always log errors (no sampling)
    const errorObj = error instanceof Error ? error : { message: String(error) };
    exports.logger.error(message, {
        ...(0, redaction_1.redact)(meta),
        error: errorObj.message,
        stack: error instanceof Error && "stack" in errorObj && errorObj.stack
            ? String(errorObj.stack)
            : undefined,
    });
}
function logWarn(message, meta) {
    if (!shouldLog()) {
        return;
    }
    exports.logger.warn(message, (0, redaction_1.redact)(meta));
}
function logDebug(message, meta) {
    if (!shouldLog()) {
        return;
    }
    exports.logger.debug(message, (0, redaction_1.redact)(meta));
}
// Business event logging
function logBusinessEvent(event, meta) {
    exports.logger.info(`business_event:${event}`, {
        event_type: event,
        ...(0, redaction_1.redact)(meta),
    });
}
// Performance logging
function logPerformance(operation, durationMs, meta) {
    exports.logger.info(`performance:${operation}`, {
        operation,
        duration_ms: durationMs,
        ...(0, redaction_1.redact)(meta),
    });
}
//# sourceMappingURL=logger.js.map