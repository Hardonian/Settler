/**
 * Notifications Service
 * Handles failure notifications and notification preferences
 */

import { query } from "../db";
import { logError, logInfo } from "../utils/logger";

export type NotificationChannel = "email" | "slack" | "webhook" | "in_app";
export type NotificationEventType =
  | "job_failed"
  | "job_completed"
  | "job_progress"
  | "approval_requested"
  | "approval_approved"
  | "approval_rejected"
  | "reconciliation_complete"
  | "conflict_detected"
  | "checkpoint_created"
  | "bulk_operation_complete";

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
export async function getNotificationPreferences(
  tenantId: string,
  userId?: string
): Promise<NotificationPreferences[]> {
  try {
    const conditions = ["tenant_id = $1"];
    const params: unknown[] = [tenantId];
    let paramIndex = 2;

    if (userId) {
      conditions.push(`user_id = $${paramIndex}`);
      params.push(userId);
      paramIndex++;
    } else {
      conditions.push("user_id IS NULL");
    }

    const result = await query<Record<string, unknown>>(
      `SELECT event_type, channels, enabled
       FROM notification_preferences
       WHERE ${conditions.join(" AND ")}`,
      params as (string | number | boolean | null | Date)[]
    );

    return result.map((row) => ({
      eventType: row.event_type as NotificationEventType,
      channels: row.channels as NotificationChannel[],
      enabled: row.enabled as boolean,
    }));
  } catch (error) {
    logError("Failed to get notification preferences", error, { tenantId, userId });
    throw error;
  }
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  tenantId: string,
  preferences: NotificationPreferences[],
  userId?: string
): Promise<void> {
  try {
    for (const pref of preferences) {
      await query(
        `INSERT INTO notification_preferences (
          tenant_id, user_id, event_type, channels, enabled
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (tenant_id, user_id, event_type) DO UPDATE
        SET channels = EXCLUDED.channels,
            enabled = EXCLUDED.enabled,
            updated_at = now()`,
        [tenantId, userId || null, pref.eventType, JSON.stringify(pref.channels), pref.enabled]
      );
    }

    logInfo("Notification preferences updated", { tenantId, userId });
  } catch (error) {
    logError("Failed to update notification preferences", error, { tenantId, userId });
    throw error;
  }
}

/**
 * Send a notification
 */
export async function sendNotification(
  tenantId: string,
  eventType: NotificationEventType,
  recipients: Array<{ userId?: string; email?: string; slackWebhook?: string }>,
  data: {
    subject?: string;
    body?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    // Get notification preferences for each recipient
    for (const recipient of recipients) {
      const userId = recipient.userId;
      const preferences = await getNotificationPreferences(tenantId, userId);

      const pref = preferences.find((p) => p.eventType === eventType);
      if (!pref || !pref.enabled) {
        continue;
      }

      // Send to each enabled channel
      for (const channel of pref.channels) {
        try {
          let recipientAddress = "";
          if (channel === "email" && recipient.email) {
            recipientAddress = recipient.email;
          } else if (channel === "slack" && recipient.slackWebhook) {
            recipientAddress = recipient.slackWebhook;
          } else {
            continue;
          }

          // Send notification via configured channels (email, Slack, webhook)
          // For now, just log it
          await logNotification(
            tenantId,
            userId,
            eventType,
            channel,
            recipientAddress,
            data.subject,
            data.body
          );

          logInfo("Notification sent", {
            tenantId,
            userId,
            eventType,
            channel,
            recipient: recipientAddress,
          });
        } catch (error) {
          logError("Failed to send notification", error, {
            tenantId,
            userId,
            eventType,
            channel,
          });
        }
      }
    }
  } catch (error) {
    logError("Failed to send notification", error, { tenantId, eventType });
    throw error;
  }
}

/**
 * Log a notification
 */
async function logNotification(
  tenantId: string,
  userId: string | undefined,
  eventType: NotificationEventType,
  channel: NotificationChannel,
  recipient: string,
  subject?: string,
  body?: string
): Promise<string> {
  try {
    const result = await query<{ id: string }>(
      `INSERT INTO notification_logs (
        tenant_id, user_id, event_type, channel, recipient, subject, body
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id`,
      [tenantId, userId || null, eventType, channel, recipient, subject || null, body || null] as (
        | string
        | number
        | boolean
        | null
        | Date
      )[]
    );

    const logId = result[0]?.id || "";
    return logId;
  } catch (error) {
    logError("Failed to log notification", error, { tenantId, userId, eventType });
    throw error;
  }
}

