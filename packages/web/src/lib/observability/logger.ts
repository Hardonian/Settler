/**
 * Structured Logging Wrapper
 * 
 * Outputs structured JSON logs with:
 * - level (info, warn, error, debug)
 * - message
 * - trace_id
 * - route (if available)
 * - user_id (if safe to log)
 * - timestamp
 * - Additional context
 */

import { getTraceId } from './trace';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  trace_id?: string;
  route?: string;
  user_id?: string;
  tenant_id?: string;
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private async log(
    level: LogLevel,
    message: string,
    context: LogContext = {}
  ): Promise<void> {
    if (!this.shouldLog(level)) {
      return;
    }

    // Try to get trace_id if not provided
    let traceId = context.trace_id;
    if (!traceId) {
      try {
        traceId = await getTraceId();
      } catch (error) {
        // If we can't get trace_id, continue without it
      }
    }

    const logEntry = {
      level,
      msg: message,
      trace_id: traceId,
      timestamp: new Date().toISOString(),
      ...context,
    };

    // Remove undefined values
    Object.keys(logEntry).forEach((key) => {
      if (logEntry[key as keyof typeof logEntry] === undefined) {
        delete logEntry[key as keyof typeof logEntry];
      }
    });

    // Output structured JSON
    const logString = JSON.stringify(logEntry);

    switch (level) {
      case 'error':
        console.error(logString);
        break;
      case 'warn':
        console.warn(logString);
        break;
      case 'debug':
        if (this.isDevelopment) {
          console.debug(logString);
        }
        break;
      case 'info':
      default:
        console.log(logString);
        break;
    }
  }

  async debug(message: string, context?: LogContext): Promise<void> {
    await this.log('debug', message, context);
  }

  async info(message: string, context?: LogContext): Promise<void> {
    await this.log('info', message, context);
  }

  async warn(message: string, context?: LogContext): Promise<void> {
    await this.log('warn', message, context);
  }

  async error(message: string, context?: LogContext): Promise<void> {
    await this.log('error', message, context);
  }
}

// Singleton instance
export const logger = new Logger();
