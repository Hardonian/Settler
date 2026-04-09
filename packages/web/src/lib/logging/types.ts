/**
 * Logging Types
 */

export type LogLevel = "debug" | "info" | "warn" | "error" | "critical";

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: Error;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
}

export interface Logger {
  debug: (message: string, context?: Record<string, any>) => void;
  info: (message: string, context?: Record<string, any>) => void;
  warn: (message: string, context?: Record<string, any>) => void;
  error: (message: string, error?: Error, context?: Record<string, any>) => void;
  critical: (message: string, error?: Error, context?: Record<string, any>) => void;
}
