/**
 * Structured Logging with OpenTelemetry Integration
 * JSON structured logs with trace_id, span_id, tenant_id
 */

import winston from 'winston';
import { redact } from './redaction';
import { trace } from '@opentelemetry/api';
import { config } from '../config';

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

// Custom format that adds trace context
const traceContextFormat = winston.format((info) => {
  const traceContext = getTraceContext();
  return {
    ...info,
    ...traceContext,
  };
})();

const logFormat = winston.format.combine(
  traceContextFormat,
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: {
    service: 'settler-api',
    environment: config.nodeEnv,
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, trace_id, span_id, tenant_id, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(redact(meta)) : '';
          const traceInfo = trace_id && typeof trace_id === 'string' ? `[trace_id=${trace_id.substring(0, 16)}]` : '';
          const spanInfo = span_id && typeof span_id === 'string' ? `[span_id=${span_id.substring(0, 16)}]` : '';
          const tenantInfo = tenant_id ? `[tenant_id=${tenant_id}]` : '';
          return `${timestamp} [${level}]${traceInfo}${spanInfo}${tenantInfo}: ${message} ${metaStr}`;
        })
      ),
    }),
  ],
});

// Log sampling configuration
function shouldLog(): boolean {
  if (config.logging.samplingRate >= 1.0) {
    return true;
  }
  return Math.random() < config.logging.samplingRate;
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
  const errorObj = error instanceof Error ? error : { message: String(error) };
  logger.error(message, {
    ...redact(meta),
    error: errorObj.message,
    stack: error instanceof Error && 'stack' in errorObj && errorObj.stack ? String(errorObj.stack) : undefined,
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
