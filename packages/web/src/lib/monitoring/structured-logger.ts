/**
 * Structured Logger with Reliability Context
 * 
 * Enhanced logger that includes tenant_id, operation, duration_ms, status
 * and propagates correlation IDs.
 */

import { createLogger as createCorrelationLogger, CorrelationLogger } from './correlation';

export interface StructuredLogContext {
  tenantId?: string;
  userId?: string;
  operation: string;
  durationMs?: number;
  status?: 'success' | 'failure' | 'pending';
  errorCode?: string;
  [key: string]: unknown;
}

/**
 * Enhanced logger with structured context
 */
export class StructuredLogger {
  private logger: CorrelationLogger;
  private startTime: number;
  private context: StructuredLogContext;

  constructor(context: StructuredLogContext) {
    this.context = context;
    this.startTime = Date.now();
    // Create correlation logger (will be async, but we'll handle it)
    this.logger = null as unknown as CorrelationLogger; // Will be initialized async
  }

  /**
   * Initialize logger (async)
   */
  static async create(context: StructuredLogContext): Promise<StructuredLogger> {
    const logger = new StructuredLogger(context);
    logger.logger = await createCorrelationLogger(context);
    return logger;
  }

  /**
   * Log info message
   */
  info(message: string, extraContext?: Record<string, unknown>) {
    const durationMs = Date.now() - this.startTime;
    this.logger.info(message, {
      ...this.context,
      ...extraContext,
      durationMs,
    });
  }

  /**
   * Log warning message
   */
  warn(message: string, extraContext?: Record<string, unknown>) {
    const durationMs = Date.now() - this.startTime;
    this.logger.warn(message, {
      ...this.context,
      ...extraContext,
      durationMs,
    });
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, extraContext?: Record<string, unknown>) {
    const durationMs = Date.now() - this.startTime;
    this.logger.error(message, {
      ...this.context,
      ...extraContext,
      durationMs,
      errorCode: error?.name,
      errorMessage: error?.message,
      status: 'failure',
    });
  }

  /**
   * Log success
   */
  success(message: string, extraContext?: Record<string, unknown>) {
    const durationMs = Date.now() - this.startTime;
    this.logger.info(message, {
      ...this.context,
      ...extraContext,
      durationMs,
      status: 'success',
    });
  }

  /**
   * Get current duration
   */
  getDuration(): number {
    return Date.now() - this.startTime;
  }
}

/**
 * Create structured logger
 */
export async function createStructuredLogger(
  context: StructuredLogContext
): Promise<StructuredLogger> {
  return StructuredLogger.create(context);
}
