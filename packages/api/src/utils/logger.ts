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

import winston from "winston";
import { redact } from "./redaction";
import { trace } from "@opentelemetry/api";
import { config } from "../config";
import { AsyncLocalStorage } from "async_hooks";

// AsyncLocalStorage for request-scoped data (requestId, tenantId, userId)
export const requestContext = new AsyncLocalStorage<{
  requestId?: string;
  tenantId?: string;
  userId?: string;
}>();

// Get current trace and span IDs from OpenTelemetry context
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

// Get request context (requestId, tenantId, userId) from AsyncLocalStorage
function getRequestContext(): {
  request_id?: string;
  tenant_id?: string;
  user_id?: string;
} {
  const context = requestContext.getStore();
  if (!context) {
    return {};
  }

  return {
    request_id: context.requestId || undefined,
    tenant_id: context.tenantId || undefined,
    user_id: context.userId || undefined,
  };
}

// Custom format that adds trace context and request context
const contextFormat = winston.format((info) => {
  const traceContext = getTraceContext();
  const reqContext = getRequestContext();
  return {
    ...info,
    ...traceContext,
    ...reqContext,
  } as any;
})();

const logFormat = winston.format.combine(
  contextFormat,
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger: winston.Logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: {
    service: "settler-api",
    environment: config.nodeEnv,
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          ({
            timestamp,
            level,
            message,
            request_id,
            trace_id,
            span_id,
            tenant_id,
            user_id,
            ...meta
          }: winston.Logform.TransformableInfo) => {
            const metaStr = Object.keys(meta).length ? JSON.stringify(redact(meta)) : "";
            const requestInfo =
              request_id && typeof request_id === "string"
                ? `[req=${request_id.substring(0, 8)}]`
                : "";
            const traceInfo =
              trace_id && typeof trace_id === "string" ? `[trace=${trace_id.substring(0, 8)}]` : "";
            const spanInfo =
              span_id && typeof span_id === "string" ? `[span=${span_id.substring(0, 8)}]` : "";
            const tenantInfo =
              tenant_id && typeof tenant_id === "string" ? `[tenant=${tenant_id}]` : "";
            const userInfo = user_id && typeof user_id === "string" ? `[user=${user_id}]` : "";
            const timestampStr = typeof timestamp === "string" ? timestamp : String(timestamp);
            const messageStr = typeof message === "string" ? message : String(message);
            const levelStr = level as string;
            return `${timestampStr} [${levelStr}]${requestInfo}${traceInfo}${spanInfo}${tenantInfo}${userInfo}: ${messageStr} ${metaStr}`;
          }
        )
      ),
    }),
  ],
});

// Log sampling configuration
function shouldLog(): boolean {
  const samplingRate = config.logging.samplingRate as number;
  if (samplingRate >= 1.0) {
    return true;
  }
  return Math.random() < samplingRate;
}

// Helper to log with automatic redaction and trace context
export function logInfo(message: string, meta?: Record<string, unknown>) {
  if (!shouldLog()) {
    return;
  }
  logger.info(message, redact(meta));
}

export function logError(message: string, error?: unknown, meta?: Record<string, unknown>) {
  // Always log errors (no sampling)
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

// Business event logging
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

// Performance logging
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
