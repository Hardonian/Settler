import { cleanupExpiredDistributedGuardRecords } from "../services/distributed-guards";
import { logError, logInfo } from "../utils/logger";

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000;

export function startDistributedGuardsMaintenanceJob(): NodeJS.Timeout {
  const intervalMs = Number(
    process.env.DISTRIBUTED_GUARD_CLEANUP_INTERVAL_MS || DEFAULT_INTERVAL_MS
  );

  const timer = setInterval(() => {
    cleanupExpiredDistributedGuardRecords().catch((error) => {
      logError("distributed_guard_cleanup_failed", error);
    });
  }, intervalMs);

  logInfo("distributed_guard_cleanup_started", { intervalMs });
  return timer;
}
