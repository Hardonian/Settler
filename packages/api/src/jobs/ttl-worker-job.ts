/**
 * TTL Worker Job
 *
 * Scheduled job to run the TTL worker for export artifact retention.
 * Runs periodically to identify and prune aged export artifacts.
 */

import { startTTLWorker, stopTTLWorker, TTLWorkerConfig } from "../services/retention/ttl-worker";
import { logInfo, logError } from "../utils/logger";

export interface TTLWorkerJobConfig extends TTLWorkerConfig {
  scheduleIntervalMs?: number;
}

/**
 * Default TTL Worker Job Configuration
 */
export const DEFAULT_TTL_JOB_CONFIG: TTLWorkerJobConfig = {
  pollIntervalMs: 3600000, // Run every hour
  batchSize: 100,
  maxConcurrentDeletes: 10,
  dryRun: false,
  scheduleIntervalMs: 3600000, // Also check every hour
};

/**
 * Start the TTL Worker Job
 */
export async function startTTLWorkerJob(config?: Partial<TTLWorkerJobConfig>): Promise<void> {
  const jobConfig = { ...DEFAULT_TTL_JOB_CONFIG, ...config };

  logInfo("Starting TTL Worker Job", {
    config: jobConfig,
  });

  try {
    // Start the TTL worker
    await startTTLWorker({
      pollIntervalMs: jobConfig.pollIntervalMs,
      batchSize: jobConfig.batchSize,
      maxConcurrentDeletes: jobConfig.maxConcurrentDeletes,
      dryRun: jobConfig.dryRun,
    });

    logInfo("TTL Worker Job started successfully");
  } catch (error) {
    logError("Failed to start TTL Worker Job", error);
    throw error;
  }
}

/**
 * Stop the TTL Worker Job
 */
export async function stopTTLWorkerJob(): Promise<void> {
  logInfo("Stopping TTL Worker Job");

  try {
    await stopTTLWorker();
    logInfo("TTL Worker Job stopped");
  } catch (error) {
    logError("Failed to stop TTL Worker Job", error);
    throw error;
  }
}

/**
 * Run TTL Worker Job manually (for testing or on-demand)
 */
export async function runTTLWorkerJob(dryRun: boolean = false): Promise<void> {
  logInfo("Running TTL Worker Job manually", { dryRun });

  try {
    const worker = await startTTLWorker({ dryRun });

    // Wait for a single run to complete
    await new Promise((resolve) => setTimeout(resolve, 5000));

    logInfo("TTL Worker Job manual run completed", {
      stats: worker.getStats(),
    });
  } catch (error) {
    logError("TTL Worker Job manual run failed", error);
    throw error;
  }
}

export default startTTLWorkerJob;
