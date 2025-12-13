/**
 * Monitoring & Metrics Utilities
 * 
 * Provides utilities for tracking metrics, errors, and performance.
 * Integrates with Sentry and custom logging.
 */

import { prisma } from '@/shared/db/prismaClient';

export interface MetricEvent {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp?: Date;
}

export interface ErrorEvent {
  error: Error;
  context?: Record<string, unknown>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Track a metric event
 */
export async function trackMetric(event: MetricEvent): Promise<void> {
  try {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Metric]', event.name, event.value, event.tags);
    }

    // Send to Sentry if configured
    if (process.env.SENTRY_DSN) {
      try {
        const Sentry = await import('@sentry/nextjs');
        Sentry.metrics.distribution(event.name, event.value, {
          tags: event.tags,
          unit: 'none',
        });
      } catch {
        // Sentry not available, skip
      }
    }

    // Store in database for custom dashboards (optional)
    // Uncomment if you want to store metrics in DB
    /*
    await prisma.metricEvent.create({
      data: {
        name: event.name,
        value: event.value,
        tags: event.tags || {},
        timestamp: event.timestamp || new Date(),
      },
    });
    */
  } catch (error) {
    // Don't throw - metrics are non-critical
    console.warn('[Metrics] Failed to track metric:', error);
  }
}

/**
 * Track an error event
 */
export async function trackError(event: ErrorEvent): Promise<void> {
  try {
    // Log error
    console.error('[Error]', event.error.message, event.context);

    // Send to Sentry if configured
    if (process.env.SENTRY_DSN) {
      try {
        const Sentry = await import('@sentry/nextjs');
        Sentry.captureException(event.error, {
          level: event.severity === 'critical' ? 'error' : 'warning',
          tags: event.context,
        });
      } catch {
        // Sentry not available, skip
      }
    }

    // Store in audit log if critical
    if (event.severity === 'critical' || event.severity === 'high') {
      try {
        await prisma.reconAudit.create({
          data: {
            tenantId: '00000000-0000-0000-0000-000000000000', // System tenant
            auditType: 'error',
            action: 'error_occurred',
            entityType: 'system',
            changes: {
              message: event.error.message,
              stack: event.error.stack,
              context: event.context,
              severity: event.severity,
            },
          },
        });
      } catch {
        // Audit log failed, non-critical
      }
    }
  } catch (error) {
    // Don't throw - error tracking is non-critical
    console.warn('[Monitoring] Failed to track error:', error);
  }
}

/**
 * Track webhook processing metrics
 */
export async function trackWebhookMetric(
  eventType: string,
  success: boolean,
  durationMs: number
): Promise<void> {
  await trackMetric({
    name: 'webhook.processed',
    value: success ? 1 : 0,
    tags: {
      event_type: eventType,
      status: success ? 'success' : 'failed',
    },
  });

  await trackMetric({
    name: 'webhook.duration_ms',
    value: durationMs,
    tags: {
      event_type: eventType,
    },
  });
}

/**
 * Track API request metrics
 */
export async function trackApiMetric(
  endpoint: string,
  method: string,
  statusCode: number,
  durationMs: number
): Promise<void> {
  await trackMetric({
    name: 'api.request',
    value: 1,
    tags: {
      endpoint,
      method,
      status_code: statusCode.toString(),
    },
  });

  await trackMetric({
    name: 'api.duration_ms',
    value: durationMs,
    tags: {
      endpoint,
      method,
    },
  });
}

/**
 * Track database query metrics
 */
export async function trackDbMetric(
  operation: string,
  table: string,
  durationMs: number,
  success: boolean
): Promise<void> {
  await trackMetric({
    name: 'db.query',
    value: durationMs,
    tags: {
      operation,
      table,
      status: success ? 'success' : 'failed',
    },
  });
}
