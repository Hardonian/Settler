/**
 * Materialized View Scheduler
 *
 * Manages refresh schedules for materialized views including:
 * - Manual refresh (on-demand)
 * - Automatic refresh (interval-based)
 * - Cron-based refresh scheduling
 */

import { logInfo, logError, logWarn } from "../utils/logger";
import {
  RefreshConfig,
  RefreshStrategy,
  AutomaticRefreshConfig,
  CronRefreshConfig,
  TenantViewConfig,
  COMMON_VIEW_TEMPLATES,
} from "./MaterializedViewConfig";
import {
  refreshMaterializedView,
  getTenantConfig,
  getActiveTenantViews,
  getMaterializedViewName,
  checkViewExists,
} from "./MaterializedViewManager";

interface ScheduledTask {
  tenantId: string;
  viewId: string;
  nextRun: Date;
  refreshConfig: RefreshConfig;
}

interface SchedulerStats {
  totalScheduled: number;
  runningJobs: number;
  lastCleanup: Date;
}

// In-memory scheduler state
const scheduledTasks = new Map<string, ScheduledTask>();
let schedulerStats: SchedulerStats = {
  totalScheduled: 0,
  runningJobs: 0,
  lastCleanup: new Date(),
};
let schedulerInterval: NodeJS.Timeout | null = null;

/**
 * Parse cron expression to get next run time
 * Simplified implementation - in production use a proper cron library
 */
function parseCronToNextRun(cronConfig: CronRefreshConfig): Date {
  const now = new Date();
  const [minute, hour, dayOfMonth, month, dayOfWeek] = cronConfig.cronExpression.split(" ");

  const next = new Date(now);
  next.setSeconds(0);
  next.setMilliseconds(0);

  // Simple implementation: if minute is *, run next minute
  // Otherwise parse the minute field
  if (minute === "*") {
    next.setMinutes(next.getMinutes() + 1);
  } else {
    const minuteVal = parseInt(minute!);
    if (minuteVal <= next.getMinutes()) {
      next.setHours(next.getHours() + 1);
      next.setMinutes(minuteVal);
    } else {
      next.setMinutes(minuteVal);
    }
  }

  return next;
}

/**
 * Calculate next run time based on refresh config
 */
export function calculateNextRun(config: RefreshConfig): Date {
  const now = new Date();

  switch (config.strategy) {
    case "manual":
      // Manual never auto-schedules
      return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year

    case "automatic":
      return new Date(now.getTime() + config.intervalMinutes * 60 * 1000);

    case "cron":
      return parseCronToNextRun(config);

    default:
      return new Date(now.getTime() + 60 * 60 * 1000); // 1 hour default
  }
}

/**
 * Schedule a materialized view for refresh
 */
export function scheduleViewRefresh(tenantId: string, viewConfig: TenantViewConfig): void {
  const key = `${tenantId}_${viewConfig.viewId}`;

  // Don't schedule manual refresh views
  if (viewConfig.refreshConfig.strategy === "manual") {
    scheduledTasks.delete(key);
    logInfo("Skipped scheduling for manual refresh view", { tenantId, viewId: viewConfig.viewId });
    return;
  }

  const nextRun = calculateNextRun(viewConfig.refreshConfig);

  const task: ScheduledTask = {
    tenantId,
    viewId: viewConfig.viewId,
    nextRun,
    refreshConfig: viewConfig.refreshConfig,
  };

  scheduledTasks.set(key, task);
  schedulerStats.totalScheduled = scheduledTasks.size;

  logInfo("Scheduled view refresh", {
    tenantId,
    viewId: viewConfig.viewId,
    nextRun: nextRun.toISOString(),
    strategy: viewConfig.refreshConfig.strategy,
  });
}

/**
 * Unschedule a materialized view refresh
 */
export function unscheduleViewRefresh(tenantId: string, viewId: string): void {
  const key = `${tenantId}_${viewId}`;
  scheduledTasks.delete(key);
  schedulerStats.totalScheduled = scheduledTasks.size;

  logInfo("Unscheduled view refresh", { tenantId, viewId });
}

/**
 * Process a single refresh task
 */
