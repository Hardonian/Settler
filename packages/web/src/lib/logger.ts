/**
 * Structured logging for jobs and runs
 */

export interface LogContext {
  workspaceId?: string;
  runId?: string;
  jobId?: string;
  userId?: string;
  correlationId?: string;
  [key: string]: unknown;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
  timestamp: Date;
}

/**
 * Create a logger with context
 */
export function createLogger(context: LogContext = {}) {
  return {
    debug: (message: string, extraContext?: LogContext) => {
      log('debug', message, { ...context, ...extraContext });
    },
    info: (message: string, extraContext?: LogContext) => {
      log('info', message, { ...context, ...extraContext });
    },
    warn: (message: string, extraContext?: LogContext) => {
      log('warn', message, { ...context, ...extraContext });
    },
    error: (message: string, error?: Error, extraContext?: LogContext) => {
      log('error', message, { ...context, ...extraContext }, error);
    },
  };
}

/**
 * Log an entry
 */
function log(
  level: LogLevel,
  message: string,
  context: LogContext = {},
  error?: Error
) {
  const entry: LogEntry = {
    level,
    message,
    context,
    error,
    timestamp: new Date(),
  };

  // In production, send to logging service
  // For now, use console with structured format
  const logMessage = JSON.stringify({
    level: entry.level,
    message: entry.message,
    ...entry.context,
    error: error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : undefined,
    timestamp: entry.timestamp.toISOString(),
  });

  switch (level) {
    case 'debug':
      if (process.env.NODE_ENV === 'development') {
        console.debug(logMessage);
      }
      break;
    case 'info':
      // eslint-disable-next-line no-console
      console.log(logMessage);
      break;
    case 'warn':
      console.warn(logMessage);
      break;
    case 'error':
      console.error(logMessage);
      break;
  }
}

/**
 * Generate correlation ID
 */
export function generateCorrelationId(): string {
  return `corr_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}
