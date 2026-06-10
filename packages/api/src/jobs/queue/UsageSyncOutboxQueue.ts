import {
  PrioritizedQueue,
  QueueJobData,
  QueuePriority,
} from "../../infrastructure/queue/PrioritizedQueue";
import { logInfo, logError } from "../../utils/logger";
import { TenantTier } from "../../domain/entities/Tenant";

export interface UsageSyncJobData extends QueueJobData {
  billingAccountId: string;
  dateStr: string;
  syncUrl: string;
  serviceRoleKey: string;
}

/**
 * Transactional Outbox Worker for Stripe Usage Sync
 *
 * Ensures zero dropped events if the external Stripe API fails
 * by relying on robust BullMQ exponential backoff retries.
 */
export const usageSyncOutboxQueue = new PrioritizedQueue("usage_sync_outbox", async (job) => {
  const data = job.data as UsageSyncJobData;
  const timeoutMs = 15000;

  try {
    const response = await fetch(data.syncUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${data.serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        billing_account_id: data.billingAccountId,
        date: data.dateStr,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (response.ok) {
      logInfo("Stripe usage sync succeeded via outbox", {
        billingAccountId: data.billingAccountId,
        date: data.dateStr,
        jobId: job.id,
      });
      return { ok: true };
    }

    const responseBody = await response.text().catch(() => "");
    const retryable = response.status === 429 || response.status >= 500;

    const errorReason = `HTTP ${response.status}: ${responseBody || response.statusText}`;

    if (!retryable) {
      // Non-retryable error from Stripe (e.g., 400 Bad Request, 404 Not Found)
      // Throwing error so BullMQ marks it as failed
      throw new Error(`Non-retryable sync error: ${errorReason}`);
    }

    throw new Error(`Retryable sync error: ${errorReason}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logError("Stripe usage sync outbox failed", error, {
      billingAccountId: data.billingAccountId,
      date: data.dateStr,
      jobId: job.id,
    });

    // Bubble up error so BullMQ retry logic takes over
    throw new Error(`Sync failed: ${message}`);
  }
});

// Auto-start the worker in background if we're in a worker process
// or just start it directly.
export function startUsageSyncWorker() {
  usageSyncOutboxQueue.startWorker(5);
  logInfo("Usage Sync Outbox Worker started");
}
