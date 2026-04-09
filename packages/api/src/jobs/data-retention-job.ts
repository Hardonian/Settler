/**
 * Data Retention Job
 *
 * Scheduled job to enforce data retention policies.
 * Runs daily to delete data older than retention period.
 */

import { enforceAllRetentionPolicies } from "../services/data-retention/enforcer";
import { logInfo, logError } from "../utils/logger";

/**
 * Run data retention enforcement job
 * Should be scheduled to run daily (e.g., via cron or scheduled function)
 */
export async function runDataRetentionJob(): Promise<void> {
  const startTime = Date.now();

  try {
    logInfo("Starting data retention job", {
      timestamp: new Date().toISOString(),
    });

    const result = await enforceAllRetentionPolicies();

    const duration = Date.now() - startTime;

    logInfo("Completed data retention job", {
      timestamp: new Date().toISOString(),
      duration,
      accountsProcessed: result.accountsProcessed,
      totalDeleted: result.totalDeleted,
      totalErrors: result.totalErrors,
    });

    // Alert if errors occurred
    if (result.totalErrors > 0) {
      logError("Data retention job completed with errors", new Error("Retention job errors"), {
        totalErrors: result.totalErrors,
        accountsProcessed: result.accountsProcessed,
      });
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logError("Data retention job failed", error, {
      duration,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

// Export for use in scheduled job runner
export default runDataRetentionJob;
