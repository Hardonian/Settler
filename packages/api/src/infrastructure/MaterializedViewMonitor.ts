/**
 * Materialized View Monitor
 *
 * Monitors materialized view health, freshness, and performance metrics.
 */

import { query } from "../db";
import { logInfo, logError, logWarn } from "../utils/logger";
import {
  getTenantConfig,
  getActiveTenantViews,
  getViewStatus,
  getMaterializedViewName,
} from "./MaterializedViewManager";
import { TenantMaterializedViewConfig, TenantViewConfig } from "./MaterializedViewConfig";

export interface ViewHealthStatus {
  viewId: string;
  viewName: string;
  exists: boolean;
  rowCount: number;
  lastRefreshedAt: Date | null;
  stalenessMinutes: number;
  stalenessStatus: "fresh" | "stale" | "stale_overdue" | "unknown";
  refreshRequired: boolean;
  healthScore: number; // 0-100
}

export interface TenantViewMetrics {
  tenantId: string;
  totalViews: number;
  activeViews: number;
  freshViews: number;
  staleViews: number;
  overdueViews: number;
  views: ViewHealthStatus[];
  averageHealthScore: number;
}

export interface ViewPerformanceMetrics {
  viewId: string;
  viewName: string;
  queryCount: number;
  avgQueryTimeMs: number;
  totalQueryTimeMs: number;
  cacheHitRatio: number;
  lastQueryAt: Date | null;
}

export interface MonitorAlert {
  tenantId: string;
  viewId: string;
  alertType: "stale" | "overdue" | "missing" | "error";
  message: string;
  createdAt: Date;
  acknowledged: boolean;
}

// In-memory metrics storage
const viewMetrics = new Map<string, ViewPerformanceMetrics>();
const alerts: MonitorAlert[] = [];

/**
 * Get health status for all views of a tenant
 */
export async function getTenantViewMetrics(tenantId: string): Promise<TenantViewMetrics> {
  const config = getTenantConfig(tenantId);

  if (!config) {
    return {
      tenantId,
      totalViews: 0,
      activeViews: 0,
      freshViews: 0,
      staleViews: 0,
      overdueViews: 0,
      views: [],
      averageHealthScore: 100,
    };
  }

  const activeViews = getActiveTenantViews(tenantId);
  const views: ViewHealthStatus[] = [];

  let freshCount = 0;
  let staleCount = 0;
  let overdueCount = 0;
  let totalHealthScore = 0;

  for (const viewConfig of activeViews) {
    const status = await getViewStatus(tenantId, viewConfig.viewId);
    const stalenessMinutes = status.lastRefreshedAt
      ? Math.round((Date.now() - status.lastRefreshedAt.getTime()) / 60000)
      : -1;

    // Determine staleness status based on config
    let stalenessStatus: "fresh" | "stale" | "stale_overdue" | "unknown" = "unknown";
    let refreshRequired = false;
    let healthScore = 100;

    if (viewConfig.refreshConfig.strategy === "automatic") {
      const maxStaleness =
        "maxStalenessMinutes" in viewConfig.refreshConfig
          ? viewConfig.refreshConfig.maxStalenessMinutes
          : 60;

      if (stalenessMinutes < 0) {
        stalenessStatus = "unknown";
        healthScore = 0;
        refreshRequired = true;
      } else if (stalenessMinutes < maxStaleness * 0.5) {
        stalenessStatus = "fresh";
        freshCount++;
      } else if (stalenessMinutes < maxStaleness) {
        stalenessStatus = "stale";
        staleCount++;
        refreshRequired = true;
        healthScore = Math.max(0, 100 - (stalenessMinutes / maxStaleness) * 50);
      } else {
        stalenessStatus = "stale_overdue";
        overdueCount++;
        refreshRequired = true;
        healthScore = Math.max(0, 50 - ((stalenessMinutes - maxStaleness) / maxStaleness) * 50);
      }
    } else if (viewConfig.refreshConfig.strategy === "manual") {
      // Manual refresh - mark as stale after 24 hours
      if (stalenessMinutes > 1440) {
        stalenessStatus = "stale";
        staleCount++;
        refreshRequired = true;
        healthScore = Math.max(0, 100 - (stalenessMinutes / 1440) * 50);
      } else {
        stalenessStatus = "fresh";
        freshCount++;
      }
    } else if (viewConfig.refreshConfig.strategy === "cron") {
      // Cron - assume fresh if less than 2 hours
      if (stalenessMinutes < 0) {
        stalenessStatus = "unknown";
        healthScore = 0;
        refreshRequired = true;
      } else if (stalenessMinutes < 120) {
        stalenessStatus = "fresh";
        freshCount++;
      } else {
        stalenessStatus = "stale";
        staleCount++;
        refreshRequired = true;
        healthScore = Math.max(0, 100 - (stalenessMinutes / 120) * 50);
      }
    }

    totalHealthScore += healthScore;

    views.push({
      viewId: viewConfig.viewId,
      viewName: status.viewName,
      exists: status.exists,
      rowCount: status.rowCount,
      lastRefreshedAt: status.lastRefreshedAt,
      stalenessMinutes,
      stalenessStatus,
      refreshRequired,
      healthScore,
    });
  }

  return {
    tenantId,
    totalViews: config.views.length,
    activeViews: activeViews.length,
    freshViews: freshCount,
    staleViews: staleCount,
    overdueViews: overdueCount,
    views,
    averageHealthScore:
      activeViews.length > 0 ? Math.round(totalHealthScore / activeViews.length) : 100,
  };
}

