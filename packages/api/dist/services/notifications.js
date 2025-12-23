"use strict";
/**
 * Notifications Service
 * Handles failure notifications and notification preferences
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotificationPreferences = getNotificationPreferences;
exports.updateNotificationPreferences = updateNotificationPreferences;
exports.sendNotification = sendNotification;
exports.markNotificationDelivered = markNotificationDelivered;
exports.markNotificationFailed = markNotificationFailed;
exports.getNotificationLogs = getNotificationLogs;
exports.notifyJobFailure = notifyJobFailure;
const db_1 = require("../db");
const logger_1 = require("../utils/logger");
/**
 * Get notification preferences for a user/tenant
 */
async function getNotificationPreferences(tenantId, userId) {
    try {
        const conditions = ["tenant_id = $1"];
        const params = [tenantId];
        let paramIndex = 2;
        if (userId) {
            conditions.push(`user_id = $${paramIndex}`);
            params.push(userId);
            paramIndex++;
        }
        else {
            conditions.push("user_id IS NULL");
        }
        const result = await (0, db_1.query)(`SELECT event_type, channels, enabled
       FROM notification_preferences
       WHERE ${conditions.join(" AND ")}`, params);
        return result.map((row) => ({
            eventType: row.event_type,
            channels: row.channels,
            enabled: row.enabled,
        }));
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get notification preferences", error, { tenantId, userId });
        throw error;
    }
}
/**
 * Update notification preferences
 */
async function updateNotificationPreferences(tenantId, preferences, userId) {
    try {
        for (const pref of preferences) {
            await (0, db_1.query)(`INSERT INTO notification_preferences (
          tenant_id, user_id, event_type, channels, enabled
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (tenant_id, user_id, event_type) DO UPDATE
        SET channels = EXCLUDED.channels,
            enabled = EXCLUDED.enabled,
            updated_at = now()`, [tenantId, userId || null, pref.eventType, JSON.stringify(pref.channels), pref.enabled]);
        }
        (0, logger_1.logInfo)("Notification preferences updated", { tenantId, userId });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to update notification preferences", error, { tenantId, userId });
        throw error;
    }
}
/**
 * Send a notification
 */
async function sendNotification(tenantId, eventType, recipients, data) {
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
                    }
                    else if (channel === "slack" && recipient.slackWebhook) {
                        recipientAddress = recipient.slackWebhook;
                    }
                    else {
                        continue;
                    }
                    // TODO: Actually send the notification via email/Slack/webhook service
                    // For now, just log it
                    await logNotification(tenantId, userId, eventType, channel, recipientAddress, data.subject, data.body);
                    (0, logger_1.logInfo)("Notification sent", {
                        tenantId,
                        userId,
                        eventType,
                        channel,
                        recipient: recipientAddress,
                    });
                }
                catch (error) {
                    (0, logger_1.logError)("Failed to send notification", error, {
                        tenantId,
                        userId,
                        eventType,
                        channel,
                    });
                }
            }
        }
    }
    catch (error) {
        (0, logger_1.logError)("Failed to send notification", error, { tenantId, eventType });
        throw error;
    }
}
/**
 * Log a notification
 */
async function logNotification(tenantId, userId, eventType, channel, recipient, subject, body) {
    try {
        const result = await (0, db_1.query)(`INSERT INTO notification_logs (
        tenant_id, user_id, event_type, channel, recipient, subject, body
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id`, [tenantId, userId || null, eventType, channel, recipient, subject || null, body || null]);
        const logId = result[0]?.id || '';
        return logId;
    }
    catch (error) {
        (0, logger_1.logError)("Failed to log notification", error, { tenantId, userId, eventType });
        throw error;
    }
}
/**
 * Mark notification as delivered
 */
async function markNotificationDelivered(logId) {
    try {
        await (0, db_1.query)(`UPDATE notification_logs
       SET delivered_at = now()
       WHERE id = $1`, [logId]);
    }
    catch (error) {
        (0, logger_1.logError)("Failed to mark notification as delivered", error, { logId });
        throw error;
    }
}
/**
 * Mark notification as failed
 */
async function markNotificationFailed(logId, errorMessage) {
    try {
        await (0, db_1.query)(`UPDATE notification_logs
       SET failed_at = now(), error_message = $1
       WHERE id = $2`, [errorMessage, logId]);
    }
    catch (error) {
        (0, logger_1.logError)("Failed to mark notification as failed", error, { logId });
        throw error;
    }
}
/**
 * Get notification logs
 */
async function getNotificationLogs(tenantId, filters = {}) {
    try {
        const conditions = ["tenant_id = $1"];
        const params = [tenantId];
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
        const result = await (0, db_1.query)(`SELECT id, tenant_id, user_id, event_type, channel, recipient,
              subject, body, sent_at, delivered_at, failed_at, error_message
       FROM notification_logs
       WHERE ${conditions.join(" AND ")}
       ORDER BY sent_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, [...params, limit, offset]);
        return result.map((row) => ({
            id: row.id,
            tenantId: row.tenant_id,
            userId: row.user_id,
            eventType: row.event_type,
            channel: row.channel,
            recipient: row.recipient,
            subject: row.subject,
            body: row.body,
            sentAt: row.sent_at,
            deliveredAt: row.delivered_at,
            failedAt: row.failed_at,
            errorMessage: row.error_message,
        }));
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get notification logs", error, { tenantId });
        throw error;
    }
}
/**
 * Notify on job failure
 */
async function notifyJobFailure(tenantId, jobId, errorMessage, userId) {
    try {
        // Get job owner
        const jobResult = await (0, db_1.query)(`SELECT user_id FROM jobs WHERE id = $1 AND workspace_id IN (SELECT id FROM tenants WHERE id = $2)`, [jobId, tenantId]);
        const jobOwnerId = jobResult.length > 0 ? jobResult[0]?.user_id : userId;
        // Get user email
        let email;
        if (jobOwnerId) {
            const userResult = await (0, db_1.query)(`SELECT email FROM users WHERE id = $1`, [jobOwnerId]);
            email = userResult.length > 0 ? userResult[0]?.email : undefined;
        }
        await sendNotification(tenantId, "job_failed", [{ userId: jobOwnerId, email }], {
            subject: "Job Failed",
            body: `Job ${jobId} has failed: ${errorMessage}`,
            metadata: { jobId, errorMessage },
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to notify job failure", error, { tenantId, jobId });
        // Don't throw - notification failures shouldn't break the system
    }
}
//# sourceMappingURL=notifications.js.map