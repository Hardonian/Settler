"use strict";
/**
 * SLA Monitoring Job
 *
 * Scheduled job to check for SLA violations and alert.
 * Runs every hour to check for tickets that may violate SLA.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSLAMonitoringJob = runSLAMonitoringJob;
const tracker_1 = require("../services/sla/tracker");
const logger_1 = require("../utils/logger");
/**
 * Run SLA monitoring job
 * Should be scheduled to run every hour (e.g., via cron or scheduled function)
 */
async function runSLAMonitoringJob() {
    const startTime = Date.now();
    try {
        (0, logger_1.logInfo)('Starting SLA monitoring job', {
            timestamp: new Date().toISOString(),
        });
        const result = await (0, tracker_1.checkSLAViolations)();
        const duration = Date.now() - startTime;
        (0, logger_1.logInfo)('Completed SLA monitoring job', {
            timestamp: new Date().toISOString(),
            duration,
            violations: result.violations,
            alerts_sent: result.alerts_sent,
        });
        // Alert if violations occurred
        if (result.violations > 0) {
            (0, logger_1.logError)('SLA violations detected', new Error('SLA violations'), {
                violations: result.violations,
                alerts_sent: result.alerts_sent,
            });
        }
    }
    catch (error) {
        const duration = Date.now() - startTime;
        (0, logger_1.logError)('SLA monitoring job failed', error, {
            duration,
            timestamp: new Date().toISOString(),
        });
        throw error;
    }
}
// Export for use in scheduled job runner
exports.default = runSLAMonitoringJob;
//# sourceMappingURL=sla-monitoring-job.js.map