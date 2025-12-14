/**
 * Correlation ID Management
 * 
 * Generates and tracks correlation IDs for request tracing across services.
 * Used for logging, monitoring, and debugging.
 */

import { headers } from 'next/headers';
import { randomUUID } from 'crypto';

const CORRELATION_ID_HEADER = 'x-correlation-id';
const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Get correlation ID from request headers or generate new one
 */
export async function getCorrelationId(): Promise<string> {
  try {
    const headersList = await headers();
    const correlationId = 
      headersList.get(CORRELATION_ID_HEADER) ||
      headersList.get(REQUEST_ID_HEADER) ||
      randomUUID();
    
    return correlationId;
  } catch (error) {
    // If headers() fails (e.g., during build), generate new ID
    return randomUUID();
  }
}

/**
 * Create correlation context for logging
 */
export async function createCorrelationContext(additionalData?: Record<string, unknown>) {
  const correlationId = await getCorrelationId();
  
  return {
    correlationId,
    timestamp: new Date().toISOString(),
    ...additionalData,
  };
}

/**
 * Add correlation ID to response headers
 * Works with both Response and NextResponse
 */
export function addCorrelationHeaders<T extends Response>(response: T, correlationId: string): T {
  response.headers.set(CORRELATION_ID_HEADER, correlationId);
  return response;
}

/**
 * Structured logger with correlation ID
 */
export class CorrelationLogger {
  private correlationId: string;
  private context: Record<string, unknown>;

  constructor(correlationId: string, context: Record<string, unknown> = {}) {
    this.correlationId = correlationId;
    this.context = context;
  }

  log(level: 'info' | 'warn' | 'error', message: string, data?: Record<string, unknown>) {
    const logEntry = {
      level,
      message,
      correlationId: this.correlationId,
      timestamp: new Date().toISOString(),
      ...this.context,
      ...data,
    };

    // Use appropriate console method
    switch (level) {
      case 'error':
        console.error(JSON.stringify(logEntry));
        break;
      case 'warn':
        console.warn(JSON.stringify(logEntry));
        break;
      case 'info':
      default:
        console.log(JSON.stringify(logEntry));
        break;
    }
  }

  info(message: string, data?: Record<string, unknown>) {
    this.log('info', message, data);
  }

  warn(message: string, data?: Record<string, unknown>) {
    this.log('warn', message, data);
  }

  error(message: string, data?: Record<string, unknown>) {
    this.log('error', message, data);
  }
}

/**
 * Create logger with correlation ID
 */
export async function createLogger(context?: Record<string, unknown>): Promise<CorrelationLogger> {
  const correlationId = await getCorrelationId();
  return new CorrelationLogger(correlationId, context);
}
