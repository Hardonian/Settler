/**
 * Admin Dashboard Logger
 * 
 * Centralized logging for admin dashboard with proper error handling.
 * Replaces console.log/error with structured logging.
 */

import { logger } from '@/lib/observability/logger';

export const adminLogger = {
  info: (message: string, metadata?: Record<string, unknown>) => {
    logger.info(`[Admin] ${message}`, metadata);
  },
  
  warn: (message: string, metadata?: Record<string, unknown>) => {
    logger.warn(`[Admin] ${message}`, metadata);
  },
  
  error: (message: string, error?: unknown, metadata?: Record<string, unknown>) => {
    logger.error(`[Admin] ${message}`, {
      ...metadata,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    });
  },
  
  debug: (message: string, metadata?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      logger.info(`[Admin Debug] ${message}`, metadata);
    }
  },
};
