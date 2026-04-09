/**
 * Logger Utility for Settler
 * 
 * Standardized logging across all packages
 * Usage: import { log, logError, logWarn } from '@settler/logger'
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: string;
  traceId?: string;
  userId?: string;
  tenantId?: string;
}

class Logger {
  private service: string;
  private isDev: boolean;

  constructor(service: string = 'settler') {
    this.service = service;
    this.isDev = process.env.NODE_ENV !== 'production';
  }

  private format(level: LogLevel, message: string, context?: LogContext): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message: `[${this.service}] ${message}`,
      context,
    };
  }

  private output(entry: LogEntry): void {
    // In production, send to structured logging (DataDog, etc.)
    if (process.env.LOG_JSON === 'true') {
      console.log(JSON.stringify(entry));
      return;
    }

    const colors = {
      debug: '\x1b[36m',
      info: '\x1b[32m',
      warn: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m',
    };

    const levelColor = colors[entry.level] || colors.info;
    console.log(`${levelColor}[${entry.level.toUpperCase()}]${colors.reset} ${entry.message}`);
    
    if (entry.context && Object.keys(entry.context).length > 0) {
      console.log('  ', entry.context);
    }
    
    if (entry.error) {
      console.log('  Error:', entry.error);
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDev) {
      this.output(this.format('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    this.output(this.format('info', message, context));
  }

  warn(message: string, context?: LogContext): void {
    this.output(this.format('warn', message, context));
  }

  error(message: string, errorOrContext?: Error | LogContext, context?: LogContext): void {
    const ctx = errorOrContext instanceof Error 
      ? { error: errorOrContext.message, stack: errorOrContext.stack, ...context }
      : errorOrContext;
    this.output(this.format('error', message, ctx));
  }

  // Child logger with additional context
  child(additionalContext: LogContext): Logger {
    const child = new Logger(this.service);
    child.debug = (msg, ctx) => this.debug(msg, { ...additionalContext, ...ctx });
    child.info = (msg, ctx) => this.info(msg, { ...additionalContext, ...ctx });
    child.warn = (msg, ctx) => this.warn(msg, { ...additionalContext, ...ctx });
    child.error = (msg, err, ctx) => this.error(msg, err, { ...additionalContext, ...ctx });
    return child;
  }
}

// Pre-configured loggers for common services
export const log = new Logger('settler');
export const logError = log.error.bind(log);
export const logWarn = log.warn.bind(log);
export const logInfo = log.info.bind(log);

// Factory for specific services
export function createLogger(service: string): Logger {
  return new Logger(service);
}

// Express middleware for request logging
export function expressLogger(req: { method: string; path: string; ip: string; headers: Record<string, string> }, res: { statusCode: number }, next: (err?: Error) => void): void {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    log.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`, {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      ip: req.ip,
    });
  });
  
  next();
}
