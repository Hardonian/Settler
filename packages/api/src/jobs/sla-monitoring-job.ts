/**
 * SLA Monitoring Job
 *
 * Scheduled job to check for SLA violations and alert.
 * Runs every hour to check for tickets that may violate SLA.
 */

import { checkSLAViolations } from "../services/sla/tracker";
import { logInfo, logError } from "../utils/logger";
import { checkTenantFrozen } from "../middleware/governance";

/**
 * Run SLA monitoring job
 * Should be scheduled to run every hour (e.g., via cron or scheduled function)
 */
export async function runSLAMonitoringJob(): Promise<void> {
  const startTime = Date.now();

  try {
    logInfo("Starting SLA monitoring job", {
      timestamp: new Date().toISOString(),
    });

    // SLA monitoring is primarily read-only (checking violations and alerting)
    // But we should skip alerting for frozen tenants
    const result = await checkSLAViolations();

    const duration = Date.now() - startTime;

    logInfo("Completed SLA monitoring job", {
      timestamp: new Date().toISOString(),
      duration,
      violations: result.violations,
      alerts_sent: result.alerts_sent,
    });

    // Alert if violations occurred
    if (result.violations > 0) {
      logError("SLA violations detected", new Error("SLA violations"), {
        violations: result.violations,
        alerts_sent: result.alerts_sent,
      });
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logError("SLA monitoring job failed", error, {
      duration,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

// Export for use in scheduled job runner
export default runSLAMonitoringJob;