/**
 * Mark notification as delivered
 */
export async function markNotificationDelivered(logId: string): Promise<void> {
  try {
    await query(
      `UPDATE notification_logs
       SET delivered_at = now()
       WHERE id = $1`,
      [logId]
    );
  } catch (error) {
    logError("Failed to mark notification as delivered", error, { logId });
    throw error;
  }
}

/**
 * Mark notification as failed
 */
export async function markNotificationFailed(logId: string, errorMessage: string): Promise<void> {
  try {
    await query(
      `UPDATE notification_logs
       SET failed_at = now(), error_message = $1
       WHERE id = $2`,
      [errorMessage, logId]
    );
  } catch (error) {
    logError("Failed to mark notification as failed", error, { logId });
    throw error;
  }
}

/**
 * Get notification logs
 */
export async function getNotificationLogs(
  tenantId: string,
  filters: {
    userId?: string;
    eventType?: NotificationEventType;
    channel?: NotificationChannel;
    limit?: number;
    offset?: number;
  } = {}
): Promise<NotificationLog[]> {
  try {
    const conditions: string[] = ["tenant_id = $1"];
    const params: unknown[] = [tenantId];
    let paramIndex = 2;

    if (filters.userId) {
      conditions.push(`user_id = $${paramIndex}`);
      params.push(filters.userId);
      paramIndex++;
    }

    if (filters.eventType) {
      conditions.push(`event_type = $${paramIndex}`);
      params.push(filters.eventType);
      paramIndex++;
    }

    if (filters.channel) {
      conditions.push(`channel = $${paramIndex}`);
      params.push(filters.channel);
      paramIndex++;
    }

    const limit = filters.limit || 100;
    const offset = filters.offset || 0;

    const result = await query<Record<string, unknown>>(
      `SELECT id, tenant_id, user_id, event_type, channel, recipient,
              subject, body, sent_at, delivered_at, failed_at, error_message
       FROM notification_logs
       WHERE ${conditions.join(" AND ")}
       ORDER BY sent_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset] as (string | number | boolean | null | Date)[]
    );

    return result.map((row) => ({
      id: row.id as string,
      tenantId: row.tenant_id as string,
      userId: row.user_id as string | undefined,
      eventType: row.event_type as NotificationEventType,
      channel: row.channel as NotificationChannel,
      recipient: row.recipient as string,
      subject: row.subject as string | undefined,
      body: row.body as string | undefined,
      sentAt: row.sent_at as Date,
      deliveredAt: row.delivered_at as Date | undefined,
      failedAt: row.failed_at as Date | undefined,
      errorMessage: row.error_message as string | undefined,
    }));
  } catch (error) {
    logError("Failed to get notification logs", error, { tenantId });
    throw error;
  }
}

/**
 * Notify on job failure
 */
export async function notifyJobFailure(
  tenantId: string,
  jobId: string,
  errorMessage: string,
  userId?: string
): Promise<void> {
  try {
    // Get job owner
    const jobResult = await query(
      `SELECT user_id FROM jobs WHERE id = $1 AND workspace_id IN (SELECT id FROM tenants WHERE id = $2)`,
      [jobId, tenantId]
    );

    const jobOwnerId = jobResult.length > 0 ? (jobResult[0]?.user_id as string) : userId;

    // Get user email
    let email: string | undefined;
    if (jobOwnerId) {
      const userResult = await query(`SELECT email FROM users WHERE id = $1`, [jobOwnerId]);
      email = userResult.length > 0 ? (userResult[0]?.email as string) : undefined;
    }

    await sendNotification(tenantId, "job_failed", [{ userId: jobOwnerId, email }], {
      subject: "Job Failed",
      body: `Job ${jobId} has failed: ${errorMessage}`,
      metadata: { jobId, errorMessage },
    });
  } catch (error) {
    logError("Failed to notify job failure", error, { tenantId, jobId });
    // Don't throw - notification failures shouldn't break the system
  }
}
