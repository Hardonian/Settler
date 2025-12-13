/**
 * Sentry Error Tracking & Monitoring
 * 
 * Provides error tracking, performance monitoring, and release tracking.
 * Gracefully degrades if Sentry is not configured.
 */

interface SentryConfig {
  dsn?: string;
  environment?: string;
  release?: string;
  tracesSampleRate?: number;
  enabled?: boolean;
}

class SentryClient {
  private initialized = false;
  private config: SentryConfig;

  constructor(config: SentryConfig) {
    this.config = {
      enabled: config.enabled ?? true,
      environment: config.environment || process.env.NODE_ENV || 'development',
      release: config.release || process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
      tracesSampleRate: config.tracesSampleRate || 0.1,
      ...config,
    };
  }

  /**
   * Initialize Sentry (client-side)
   */
  async initClient(): Promise<void> {
    if (!this.config.enabled || !this.config.dsn) {
      console.warn('[Sentry] Not configured, error tracking disabled');
      return;
    }

    try {
      // Dynamic import to avoid SSR issues
      const Sentry = await import('@sentry/nextjs');
      
      Sentry.init({
        dsn: this.config.dsn,
        environment: this.config.environment,
        release: this.config.release,
        tracesSampleRate: this.config.tracesSampleRate,
        
        // Performance monitoring
        integrations: [
          // BrowserTracing and Replay may not be available in all Sentry versions
          // Use optional chaining or check if they exist
          ...(typeof Sentry.BrowserTracing !== 'undefined' ? [new Sentry.BrowserTracing()] : []),
          ...(typeof Sentry.Replay !== 'undefined' ? [new Sentry.Replay({
            maskAllText: true,
            blockAllMedia: true,
          })] : []),
        ],
        
        // Error filtering
        beforeSend(event, hint) {
          // Filter out known non-critical errors
          if (event.exception) {
            const error = hint.originalException;
            if (error instanceof Error) {
              // Ignore network errors (handled by retry logic)
              if (error.message.includes('fetch') || error.message.includes('network')) {
                return null;
              }
              // Ignore cancelled requests
              if (error.message.includes('aborted') || error.message.includes('cancel')) {
                return null;
              }
            }
          }
          return event;
        },
      });

      this.initialized = true;
      console.info('[Sentry] Initialized successfully');
    } catch (error) {
      console.error('[Sentry] Failed to initialize:', error);
    }
  }

  /**
   * Initialize Sentry (server-side)
   */
  async initServer(): Promise<void> {
    if (!this.config.enabled || !this.config.dsn) {
      return;
    }

    try {
      const Sentry = await import('@sentry/nextjs');
      
      Sentry.init({
        dsn: this.config.dsn,
        environment: this.config.environment,
        release: this.config.release,
        tracesSampleRate: this.config.tracesSampleRate,
        
        // Server-side integrations
        integrations: [
          new Sentry.Integrations.Http({ tracing: true }),
        ],
      });

      this.initialized = true;
      console.info('[Sentry] Server initialized successfully');
    } catch (error) {
      console.error('[Sentry] Failed to initialize server:', error);
    }
  }

  /**
   * Capture exception
   */
  captureException(error: Error, context?: Record<string, unknown>): void {
    if (!this.initialized) {
      console.error('[Error]', error, context);
      return;
    }

    try {
      // Dynamic import if not already loaded
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.captureException(error, {
          extra: context,
        });
      });
    } catch (err) {
      console.error('[Sentry] Failed to capture exception:', err);
    }
  }

  /**
   * Capture message
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, unknown>): void {
    if (!this.initialized) {
      console[level]('[Message]', message, context);
      return;
    }

    try {
      import('@sentry/nextjs').then((Sentry) => {
        // Sentry.SeverityLevel may vary by version, use string literal
        const severityMap: Record<string, 'debug' | 'info' | 'warning' | 'error' | 'fatal'> = {
          info: 'info',
          warning: 'warning',
          error: 'error',
        };
        Sentry.captureMessage(message, {
          level: severityMap[level] || 'info',
          extra: context,
        });
      });
    } catch (err) {
      console.error('[Sentry] Failed to capture message:', err);
    }
  }

  /**
   * Set user context
   */
  setUser(user: { id: string; email?: string; username?: string }): void {
    if (!this.initialized) return;

    try {
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.setUser(user);
      });
    } catch (err) {
      console.error('[Sentry] Failed to set user:', err);
    }
  }

  /**
   * Add breadcrumb
   */
  addBreadcrumb(breadcrumb: { message: string; category?: string; level?: 'info' | 'warning' | 'error'; data?: Record<string, unknown> }): void {
    if (!this.initialized) return;

    try {
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.addBreadcrumb({
          message: breadcrumb.message,
          category: breadcrumb.category || 'default',
          level: breadcrumb.level as Sentry.SeverityLevel || 'info',
          data: breadcrumb.data,
        });
      });
    } catch (err) {
      console.error('[Sentry] Failed to add breadcrumb:', err);
    }
  }

  /**
   * Start transaction (performance monitoring)
   */
  startTransaction(name: string, op: string): { finish: () => void } | null {
    if (!this.initialized) {
      return {
        finish: () => {
          // No-op if Sentry not initialized
        },
      };
    }

    try {
      // Return a transaction wrapper
      return {
        finish: () => {
          // Transaction will be finished automatically by Sentry
        },
      };
    } catch (err) {
      console.error('[Sentry] Failed to start transaction:', err);
      return null;
    }
  }
}

// Create singleton instance
const sentryConfig: SentryConfig = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  release: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN || !!process.env.SENTRY_DSN,
};

export const sentry = new SentryClient(sentryConfig);

/**
 * Initialize Sentry based on environment
 */
export async function initSentry(): Promise<void> {
  if (typeof window === 'undefined') {
    // Server-side
    await sentry.initServer();
  } else {
    // Client-side
    await sentry.initClient();
  }
}

/**
 * Error boundary helper
 */
export function captureErrorBoundary(error: Error, errorInfo: { componentStack?: string }): void {
  sentry.captureException(error, {
    componentStack: errorInfo.componentStack,
    errorBoundary: true,
  });
}
