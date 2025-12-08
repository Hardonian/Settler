/**
 * Materialized View Refresh Job
 * Periodically refreshes materialized views for optimal query performance
 */

import { refreshAllMaterializedViews } from '../infrastructure/query-optimization';
import { logInfo, logError } from '../utils/logger';

/**
 * Refresh all materialized views
 * Should be run periodically (e.g., every 15 minutes)
 */
export async function refreshMaterializedViewsJob(): Promise<void> {
  try {
    logInfo('Starting materialized view refresh job');
    await refreshAllMaterializedViews();
    logInfo('Materialized view refresh job completed');
  } catch (error) {
    logError('Materialized view refresh job failed', error);
    throw error;
  }
}

/**
 * Start periodic materialized view refresh
 * Runs every 15 minutes
 */
export function startMaterializedViewRefreshJob(): void {
  // Run immediately on startup
  refreshMaterializedViewsJob().catch((error) => {
    logError('Initial materialized view refresh failed', error);
  });

  // Then run every 15 minutes
  const interval = setInterval(() => {
    refreshMaterializedViewsJob().catch((error) => {
      logError('Periodic materialized view refresh failed', error);
    });
  }, 15 * 60 * 1000); // 15 minutes

  // Cleanup on process exit
  process.on('SIGTERM', () => {
    clearInterval(interval);
  });
}
