"use strict";
/**
 * Structured Logging with OpenTelemetry Integration
 * JSON structured logs with trace_id, span_id, tenant_id
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
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
// Custom format that adds trace context
const traceContextFormat = winston_1.default.format((info) => {
    const traceContext = getTraceContext();
    return {
        ...info,
        ...traceContext,
    };
})();
const logFormat = winston_1.default.format.combine(traceContextFormat, winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json());
exports.logger = winston_1.default.createLogger({
    level: config_1.config.logging.level,
    format: logFormat,
    defaultMeta: {
        service: 'settler-api',
        environment: config_1.config.nodeEnv,
    },
    transports: [
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.printf(({ timestamp, level, message, trace_id, span_id, tenant_id, ...meta }) => {
                const metaStr = Object.keys(meta).length ? JSON.stringify((0, redaction_1.redact)(meta)) : '';
                const traceInfo = trace_id && typeof trace_id === 'string' ? `[trace_id=${trace_id.substring(0, 16)}]` : '';
                const spanInfo = span_id && typeof span_id === 'string' ? `[span_id=${span_id.substring(0, 16)}]` : '';
                const tenantInfo = tenant_id ? `[tenant_id=${tenant_id}]` : '';
                return `${timestamp} [${level}]${traceInfo}${spanInfo}${tenantInfo}: ${message} ${metaStr}`;
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
        stack: error instanceof Error && 'stack' in errorObj && errorObj.stack ? String(errorObj.stack) : undefined,
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