/**
 * Webhook Notification Service
 *
 * Sends webhook notifications for job events
 */
import { PrismaClient } from '@prisma/client';
interface WebhookNotificationParams {
    tenantId: string;
    userId: string;
    eventType: 'job_failed' | 'job_completed' | 'job_progress';
    jobId: string;
    resultId?: string;
    errorMessage?: string;
    jobName?: string;
    metadata?: Record<string, unknown>;
}
/**
 * Send webhook notification if configured
 */
export declare function sendWebhookNotification(prisma: PrismaClient, params: WebhookNotificationParams): Promise<void>;
export {};
//# sourceMappingURL=webhook-notifications.d.ts.map