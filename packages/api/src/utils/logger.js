"use strict";
/**
 * Production-Grade Structured Logging
 */
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.requestContext = void 0;
exports.logInfo = logInfo;
exports.logError = logError;
exports.logWarn = logWarn;
exports.logDebug = logDebug;
exports.logBusinessEvent = logBusinessEvent;
exports.logPerformance = logPerformance;
var winston_1 = require("winston");
var redaction_1 = require("./redaction");
var api_1 = require("@opentelemetry/api");
var config_1 = require("../config");
var async_hooks_1 = require("async_hooks");
exports.requestContext = new async_hooks_1.AsyncLocalStorage();
function getTraceContext() {
  var span = api_1.trace.getActiveSpan();
  if (!span) {
    return {};
  }
  var spanContext = span.spanContext();
  return {
    trace_id: spanContext.traceId,
    span_id: spanContext.spanId,
  };
}
function getRequestContext() {
  var context = exports.requestContext.getStore();
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
var contextFormat = winston_1.default.format(function (info) {
  var traceContext = getTraceContext();
  var reqContext = getRequestContext();
  return __assign(__assign(__assign({}, info), traceContext), reqContext);
});
function createPrintfFormat() {
  return winston_1.default.format.printf(function (info) {
    var timestamp = info.timestamp;
    var level = info.level;
    var message = info.message;
    var request_id = info.request_id;
    var trace_id = info.trace_id;
    var span_id = info.span_id;
    var tenant_id = info.tenant_id;
    var user_id = info.user_id;
    var execution_id = info.execution_id;
    var meta = __assign({}, info);
    delete meta.timestamp;
    delete meta.level;
    delete meta.message;
    delete meta.request_id;
    delete meta.trace_id;
    delete meta.span_id;
    delete meta.tenant_id;
    delete meta.user_id;
    delete meta.execution_id;
    var metaStr = Object.keys(meta).length ? JSON.stringify((0, redaction_1.redact)(meta)) : "";
    var requestInfo =
      request_id && typeof request_id === "string"
        ? "[req=".concat(request_id.substring(0, 8), "]")
        : "";
    var traceInfo =
      trace_id && typeof trace_id === "string"
        ? "[trace=".concat(trace_id.substring(0, 8), "]")
        : "";
    var spanInfo =
      span_id && typeof span_id === "string" ? "[span=".concat(span_id.substring(0, 8), "]") : "";
    var tenantInfo =
      tenant_id && typeof tenant_id === "string" ? "[tenant=".concat(tenant_id, "]") : "";
    var userInfo = user_id && typeof user_id === "string" ? "[user=".concat(user_id, "]") : "";
    var executionInfo =
      execution_id && typeof execution_id === "string"
        ? "[exec=".concat(execution_id.substring(0, 8), "]")
        : "";
    var timestampStr = typeof timestamp === "string" ? timestamp : String(timestamp);
    var messageStr = typeof message === "string" ? message : String(message);
    return ""
      .concat(timestampStr, " [")
      .concat(level, "]")
      .concat(requestInfo)
      .concat(traceInfo)
      .concat(spanInfo)
      .concat(tenantInfo)
      .concat(userInfo)
      .concat(executionInfo, ": ")
      .concat(messageStr, " ")
      .concat(metaStr);
  });
}
var logFormat = winston_1.default.format.combine(
  contextFormat(),
  winston_1.default.format.timestamp(),
  winston_1.default.format.errors({ stack: true }),
  winston_1.default.format.json()
);
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
      format: winston_1.default.format.combine(
        winston_1.default.format.colorize(),
        createPrintfFormat()
      ),
    }),
  ],
});
function shouldLog() {
  var samplingRate = config_1.config.logging.samplingRate;
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
  exports.logger.error(
    message,
    __assign(
      __assign({}, (0, redaction_1.redact)(meta)),
      error instanceof Error
        ? { message: String(error), stack: error.stack }
        : { message: String(error) }
    )
  );
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
  exports.logger.info(
    "business_event:".concat(event),
    __assign({ event_type: event }, (0, redaction_1.redact)(meta))
  );
}
function logPerformance(operation, durationMs, meta) {
  exports.logger.info(
    "performance:".concat(operation),
    __assign({ operation: operation, duration_ms: durationMs }, (0, redaction_1.redact)(meta))
  );
}
