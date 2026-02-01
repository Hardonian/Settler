/**
 * Centralized Logger Utility
 * 
 * Replaces console.log/error/warn throughout the codebase.
 * Provides structured logging with proper error handling.
 */

import { logger } from '@/lib/observability/logger';

/**
 * Centralized logger for application-wide use
 * Replaces console.log/error/warn statements
 */
export const appLogger = {
  info: (message: string, metadata?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`[Info] ${message}`, metadata);
    }
    logger.info(message, metadata).catch(() => {
      // Silent fail - don't break app if logging fails
    });
  },
  
  warn: (message: string, metadata?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
       
      console.warn(`[Warn] ${message}`, metadata);
    }
    logger.warn(message, metadata).catch(() => {
      // Silent fail
    });
  },
  
  error: (message: string, error?: unknown, metadata?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
       
      console.error(`[Error] ${message}`, error, metadata);
    }
    logger.error(message, {
      ...metadata,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    }).catch(() => {
      // Silent fail
    });
  },
  
  debug: (message: string, metadata?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.debug(`[Debug] ${message}`, metadata);
    }
  },
};
