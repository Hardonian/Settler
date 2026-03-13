"use strict";
/**
 * Production-Grade Structured Logging
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
exports.requestContext = new async_hooks_1.AsyncLocalStorage();
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
function getRequestContext() {
    const context = exports.requestContext.getStore();
    if (!context) {
        return {};
    }
    return {
        request_id: context.requestId || undefined,
        tenant_id: context.tenantId || undefined,
        user_id: context.userId || undefined,
        trace_id: context.traceId || undefined,
        execution_id: context.executionId || undefined,
    };
}
const contextFormat = winston_1.default.format((info) => {
    const traceContext = getTraceContext();
    const reqContext = getRequestContext();
    return {
        ...info,
        ...traceContext,
        ...reqContext,
    };
});
function createPrintfFormat() {
    return winston_1.default.format.printf((info) => {
        const timestamp = info.timestamp;
        const level = info.level;
        const message = info.message;
        const request_id = info.request_id;
        const trace_id = info.trace_id;
        const span_id = info.span_id;
        const tenant_id = info.tenant_id;
        const user_id = info.user_id;
        const execution_id = info.execution_id;
        const meta = { ...info };
        delete meta.timestamp;
        delete meta.level;
        delete meta.message;
        delete meta.request_id;
        delete meta.trace_id;
        delete meta.span_id;
        delete meta.tenant_id;
        delete meta.user_id;
        delete meta.execution_id;
        const metaStr = Object.keys(meta).length ? JSON.stringify((0, redaction_1.redact)(meta)) : "";
        const requestInfo = request_id && typeof request_id === "string" ? `[req=${request_id.substring(0, 8)}]` : "";
        const traceInfo = trace_id && typeof trace_id === "string" ? `[trace=${trace_id.substring(0, 8)}]` : "";
        const spanInfo = span_id && typeof span_id === "string" ? `[span=${span_id.substring(0, 8)}]` : "";
        const tenantInfo = tenant_id && typeof tenant_id === "string" ? `[tenant=${tenant_id}]` : "";
        const userInfo = user_id && typeof user_id === "string" ? `[user=${user_id}]` : "";
        const executionInfo = execution_id && typeof execution_id === "string"
            ? `[exec=${execution_id.substring(0, 8)}]`
            : "";
        const timestampStr = typeof timestamp === "string" ? timestamp : String(timestamp);
        const messageStr = typeof message === "string" ? message : String(message);
        return `${timestampStr} [${level}]${requestInfo}${traceInfo}${spanInfo}${tenantInfo}${userInfo}${executionInfo}: ${messageStr} ${metaStr}`;
    });
}
const logFormat = winston_1.default.format.combine(contextFormat(), winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json());
exports.logger = winston_1.default.createLogger({
    level: config_1.config.logging.level,
    format: logFormat,
    defaultMeta: {
        service: "settler-api",
        environment: config_1.config.nodeEnv,
    },
    transports: [
        new winston_1.default.transports.Console({
            level: config_1.config.nodeEnv === "test" ? "error" : undefined,
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), createPrintfFormat()),
        }),
    ],
});
function shouldLog() {
    const samplingRate = config_1.config.logging.samplingRate;
    if (samplingRate >= 1.0) {
        return true;
    }
    return Math.random() < samplingRate;
}
function logInfo(message, meta) {
    if (!shouldLog()) {
        return;
    }
    exports.logger.info(message, (0, redaction_1.redact)(meta));
}
function logError(message, error, meta) {
    exports.logger.error(message, {
        ...(0, redaction_1.redact)(meta),
        ...(error instanceof Error
            ? { message: String(error), stack: error.stack }
            : { message: String(error) }),
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
function logBusinessEvent(event, meta) {
    exports.logger.info(`business_event:${event}`, {
        event_type: event,
        ...(0, redaction_1.redact)(meta),
    });
}
function logPerformance(operation, durationMs, meta) {
    exports.logger.info(`performance:${operation}`, {
        operation,
        duration_ms: durationMs,
        ...(0, redaction_1.redact)(meta),
    });
}
//# sourceMappingURL=logger.js.map