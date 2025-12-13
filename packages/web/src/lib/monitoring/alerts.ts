/**
 * Monitoring and Alerting System
 * 
 * Centralized alerting for production monitoring.
 * Integrates with Sentry, email, and other alerting channels.
 */

import { logger } from '@/lib/logging/logger';

export type AlertSeverity = 'critical' | 'error' | 'warning' | 'info';

interface AlertOptions {
  severity: AlertSeverity;
  title: string;
  message: string;
  context?: Record<string, unknown>;
  tags?: Record<string, string>;
  notify?: boolean;
}

class AlertManager {
  private enabled: boolean;

  constructor() {
    this.enabled = process.env.NODE_ENV === 'production' && 
                   process.env.NEXT_PUBLIC_ENABLE_ALERTS !== 'false';
  }

  async sendAlert(options: AlertOptions): Promise<void> {
    if (!this.enabled) {
      logger.warn(`Alert (disabled): ${options.title}`);
      return;
    }

    // Log alert
    logger.error(`[ALERT:${options.severity.toUpperCase()}] ${options.title}`, 
      new Error(options.message), 
      options.context
    );

    // Send to Sentry if configured
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      try {
        const Sentry = await import('@sentry/nextjs').catch(() => null);
        
        if (Sentry) {
          Sentry.setTag('alert_severity', options.severity);
          if (options.tags) {
            Object.entries(options.tags).forEach(([key, value]) => {
              Sentry.setTag(key, value);
            });
          }
          
          if (options.context) {
            Sentry.setContext('alert_context', options.context);
          }

          Sentry.captureException(new Error(options.message), {
            level: options.severity === 'critical' ? 'fatal' : options.severity,
            tags: {
              alert: true,
              alert_title: options.title,
              ...options.tags,
            },
          });
        }
      } catch (error) {
        console.error('Failed to send alert to Sentry:', error);
      }
    }

    // Send email for critical alerts
    if (options.severity === 'critical' && options.notify !== false) {
      await this.sendEmailAlert(options);
    }
  }

  private async sendEmailAlert(options: AlertOptions): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.RESEND_FROM_EMAIL;
    if (!adminEmail || !process.env.RESEND_API_KEY) {
      return;
    }

    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'alerts@settler.dev',
        to: adminEmail,
        subject: `[${options.severity.toUpperCase()}] ${options.title}`,
        html: `
          <h2>Alert: ${options.title}</h2>
          <p><strong>Severity:</strong> ${options.severity}</p>
          <p><strong>Message:</strong> ${options.message}</p>
          ${options.context ? `
            <h3>Context:</h3>
            <pre>${JSON.stringify(options.context, null, 2)}</pre>
          ` : ''}
          <p><small>Timestamp: ${new Date().toISOString()}</small></p>
        `,
      });
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }
}

export const alertManager = new AlertManager();

/**
 * Send an alert
 */
export async function sendAlert(options: AlertOptions): Promise<void> {
  return alertManager.sendAlert(options);
}

/**
 * Pre-configured alert helpers
 */
export const alerts = {
  critical: (title: string, message: string, context?: Record<string, unknown>) =>
    sendAlert({ severity: 'critical', title, message, context }),
  
  error: (title: string, message: string, context?: Record<string, unknown>) =>
    sendAlert({ severity: 'error', title, message, context }),
  
  warning: (title: string, message: string, context?: Record<string, unknown>) =>
    sendAlert({ severity: 'warning', title, message, context }),
  
  info: (title: string, message: string, context?: Record<string, unknown>) =>
    sendAlert({ severity: 'info', title, message, context }),
};
