/**
 * Export Job Worker Service Entry Point
 *
 * This is the main entry point for running the background worker service
 * that processes export jobs independently of UI connections.
 *
 * Usage:
 *   pnpm worker:export
 *   pnpm worker:export --worker-id my-worker --poll-interval 2000
 */

import { ExportJobWorker, createExportJobWorker, DEFAULT_WORKER_CONFIG } from "./ExportJobWorker";
import { logInfo, logError } from "../../utils/logger";
import { config } from "../../config";

interface WorkerArgs {
  workerId?: string;
  pollIntervalMs?: number;
  maxConcurrentJobs?: number;
  lockTimeoutMs?: number;
  heartbeatIntervalMs?: number;
  maxRetries?: number;
}

/**
 * Parse command line arguments
 */
function parseArgs(): WorkerArgs {
  const args: WorkerArgs = {};

  process.argv.forEach((arg, index) => {
    if (arg === "--worker-id" && process.argv[index + 1]) {
      args.workerId = process.argv[index + 1];
    }
    if (arg === "--poll-interval" && process.argv[index + 1]) {
      args.pollIntervalMs = parseInt(process.argv[index + 1], 10);
    }
    if (arg === "--max-concurrent" && process.argv[index + 1]) {
      args.maxConcurrentJobs = parseInt(process.argv[index + 1], 10);
    }
    if (arg === "--lock-timeout" && process.argv[index + 1]) {
      args.lockTimeoutMs = parseInt(process.argv[index + 1], 10);
    }
    if (arg === "--heartbeat-interval" && process.argv[index + 1]) {
      args.heartbeatIntervalMs = parseInt(process.argv[index + 1], 10);
    }
    if (arg === "--max-retries" && process.argv[index + 1]) {
      args.maxRetries = parseInt(process.argv[index + 1], 10);
    }
  });

  return args;
}

/**
 * Main function to start the worker
 */
async function main(): Promise<void> {
  const args = parseArgs();

  logInfo("Starting Export Job Worker Service", {
    nodeEnv: config.nodeEnv,
    args,
  });

  // Create and configure worker
  const worker = createExportJobWorker(args.workerId, {
    pollIntervalMs: args.pollIntervalMs || DEFAULT_WORKER_CONFIG.pollIntervalMs,
    maxConcurrentJobs: args.maxConcurrentJobs || DEFAULT_WORKER_CONFIG.maxConcurrentJobs,
    lockTimeoutMs: args.lockTimeoutMs || DEFAULT_WORKER_CONFIG.lockTimeoutMs,
    heartbeatIntervalMs: args.heartbeatIntervalMs || DEFAULT_WORKER_CONFIG.heartbeatIntervalMs,
    maxRetries: args.maxRetries || DEFAULT_WORKER_CONFIG.maxRetries,
  });

  // Handle events
  worker.on("job:completed", (data) => {
    logInfo("Job completed event", data);
  });

  worker.on("job:failed", (data) => {
    logError("Job failed event", new Error(data.error), data);
  });

  // Start the worker
  await worker.start();

  // Log stats periodically
  setInterval(() => {
    const stats = worker.getStats();
    logInfo("Worker stats", stats);
  }, 30000);

  // Handle graceful shutdown
  const shutdown = async () => {
    logInfo("Received shutdown signal, stopping worker...");
    await worker.stop();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

// Run if executed directly
main().catch((error) => {
  logError("Failed to start worker", error);
  process.exit(1);
});

export { ExportJobWorker, createExportJobWorker };
export type { WorkerArgs };
