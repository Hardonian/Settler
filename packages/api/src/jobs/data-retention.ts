import { query } from "../db";
import { logInfo, logError } from "../utils/logger";
import { config } from "../config";

// Scheduled job to delete old data per retention policies
export async function cleanupOldData(): Promise<void> {
  try {
    const retentionDays = config.dataRetention.defaultDays;
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    // Delete old reports (only if user hasn't opted for longer retention)
    const deletedReports = await query(
      `DELETE FROM reports
       WHERE generated_at < $1
         AND job_id IN (
           SELECT j.id FROM jobs j
           JOIN users u ON j.user_id = u.id
           WHERE u.data_retention_days <= $2
         )`,
      [cutoffDate, retentionDays]
    );

    // Delete old webhook payloads (after processing)
    const deletedPayloads = await query(
      `DELETE FROM webhook_payloads
       WHERE processed = true
         AND received_at < $1`,
      [cutoffDate]
    );

    // Delete old webhook deliveries
    const deletedDeliveries = await query(
      `DELETE FROM webhook_deliveries
       WHERE (status = 'delivered' OR status = 'failed')
         AND delivered_at < $1`,
      [cutoffDate]
    );

    // Hard delete users scheduled for deletion
    const deletedUsers = await query(
      `DELETE FROM users
       WHERE deletion_scheduled_at IS NOT NULL
         AND deletion_scheduled_at <= NOW()`,
      []
    );

    // Cleanup expired idempotency keys
    const deletedIdempotencyKeys = await query(
      `DELETE FROM idempotency_keys
       WHERE expires_at < NOW()`,
      []
    );

    logInfo('Data retention cleanup completed', {
      deletedReports: deletedReports.length,
      deletedPayloads: deletedPayloads.length,
      deletedDeliveries: deletedDeliveries.length,
      deletedUsers: deletedUsers.length,
      deletedIdempotencyKeys: deletedIdempotencyKeys.length,
      cutoffDate: cutoffDate.toISOString(),
    });
  } catch (error: any) {
    logError('Data retention cleanup failed', error);
    throw error;
  }
}

// Run cleanup job (call from cron/scheduler)
export function startDataRetentionJob(): void {
  // Run daily at 2 AM
  const intervalMs = 24 * 60 * 60 * 1000; // 24 hours
  const initialDelay = getInitialDelay();

  setTimeout(() => {
    cleanupOldData().catch(error => {
      logError('Scheduled data retention job failed', error);
    });

    // Schedule recurring
    setInterval(() => {
      cleanupOldData().catch(error => {
        logError('Scheduled data retention job failed', error);
      });
    }, intervalMs);
  }, initialDelay);
}

function getInitialDelay(): number {
  const now = new Date();
  const targetHour = 2; // 2 AM
  const target = new Date();
  target.setHours(targetHour, 0, 0, 0);

  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  return target.getTime() - now.getTime();
}
