/**
 * Production-Grade Structured Logging
 */

import winston from "winston";
import { redact } from "./redaction";
import { trace } from "@opentelemetry/api";
import { config } from "../config";
import { AsyncLocalStorage } from "async_hooks";

export const requestContext = new AsyncLocalStorage<{
  requestId?: string;
  tenantId?: string;
  userId?: string;
  traceId?: string;
  executionId?: string;
}>();

function getTraceContext(): { trace_id?: string; span_id?: string } {
  const span = trace.getActiveSpan();
  if (!span) {
    return {};
  }

  const spanContext = span.spanContext();
  return {
    trace_id: spanContext.traceId,
    span_id: spanContext.spanId,
  };
}

function getRequestContext(): {
  request_id?: string;
  tenant_id?: string;
  user_id?: string;
  trace_id?: string;
  execution_id?: string;
} {
  const context = requestContext.getStore();
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

const contextFormat = winston.format((info: winston.Logform.TransformableInfo) => {
  const traceContext = getTraceContext();
  const reqContext = getRequestContext();
  return {
    ...info,
    ...traceContext,
    ...reqContext,
  };
});

function createPrintfFormat() {
  return winston.format.printf(
    (
      info: winston.Logform.TransformableInfo & {
        request_id?: string;
        trace_id?: string;
        span_id?: string;
        tenant_id?: string;
        user_id?: string;
        execution_id?: string;
      }
    ) => {
      const timestamp = info.timestamp as string | Date | undefined;
      const level = info.level;
      const message = info.message;
      const request_id = info.request_id;
      const trace_id = info.trace_id;
      const span_id = info.span_id;
      const tenant_id = info.tenant_id;
      const user_id = info.user_id;
      const execution_id = info.execution_id;

      const meta = { ...(info as Record<string, unknown>) };
      delete meta.timestamp;
      delete meta.level;
      delete meta.message;
      delete meta.request_id;
      delete meta.trace_id;
      delete meta.span_id;
      delete meta.tenant_id;
      delete meta.user_id;
      delete meta.execution_id;
      const metaStr = Object.keys(meta).length ? JSON.stringify(redact(meta)) : "";

      const requestInfo =
        request_id && typeof request_id === "string" ? `[req=${request_id.substring(0, 8)}]` : "";
      const traceInfo =
        trace_id && typeof trace_id === "string" ? `[trace=${trace_id.substring(0, 8)}]` : "";
      const spanInfo =
        span_id && typeof span_id === "string" ? `[span=${span_id.substring(0, 8)}]` : "";
      const tenantInfo = tenant_id && typeof tenant_id === "string" ? `[tenant=${tenant_id}]` : "";
      const userInfo = user_id && typeof user_id === "string" ? `[user=${user_id}]` : "";
      const executionInfo =
        execution_id && typeof execution_id === "string"
          ? `[exec=${execution_id.substring(0, 8)}]`
          : "";
      const timestampStr = typeof timestamp === "string" ? timestamp : String(timestamp);
      const messageStr = typeof message === "string" ? message : String(message);

      return `${timestampStr} [${level}]${requestInfo}${traceInfo}${spanInfo}${tenantInfo}${userInfo}${executionInfo}: ${messageStr} ${metaStr}`;
    }
  );
}

const logFormat = winston.format.combine(
  contextFormat(),
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: {
    service: "settler-api",
    environment: config.nodeEnv,
  },
  transports: [
    new winston.transports.Console({
      level: config.nodeEnv === "test" ? "error" : undefined,
      format: winston.format.combine(winston.format.colorize(), createPrintfFormat()),
    }),
  ],
});

function shouldLog(): boolean {
  const samplingRate = config.logging.samplingRate as number;
  if (samplingRate >= 1.0) {
    return true;
  }
  return Math.random() < samplingRate;
}

export function logInfo(message: string, meta?: Record<string, unknown>) {
  if (!shouldLog()) {
    return;
  }
  logger.info(message, redact(meta));
}

export function logError(message: string, error?: unknown, meta?: Record<string, unknown>) {
  logger.error(message, {
    ...redact(meta),
    ...(error instanceof Error
      ? { message: String(error), stack: error.stack }
      : { message: String(error) }),
  });
}

export function logWarn(message: string, meta?: Record<string, unknown>) {
  if (!shouldLog()) {
    return;
  }
  logger.warn(message, redact(meta));
}

export function logDebug(message: string, meta?: Record<string, unknown>) {
  if (!shouldLog()) {
    return;
  }
  logger.debug(message, redact(meta));
}

export function logBusinessEvent(
  event: string,
  meta?: {
    tenant_id?: string;
    user_id?: string;
    job_id?: string;
    execution_id?: string;
    [key: string]: unknown;
  }
) {
  logger.info(`business_event:${event}`, {
    event_type: event,
    ...redact(meta),
  });
}

export function logPerformance(
  operation: string,
  durationMs: number,
  meta?: {
    tenant_id?: string;
    [key: string]: unknown;
  }
) {
  logger.info(`performance:${operation}`, {
    operation,
    duration_ms: durationMs,
    ...redact(meta),
  });
}
