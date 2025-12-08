/**
 * Sentry Error Reporting Integration
 * 
 * Optional Sentry integration for error tracking and monitoring.
 */

import { logger } from '../logging/logger';
import { analytics } from '../analytics';

interface SentryConfig {
  dsn?: string;
  environment?: string;
  enabled: boolean;
}

class SentryIntegration {
  private config: SentryConfig;
  private initialized = false;

  constructor() {
    this.config = {
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      enabled: process.env.NEXT_PUBLIC_ENABLE_SENTRY === 'true' && !!process.env.NEXT_PUBLIC_SENTRY_DSN,
    };
  }

  /**
   * Initialize Sentry
   */
  async init() {
    if (!this.config.enabled || typeof window === 'undefined' || this.initialized) {
      return;
    }

    try {
      // Dynamic import to avoid bundling Sentry if not used
      const Sentry = await import('@sentry/nextjs');
      
      Sentry.init({
        dsn: this.config.dsn,
        environment: this.config.environment,
        tracesSampleRate: 1.0,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        integrations: [
          new Sentry.BrowserTracing(),
          new Sentry.Replay(),
        ],
      });

      this.initialized = true;
      logger.info('Sentry initialized');
    } catch (error) {
      logger.warn('Failed to initialize Sentry', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Capture exception
   */
  captureException(error: Error, context?: Record<string, any>) {
    if (!this.config.enabled) {
      // Fallback to analytics if Sentry not enabled
      analytics.trackError(error, context);
      return;
    }

    if (typeof window !== 'undefined' && 'Sentry' in window) {
      try {
        // @ts-ignore
        window.Sentry.captureException(error, {
          contexts: {
            custom: context || {},
          },
        });
      } catch (err) {
        logger.warn('Failed to capture exception in Sentry', err instanceof Error ? err : new Error(String(err)));
        analytics.trackError(error, context);
      }
    } else {
      analytics.trackError(error, context);
    }
  }

  /**
   * Set user context
   */
  setUser(userId: string, traits?: Record<string, any>) {
    if (!this.config.enabled || typeof window === 'undefined' || !('Sentry' in window)) {
      return;
    }

    try {
      // @ts-ignore
      window.Sentry.setUser({
        id: userId,
        ...traits,
      });
    } catch (error) {
      logger.warn('Failed to set Sentry user', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Add breadcrumb
   */
  addBreadcrumb(message: string, category?: string, level?: 'info' | 'warning' | 'error') {
    if (!this.config.enabled || typeof window === 'undefined' || !('Sentry' in window)) {
      return;
    }

    try {
      // @ts-ignore
      window.Sentry.addBreadcrumb({
        message,
        category,
        level,
      });
    } catch (error) {
      // Silently fail
    }
  }
}

export const sentry = new SentryIntegration();

// Initialize on client-side if enabled
if (typeof window !== 'undefined') {
  sentry.init();
}
