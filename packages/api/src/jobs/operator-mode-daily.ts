/**
 * Operator Mode Daily Job
 * Runs daily intelligence and alert checks
 */

import { generateDailyIntelligence } from "../services/operator-mode/daily-intelligence";
import { checkAlertThresholds } from "../services/operator-mode/alerting";
import { scheduleDailyBackup } from "../services/operator-mode/backups";
import { logInfo, logError } from "../utils/logger";
/**
 * Run daily operator mode tasks
 */
export async function runOperatorModeDaily(): Promise<void> {
  logInfo("Starting operator mode daily job");

  try {
    // Generate daily intelligence (read-only, but skip frozen tenants in downstream)
    const intelligence = await generateDailyIntelligence();
    logInfo("Daily intelligence generated", {
      errorRate: intelligence.errorRate.overall,
      slowEndpoints: intelligence.slowEndpoints.length,
      failedIngestions: intelligence.failedIngestions.length,
      billingAnomalies: intelligence.billingAnomalies.length,
    });

    // Check alert thresholds - skip for frozen tenants
    const alerts = await checkAlertThresholds();
    logInfo("Alert thresholds checked", {
      triggeredAlerts: alerts.length,
    });

    // Schedule daily backup - skip for frozen tenants
    try {
      await scheduleDailyBackup();
      logInfo("Daily backup scheduled");
    } catch (backupError) {
      logError("Daily backup failed", backupError);
      // Don't fail the entire job if backup fails
    }

    logInfo("Operator mode daily job completed");
  } catch (error) {
    logError("Operator mode daily job failed", error);
    throw error;
  }
}