async function processRefresh(task: ScheduledTask): Promise<void> {
  const { tenantId, viewId } = task;

  logInfo("Processing scheduled refresh", { tenantId, viewId });

  schedulerStats.runningJobs++;

  try {
    // Get the view definition to check if it supports incremental
    const viewDef = COMMON_VIEW_TEMPLATES.find((v) => v.id === viewId);
    const supportsIncremental = viewDef?.supportsIncremental ?? false;

    // Check if view exists
    const exists = await checkViewExists(tenantId, viewId);
    if (!exists) {
      logWarn("Skipping refresh - view does not exist", { tenantId, viewId });
      return;
    }

    // Determine if we should use incremental refresh
    const useIncremental = task.refreshConfig.strategy === "automatic" && supportsIncremental;

    const result = await refreshMaterializedView(tenantId, viewId, useIncremental);

    if (result.success) {
      logInfo("Scheduled refresh completed", {
        tenantId,
        viewId,
        durationMs: result.durationMs,
        incremental: result.incremental,
      });
    } else {
      logError("Scheduled refresh failed", {
        tenantId,
        viewId,
        error: result.error,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError("Error processing scheduled refresh", { tenantId, viewId, error: errorMessage });
  } finally {
    schedulerStats.runningJobs--;
  }
}

/**
 * Main scheduler loop - processes due tasks
 */
async function schedulerLoop(): Promise<void> {
  const now = new Date();

  // Find tasks that are due
  const dueTasks: ScheduledTask[] = [];

  for (const [key, task] of scheduledTasks) {
    if (task.nextRun <= now) {
      dueTasks.push(task);

      // Reschedule for next run
      const nextRun = calculateNextRun(task.refreshConfig);
      task.nextRun = nextRun;
      scheduledTasks.set(key, task);
    }
  }

  // Process due tasks
  if (dueTasks.length > 0) {
    logInfo("Processing due refresh tasks", { count: dueTasks.length });

    // Process in parallel with concurrency limit
    const concurrencyLimit = 5;
    for (let i = 0; i < dueTasks.length; i += concurrencyLimit) {
      const batch = dueTasks.slice(i, i + concurrencyLimit);
      await Promise.all(batch.map((task) => processRefresh(task)));
    }
  }

  // Periodic cleanup
  const cleanupInterval = 60 * 60 * 1000; // 1 hour
  if (now.getTime() - schedulerStats.lastCleanup.getTime() > cleanupInterval) {
    await cleanupScheduler();
    schedulerStats.lastCleanup = now;
  }
}

/**
 * Cleanup stale or invalid scheduled tasks
 */
async function cleanupScheduler(): Promise<void> {
  let cleaned = 0;

  for (const [key, task] of scheduledTasks) {
    const exists = await checkViewExists(task.tenantId, task.viewId);
    if (!exists) {
      scheduledTasks.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logInfo("Cleaned up scheduled tasks", { cleaned, remaining: scheduledTasks.size });
  }
}

/**
 * Start the materialized view scheduler
 */
export function startScheduler(intervalMs: number = 60000): void {
  if (schedulerInterval) {
    logWarn("Scheduler already running");
    return;
  }

  schedulerInterval = setInterval(schedulerLoop, intervalMs);

  logInfo("Materialized view scheduler started", { intervalMs });
}

/**
 * Stop the materialized view scheduler
 */
export function stopScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    logInfo("Materialized view scheduler stopped");
  }
}

/**
 * Get scheduler statistics
 */
export function getSchedulerStats(): SchedulerStats {
  return { ...schedulerStats };
}

/**
 * Get all scheduled tasks
 */
export function getScheduledTasks(): ScheduledTask[] {
  return Array.from(scheduledTasks.values());
}

/**
 * Manually trigger a refresh for a tenant's view
 */
export async function manualRefresh(
  tenantId: string,
  viewId: string,
  incremental: boolean = false
): Promise<{ success: boolean; error?: string }> {
  const config = getTenantConfig(tenantId);
  if (!config) {
    return { success: false, error: "Tenant configuration not found" };
  }

  const viewConfig = config.views.find((v) => v.viewId === viewId);
  if (!viewConfig) {
    return { success: false, error: "View not configured for tenant" };
  }

  const result = await refreshMaterializedView(tenantId, viewId, incremental);

  if (result.success) {
    viewConfig.lastRefreshedAt = new Date();
    viewConfig.stalenessStatus = "fresh";
    logInfo("Manual refresh completed", { tenantId, viewId, durationMs: result.durationMs });
  }

  return { success: result.success, error: result.error };
}

/**
 * Refresh all active views for a tenant
 */
export async function refreshAllTenantViews(
  tenantId: string,
  incremental: boolean = false
): Promise<{
  success: boolean;
  results: Array<{ viewId: string; success: boolean; error?: string }>;
}> {
  const views = getActiveTenantViews(tenantId);

  const results = await Promise.all(
    views.map(async (viewConfig) => {
      const result = await refreshMaterializedView(tenantId, viewConfig.viewId, incremental);
      return {
        viewId: viewConfig.viewId,
        success: result.success,
        error: result.error,
      };
    })
  );

  const allSuccess = results.every((r) => r.success);

  return { success: allSuccess, results };
}

/**
 * Get next scheduled run for a view
 */
export function getNextScheduledRun(tenantId: string, viewId: string): Date | null {
  const key = `${tenantId}_${viewId}`;
  const task = scheduledTasks.get(key);
  return task?.nextRun ?? null;
}

/**
 * Reschedule a view with new refresh config
 */
export function rescheduleView(
  tenantId: string,
  viewId: string,
  newConfig: RefreshConfig
): { success: boolean; error?: string } {
  const key = `${tenantId}_${viewId}`;
  const task = scheduledTasks.get(key);

  if (!task) {
    // Schedule new if not exists
    scheduleViewRefresh(tenantId, {
      viewId,
      active: true,
      refreshConfig: newConfig,
      stalenessStatus: "fresh",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return { success: true };
  }

  task.refreshConfig = newConfig;
  task.nextRun = calculateNextRun(newConfig);
  scheduledTasks.set(key, task);

  logInfo("Rescheduled view refresh", { tenantId, viewId, nextRun: task.nextRun });
  return { success: true };
}
