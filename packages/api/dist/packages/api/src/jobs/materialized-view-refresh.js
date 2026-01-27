"use strict";
/**
 * Materialized View Refresh Job
 * Periodically refreshes materialized views for optimal query performance
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshMaterializedViewsJob = refreshMaterializedViewsJob;
exports.startMaterializedViewRefreshJob = startMaterializedViewRefreshJob;
const query_optimization_1 = require("../infrastructure/query-optimization");
const logger_1 = require("../utils/logger");
/**
 * Refresh all materialized views
 * Should be run periodically (e.g., every 15 minutes)
 */
async function refreshMaterializedViewsJob() {
    try {
        (0, logger_1.logInfo)('Starting materialized view refresh job');
        await (0, query_optimization_1.refreshAllMaterializedViews)();
        (0, logger_1.logInfo)('Materialized view refresh job completed');
    }
    catch (error) {
        (0, logger_1.logError)('Materialized view refresh job failed', error);
        throw error;
    }
}
/**
 * Start periodic materialized view refresh
 * Runs every 15 minutes
 */
function startMaterializedViewRefreshJob() {
    // Run immediately on startup
    refreshMaterializedViewsJob().catch((error) => {
        (0, logger_1.logError)('Initial materialized view refresh failed', error);
    });
    // Then run every 15 minutes
    const interval = setInterval(() => {
        refreshMaterializedViewsJob().catch((error) => {
            (0, logger_1.logError)('Periodic materialized view refresh failed', error);
        });
    }, 15 * 60 * 1000); // 15 minutes
    // Cleanup on process exit
    process.on('SIGTERM', () => {
        clearInterval(interval);
    });
}
//# sourceMappingURL=materialized-view-refresh.js.map