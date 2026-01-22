/**
 * Structured Logging with OpenTelemetry Integration
 * JSON structured logs with trace_id, span_id, tenant_id
 */

import winston from "winston";
import Transport from "winston-transport";
import { redact } from "./redaction";
import { trace } from "@opentelemetry/api";
import { config } from "../config";

// Type for winston log info (compatible with TransformableInfo)
interface LogInfo {
  level: string;
  message: unknown; // winston uses unknown for message
  timestamp?: string;
  trace_id?: string;
  span_id?: string;
  tenant_id?: string;
  [key: string]: unknown;
}

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

// Log format with trace context included in JSON output
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.printf((info: LogInfo) => {
    const traceContext = getTraceContext();
    const combined = {
      ...info,
      ...traceContext,
    };
    return JSON.stringify(combined);
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.printf(
    ({ timestamp, level, message, trace_id, span_id, tenant_id, ...meta }: LogInfo) => {
      const metaStr = Object.keys(meta).length ? JSON.stringify(redact(meta)) : "";
      const traceInfo =
        trace_id && typeof trace_id === "string" ? `[trace_id=${trace_id.substring(0, 16)}]` : "";
      const spanInfo =
        span_id && typeof span_id === "string" ? `[span_id=${span_id.substring(0, 16)}]` : "";
      const tenantInfo = tenant_id ? `[tenant_id=${tenant_id}]` : "";
      return `${String(timestamp)} [${level}]${traceInfo}${spanInfo}${tenantInfo}: ${String(message)} ${metaStr}`;
    }
  )
);

// Create console transport
// Winston's type definitions for transports.Console have incomplete constructor signatures
// The Console class exists and works at runtime; we cast through unknown for proper typing
const ConsoleTransportClass = winston.transports.Console as unknown as new (
  options: object
) => Transport;
const consoleTransport = new ConsoleTransportClass({ format: consoleFormat });

// Create logger with console transport
export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: {
    service: "settler-api",
    environment: config.nodeEnv,
  },
  transports: [consoleTransport],
});

// Log sampling configuration
function shouldLog(): boolean {
  if (config.logging.samplingRate >= 1.0) {
    return true;
  }
  return Math.random() < config.logging.samplingRate;
}

// Helper to log with automatic redaction and trace context
export function logInfo(message: string, meta?: Record<string, unknown>): void {
  if (!shouldLog()) {
    return;
  }
  logger.info(message, redact(meta));
}

export function logError(message: string, error?: unknown, meta?: Record<string, unknown>): void {
  // Always log errors (no sampling)
  const errorObj = error instanceof Error ? error : { message: String(error) };
  logger.error(message, {
    ...redact(meta),
    error: errorObj.message,
    stack:
      error instanceof Error && "stack" in errorObj && errorObj.stack
        ? String(errorObj.stack)
        : undefined,
  });
}

export function logWarn(message: string, meta?: Record<string, unknown>): void {
  if (!shouldLog()) {
    return;
  }
  logger.warn(message, redact(meta));
}

export function logDebug(message: string, meta?: Record<string, unknown>): void {
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
): void {
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
): void {
  logger.info(`performance:${operation}`, {
    operation,
    duration_ms: durationMs,
    ...redact(meta),
  });
}
