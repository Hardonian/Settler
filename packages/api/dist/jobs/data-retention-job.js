"use strict";
/**
 * Data Retention Job
 *
 * Scheduled job to enforce data retention policies.
 * Runs daily to delete data older than retention period.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDataRetentionJob = runDataRetentionJob;
const enforcer_1 = require("../services/data-retention/enforcer");
const logger_1 = require("../utils/logger");
/**
 * Run data retention enforcement job
 * Should be scheduled to run daily (e.g., via cron or scheduled function)
 */
async function runDataRetentionJob() {
    const startTime = Date.now();
    try {
        (0, logger_1.logInfo)('Starting data retention job', {
            timestamp: new Date().toISOString(),
        });
        const result = await (0, enforcer_1.enforceAllRetentionPolicies)();
        const duration = Date.now() - startTime;
        (0, logger_1.logInfo)('Completed data retention job', {
            timestamp: new Date().toISOString(),
            duration,
            accountsProcessed: result.accountsProcessed,
            totalDeleted: result.totalDeleted,
            totalErrors: result.totalErrors,
        });
        // Alert if errors occurred
        if (result.totalErrors > 0) {
            (0, logger_1.logError)('Data retention job completed with errors', new Error('Retention job errors'), {
                totalErrors: result.totalErrors,
                accountsProcessed: result.accountsProcessed,
            });
        }
    }
    catch (error) {
        const duration = Date.now() - startTime;
        (0, logger_1.logError)('Data retention job failed', error, {
            duration,
            timestamp: new Date().toISOString(),
        });
        throw error;
    }
}
// Export for use in scheduled job runner
exports.default = runDataRetentionJob;
//# sourceMappingURL=data-retention-job.js.map