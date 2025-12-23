/**
 * Notifications Service
 * Handles failure notifications and notification preferences
 */
export type NotificationChannel = "email" | "slack" | "webhook" | "in_app";
export type NotificationEventType = "job_failed" | "job_completed" | "job_progress" | "approval_requested" | "approval_approved" | "approval_rejected" | "reconciliation_complete" | "conflict_detected" | "checkpoint_created" | "bulk_operation_complete";
export interface NotificationPreferences {
    eventType: NotificationEventType;
    channels: NotificationChannel[];
    enabled: boolean;
}
export interface NotificationLog {
    id: string;
    tenantId: string;
    userId?: string;
    eventType: NotificationEventType;
    channel: NotificationChannel;
    recipient: string;
    subject?: string;
    body?: string;
    sentAt: Date;
    deliveredAt?: Date;
    failedAt?: Date;
    errorMessage?: string;
}
/**
 * Get notification preferences for a user/tenant
 */
export declare function getNotificationPreferences(tenantId: string, userId?: string): Promise<NotificationPreferences[]>;
/**
 * Update notification preferences
 */
export declare function updateNotificationPreferences(tenantId: string, preferences: NotificationPreferences[], userId?: string): Promise<void>;
/**
 * Send a notification
 */
export declare function sendNotification(tenantId: string, eventType: NotificationEventType, recipients: Array<{
    userId?: string;
    email?: string;
    slackWebhook?: string;
}>, data: {
    subject?: string;
    body?: string;
    metadata?: Record<string, unknown>;
}): Promise<void>;
/**
 * Mark notification as delivered
 */
export declare function markNotificationDelivered(logId: string): Promise<void>;
/**
 * Mark notification as failed
 */
export declare function markNotificationFailed(logId: string, errorMessage: string): Promise<void>;
/**
 * Get notification logs
 */
export declare function getNotificationLogs(tenantId: string, filters?: {
    userId?: string;
    eventType?: NotificationEventType;
    channel?: NotificationChannel;
    limit?: number;
    offset?: number;
}): Promise<NotificationLog[]>;
/**
 * Notify on job failure
 */
export declare function notifyJobFailure(tenantId: string, jobId: string, errorMessage: string, userId?: string): Promise<void>;
//# sourceMappingURL=notifications.d.ts.map