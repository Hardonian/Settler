/**
 * Production-Grade Logging System
 * 
 * Centralized logging with multiple output targets and log levels.
 */

import type { LogLevel, LogEntry, Logger } from './types';
import { analytics } from '../analytics';

class AppLogger implements Logger {
  private minLevel: LogLevel;
  private sessionId: string;
  private userId?: string;
  private enabled: boolean;

  constructor() {
    this.minLevel = this.getMinLevel();
    this.sessionId = this.generateSessionId();
    this.enabled = process.env.NEXT_PUBLIC_ENABLE_LOGGING !== 'false';
  }

  private getMinLevel(): LogLevel {
    const envLevel = process.env.NEXT_PUBLIC_LOG_LEVEL?.toLowerCase();
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'critical'];
    return (envLevel as LogLevel) || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
  }

  private generateSessionId(): string {
    if (typeof window === 'undefined') return 'server';
    
    let sessionId = sessionStorage.getItem('app_session_id');
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('app_session_id', sessionId);
    }
    return sessionId;
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.enabled) return false;
    
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'critical'];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    error?: Error,
    context?: Record<string, any>
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } as any : undefined,
      userId: this.userId,
      sessionId: this.sessionId,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };
  }

  private output(entry: LogEntry) {
    // Console output (always in development)
    if (process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_ENABLE_CONSOLE_LOGS === 'true') {
      const consoleMethod = entry.level === 'critical' ? 'error' : entry.level;
      const style = this.getConsoleStyle(entry.level);
      
      console[consoleMethod](
        `%c[${entry.level.toUpperCase()}]`,
        style,
        entry.message,
        entry.context || '',
        entry.error || ''
      );
    }

    // Send to analytics for error tracking
    if (entry.level === 'error' || entry.level === 'critical') {
      analytics.trackError(
        entry.error || new Error(entry.message),
        {
          level: entry.level,
          context: entry.context,
          sessionId: entry.sessionId,
          userId: entry.userId,
        }
      );
    }

    // Send to logging endpoint (if configured)
    if (process.env.NEXT_PUBLIC_LOGGING_ENDPOINT && typeof window !== 'undefined') {
      this.sendToEndpoint(entry).catch(() => {
        // Silently fail - don't break the app
      });
    }
  }

  private getConsoleStyle(level: LogLevel): string {
    const styles: Record<LogLevel, string> = {
      debug: 'color: #6b7280',
      info: 'color: #3b82f6',
      warn: 'color: #f59e0b',
      error: 'color: #ef4444',
      critical: 'color: #dc2626; font-weight: bold',
    };
    return styles[level] || '';
  }

  private async sendToEndpoint(entry: LogEntry) {
    try {
      await fetch(process.env.NEXT_PUBLIC_LOGGING_ENDPOINT!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      // Silently fail
    }
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  debug(message: string, context?: Record<string, any>) {
    if (!this.shouldLog('debug')) return;
    this.output(this.createLogEntry('debug', message, undefined, context));
  }

  info(message: string, context?: Record<string, any>) {
    if (!this.shouldLog('info')) return;
    this.output(this.createLogEntry('info', message, undefined, context));
  }

  warn(message: string, context?: Record<string, any>) {
    if (!this.shouldLog('warn')) return;
    this.output(this.createLogEntry('warn', message, undefined, context));
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    if (!this.shouldLog('error')) return;
    this.output(this.createLogEntry('error', message, error, context));
  }

  critical(message: string, error?: Error, context?: Record<string, any>) {
    if (!this.shouldLog('critical')) return;
    this.output(this.createLogEntry('critical', message, error, context));
  }
}

// Singleton instance
export const logger = new AppLogger();
