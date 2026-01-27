"use strict";
/**
 * Operator Mode Daily Job
 * Runs daily intelligence and alert checks
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runOperatorModeDaily = runOperatorModeDaily;
const daily_intelligence_1 = require("../services/operator-mode/daily-intelligence");
const alerting_1 = require("../services/operator-mode/alerting");
const backups_1 = require("../services/operator-mode/backups");
const logger_1 = require("../utils/logger");
/**
 * Run daily operator mode tasks
 */
async function runOperatorModeDaily() {
    (0, logger_1.logInfo)('Starting operator mode daily job');
    try {
        // Generate daily intelligence
        const intelligence = await (0, daily_intelligence_1.generateDailyIntelligence)();
        (0, logger_1.logInfo)('Daily intelligence generated', {
            errorRate: intelligence.errorRate.overall,
            slowEndpoints: intelligence.slowEndpoints.length,
            failedIngestions: intelligence.failedIngestions.length,
            billingAnomalies: intelligence.billingAnomalies.length,
        });
        // Check alert thresholds
        const alerts = await (0, alerting_1.checkAlertThresholds)();
        (0, logger_1.logInfo)('Alert thresholds checked', {
            triggeredAlerts: alerts.length,
        });
        // Schedule daily backup
        try {
            await (0, backups_1.scheduleDailyBackup)();
            (0, logger_1.logInfo)('Daily backup scheduled');
        }
        catch (backupError) {
            (0, logger_1.logError)('Daily backup failed', backupError);
            // Don't fail the entire job if backup fails
        }
        (0, logger_1.logInfo)('Operator mode daily job completed');
    }
    catch (error) {
        (0, logger_1.logError)('Operator mode daily job failed', error);
        throw error;
    }
}
//# sourceMappingURL=operator-mode-daily.js.map