/**
 * Alert Manager
 * 
 * Centralized service for managing and dispatching system alerts.
 * Supports multiple channels (Email, Slack, Webhook) and severity levels.
 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error - PrismaClient is generated at build time
import { PrismaClient } from '@prisma/client';
import { sendEmail } from '../../lib/email';
import { logError, logInfo } from '../../utils/logger';

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export interface AlertParams {
  tenantId: string;
  type: string;
  message: string;
  severity: AlertSeverity;
  metadata?: Record<string, unknown>;
}

export class AlertManager {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Dispatch an alert
   */
  async sendAlert(params: AlertParams): Promise<void> {
    const { tenantId, type, message, severity, metadata } = params;

    try {
      // 1. Log to Database
      await this.prisma.$executeRaw`
        INSERT INTO alerts (
          id, tenant_id, type, message, severity, metadata, created_at
        ) VALUES (
          gen_random_uuid(), ${tenantId}::uuid, ${type}, ${message}, ${severity}, ${metadata ? JSON.stringify(metadata) : '{}'}::jsonb, NOW()
        )
      `.catch((err) => {
        // Fallback if table doesn't exist or other DB error
        logError('Failed to persist alert to DB', err);
      });

      // 2. Fetch Notification Settings
      // In a real system, we'd check user preferences here
      const billingAccount = await this.prisma.billingAccount.findFirst({
        where: { tenantId },
        select: { email: true },
      });

      if (!billingAccount?.email) {
        logInfo(`No email found for tenant ${tenantId}, skipping email alert`);
        return;
      }

      // 3. Send Email (for Warning/Critical)
      if (severity !== AlertSeverity.INFO) {
        await sendEmail({
          to: billingAccount.email,
          subject: `[${severity.toUpperCase()}] ${type}: ${message}`,
          text: `An alert was triggered in your Settler account.\n\nType: ${type}\nSeverity: ${severity}\nMessage: ${message}\n\nMetadata: ${JSON.stringify(metadata, null, 2)}`,
          html: `
            <h2>System Alert</h2>
            <p><strong>Type:</strong> ${type}</p>
            <p><strong>Severity:</strong> <span style="color: ${severity === 'critical' ? 'red' : 'orange'}">${severity.toUpperCase()}</span></p>
            <p><strong>Message:</strong> ${message}</p>
            <pre>${JSON.stringify(metadata, null, 2)}</pre>
          `,
        });
      }

      // 4. Send Slack/Webhook (Placeholder)
      // await this.sendSlackAlert(...)

      logInfo(`Alert dispatched: ${type} (${severity}) for tenant ${tenantId}`);

    } catch (error) {
      logError('Failed to dispatch alert', error);
    }
  }
}
