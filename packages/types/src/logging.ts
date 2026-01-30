/**
 * Standardized Logging Utilities
 * Structured logging for observability and debugging
 * Part of Phase 5: Observability
 */

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";
export type LogContext = Record<string, unknown>;

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  requestId?: string;
  tenantId?: string;
  duration?: number;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev";
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error,
    metadata?: { requestId?: string; tenantId?: string; duration?: number }
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...metadata,
    };

    if (context && Object.keys(context).length > 0) {
      entry.context = context;
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
      };
    }

    return entry;
  }

  private output(entry: LogEntry): void {
    if (this.isDevelopment) {
      const colorCode = {
        debug: "\x1b[36m", // Cyan
        info: "\x1b[32m", // Green
        warn: "\x1b[33m", // Yellow
        error: "\x1b[31m", // Red
        fatal: "\x1b[35m", // Magenta
      }[entry.level];

      console.log(
        `${colorCode}[${entry.level.toUpperCase()}]\x1b[0m ${entry.timestamp} - ${entry.message}`,
        entry.context || "",
        entry.error ? `\nError: ${entry.error.name}: ${entry.error.message}` : ""
      );
    } else {
      console.log(JSON.stringify(entry));
    }
  }

  debug(message: string, context?: LogContext): void {
    this.output(this.createLogEntry("debug", message, context));
  }

  info(message: string, context?: LogContext): void {
    this.output(this.createLogEntry("info", message, context));
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    this.output(this.createLogEntry("warn", message, context, error));
  }

  error(message: string, context?: LogContext, error?: Error): void {
    this.output(this.createLogEntry("error", message, context, error));
  }

  fatal(message: string, context?: LogContext, error?: Error): void {
    this.output(this.createLogEntry("fatal", message, context, error));
  }

  /**
   * Log request start with correlation ID
   */
  requestStart(method: string, path: string, requestId: string, tenantId?: string): void {
    this.info(`Request started: ${method} ${path}`, {
      method,
      path,
      requestId,
      tenantId,
      type: "request_start",
    });
  }

  /**
   * Log request end with duration and status
   */
  requestEnd(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    requestId: string,
    tenantId?: string
  ): void {
    const level = statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";
    this.output(
      this.createLogEntry(
        level,
        `Request completed: ${method} ${path} - ${statusCode} (${duration}ms)`,
        {
          method,
          path,
          statusCode,
          duration,
          type: "request_end",
        },
        undefined,
        { requestId, tenantId, duration }
      )
    );
  }
}

export const logger = new Logger();

/**
 * Request correlation utilities
 */
export class RequestCorrelation {
  private static requestIdStore = new Map<string, string>();

  static generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  static getRequestId(): string | undefined {
    const asyncId = (process as { asyncId?: () => string }).asyncId?.();
    return asyncId ? RequestCorrelation.requestIdStore.get(asyncId) : undefined;
  }

  static setRequestId(requestId: string): void {
    const asyncId = (process as { asyncId?: () => string }).asyncId?.();
    if (asyncId) {
      RequestCorrelation.requestIdStore.set(asyncId, requestId);
    }
  }
}

/**
 * Error boundary for standardized error handling
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly context?: LogContext
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(process.env.NODE_ENV === "development" && { stack: this.stack }),
      },
    };
  }
}

/**
 * Safe async handler wrapper
 * Ensures all errors are caught and logged
 */
export function safeAsync<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  context?: LogContext
): (...args: T) => Promise<R | { error: string; code: string }> {
  return async (...args: T) => {
    try {
      return await fn(...args);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Unhandled error in async function", { ...context, args }, err);
      return {
        error: err.message,
        code: "INTERNAL_ERROR",
      };
    }
  };
}
