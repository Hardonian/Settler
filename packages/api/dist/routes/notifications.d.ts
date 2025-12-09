/**
 * Notification Routes
 *
 * Integrates with Slack, Discord, PagerDuty, and email for alerts
 * Supports:
 * - Reconciliation alerts
 * - Error notifications
 * - Usage warnings
 * - System status updates
 */
declare const router: import("express-serve-static-core").Router;
/**
 * Notification service interface
 */
export interface NotificationService {
    sendSlack(message: string, channel?: string): Promise<void>;
    sendDiscord(message: string, webhookUrl: string): Promise<void>;
    sendPagerDuty(incident: {
        summary: string;
        severity: 'critical' | 'error' | 'warning' | 'info';
        source?: string;
    }): Promise<void>;
    sendEmail(to: string, subject: string, body: string): Promise<void>;
}
export { router as notificationsRouter };
//# sourceMappingURL=notifications.d.ts.map