/**
 * Check view health and generate alerts
 */
export async function checkViewHealth(tenantId: string): Promise<MonitorAlert[]> {
  const metrics = await getTenantViewMetrics(tenantId);
  const newAlerts: MonitorAlert[] = [];

  for (const view of metrics.views) {
    if (!view.exists) {
      newAlerts.push({
        tenantId,
        viewId: view.viewId,
        alertType: "missing",
        message: `Materialized view ${view.viewId} does not exist`,
        createdAt: new Date(),
        acknowledged: false,
      });
    } else if (view.stalenessStatus === "stale_overdue") {
      newAlerts.push({
        tenantId,
        viewId: view.viewId,
        alertType: "overdue",
        message: `Materialized view ${view.viewId} is overdue for refresh (${view.stalenessMinutes} minutes stale)`,
        createdAt: new Date(),
        acknowledged: false,
      });
    } else if (view.stalenessStatus === "stale") {
      newAlerts.push({
        tenantId,
        viewId: view.viewId,
        alertType: "stale",
        message: `Materialized view ${view.viewId} is stale (${view.stalenessMinutes} minutes since last refresh)`,
        createdAt: new Date(),
        acknowledged: false,
      });
    }
  }

  // Add new alerts
  alerts.push(...newAlerts);

  return newAlerts;
}

/**
 * Get all unacknowledged alerts
 */
export function getAlerts(tenantId?: string): MonitorAlert[] {
  if (tenantId) {
    return alerts.filter((a) => a.tenantId === tenantId && !a.acknowledged);
  }
  return alerts.filter((a) => !a.acknowledged);
}

/**
 * Acknowledge an alert
 */
export function acknowledgeAlert(alertIndex: number): boolean {
  if (alerts[alertIndex]) {
    alerts[alertIndex].acknowledged = true;
    return true;
  }
  return false;
}

/**
 * Record query performance for a materialized view
 */
export function recordQueryPerformance(
  tenantId: string,
  viewId: string,
  queryTimeMs: number,
  usedMaterializedView: boolean
): void {
  const key = `${tenantId}_${viewId}`;

  let metrics = viewMetrics.get(key);

  if (!metrics) {
    metrics = {
      viewId,
      viewName: getMaterializedViewName(tenantId, viewId),
      queryCount: 0,
      avgQueryTimeMs: 0,
      totalQueryTimeMs: 0,
      cacheHitRatio: 0,
      lastQueryAt: null,
    };
    viewMetrics.set(key, metrics);
  }

  metrics.queryCount++;
  metrics.totalQueryTimeMs += queryTimeMs;
  metrics.avgQueryTimeMs = metrics.totalQueryTimeMs / metrics.queryCount;
  metrics.lastQueryAt = new Date();

  if (usedMaterializedView) {
    // Simple cache hit ratio calculation
    metrics.cacheHitRatio = Math.min(1, metrics.cacheHitRatio + 0.1);
  }
}

/**
 * Get performance metrics for a view
 */
export function getViewPerformanceMetrics(
  tenantId: string,
  viewId: string
): ViewPerformanceMetrics | null {
  const key = `${tenantId}_${viewId}`;
  return viewMetrics.get(key) ?? null;
}

/**
 * Get performance metrics for all tenant views
 */
export function getAllViewPerformanceMetrics(tenantId: string): ViewPerformanceMetrics[] {
  const config = getTenantConfig(tenantId);
  if (!config) return [];

  return config.views
    .filter((v) => v.active)
    .map((v) => viewMetrics.get(`${tenantId}_${v.viewId}`))
    .filter((m): m is ViewPerformanceMetrics => m !== undefined);
}

/**
 * Calculate overall system health score
 */
export async function calculateSystemHealth(): Promise<{
  totalTenants: number;
  healthyTenants: number;
  unhealthyTenants: number;
  averageHealthScore: number;
}> {
  const tenantsWithViews = Array.from(
    new Set(Array.from(viewMetrics.keys()).map((k) => k.split("_")[0] ?? ""))
  ).filter((t) => t !== "");

  let totalHealthScore = 0;
  let healthyCount = 0;

  for (const tenantId of tenantsWithViews) {
    const metrics = await getTenantViewMetrics(tenantId);
    totalHealthScore += metrics.averageHealthScore;
    if (metrics.averageHealthScore >= 80) {
      healthyCount++;
    }
  }

  return {
    totalTenants: tenantsWithViews.length,
    healthyTenants: healthyCount,
    unhealthyTenants: tenantsWithViews.length - healthyCount,
    averageHealthScore:
      tenantsWithViews.length > 0 ? Math.round(totalHealthScore / tenantsWithViews.length) : 100,
  };
}

/**
 * Get database statistics for materialized views
 */
export async function getViewDatabaseStats(): Promise<{
  totalMaterializedViews: number;
  totalSizeBytes: number;
  totalRows: number;
  oldestRefresh: Date | null;
  newestRefresh: Date | null;
}> {
  try {
    const result = await query<{
      count: string;
      total_size: string;
      total_rows: string;
      oldest_refresh: string | null;
      newest_refresh: string | null;
    }>(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(pg_total_relation_size(matviewname)), 0) as total_size,
        COALESCE(SUM((SELECT COUNT(*) FROM information_schema.tables t WHERE t.table_name = mv.matviewname)), 0) as total_rows,
        MIN(mv.lastrefresh) as oldest_refresh,
        MAX(mv.lastrefresh) as newest_refresh
      FROM pg_matviews mv
      WHERE mv.schemaname = 'public'
    `);

    if (result.length === 0) {
      return {
        totalMaterializedViews: 0,
        totalSizeBytes: 0,
        totalRows: 0,
        oldestRefresh: null,
        newestRefresh: null,
      };
    }

    return {
      totalMaterializedViews: parseInt(result[0]!.count || "0"),
      totalSizeBytes: parseInt(result[0]!.total_size || "0"),
      totalRows: parseInt(result[0]!.total_rows || "0"),
      oldestRefresh: result[0]!.oldest_refresh ? new Date(result[0]!.oldest_refresh) : null,
      newestRefresh: result[0]!.newest_refresh ? new Date(result[0]!.newest_refresh) : null,
    };
  } catch (error) {
    logError("Failed to get view database stats", { error });
    return {
      totalMaterializedViews: 0,
      totalSizeBytes: 0,
      totalRows: 0,
      oldestRefresh: null,
      newestRefresh: null,
    };
  }
}

/**
 * Run comprehensive health check
 */
export async function runHealthCheck(): Promise<{
  systemHealth: Awaited<ReturnType<typeof calculateSystemHealth>>;
  dbStats: Awaited<ReturnType<typeof getViewDatabaseStats>>;
  alerts: MonitorAlert[];
}> {
  const [systemHealth, dbStats] = await Promise.all([
    calculateSystemHealth(),
    getViewDatabaseStats(),
  ]);

  // Check all tenants with active views
  const allAlerts: MonitorAlert[] = [];
  for (const [tenantId] of viewMetrics) {
    const tenantAlerts = await checkViewHealth(tenantId.split("_")[0]!);
    allAlerts.push(...tenantAlerts);
  }

  return {
    systemHealth,
    dbStats,
    alerts: allAlerts,
  };
}

/**
 * Clear old metrics (for maintenance)
 */
export function clearOldMetrics(daysOld: number = 30): void {
  const cutoff = Date.now() - daysOld * 24 * 60 * 60 * 1000;

  for (const [key, metrics] of viewMetrics) {
    if (metrics.lastQueryAt && metrics.lastQueryAt.getTime() < cutoff) {
      viewMetrics.delete(key);
    }
  }

  // Clear old alerts
  const cutoffDate = new Date(cutoff);
  for (let i = alerts.length - 1; i >= 0; i--) {
    if (alerts[i]!.createdAt < cutoffDate) {
      alerts.splice(i, 1);
    }
  }

  logInfo("Cleared old metrics", {
    remainingMetrics: viewMetrics.size,
    remainingAlerts: alerts.length,
  });
}
