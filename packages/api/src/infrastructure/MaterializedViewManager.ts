/**
 * Materialized View Manager
 *
 * Handles creation, refresh, and management of materialized views
 * for tenant analytics optimization.
 */

import { query, queryWithTenant, pool } from "../db";
import { logInfo, logError, logWarn } from "../utils/logger";
import {
  MaterializedViewDefinition,
  TenantMaterializedViewConfig,
  TenantViewConfig,
  RefreshConfig,
  COMMON_VIEW_TEMPLATES,
  DEFAULT_REFRESH_CONFIGS,
  DEFAULT_TENANT_VIEW_SETTINGS,
  RefreshStrategy,
  validateRefreshConfig,
  TenantViewSettings,
} from "./MaterializedViewConfig";

export interface MaterializedViewStatus {
  viewName: string;
  exists: boolean;
  rowCount: number;
  lastRefreshedAt: Date | null;
  staleness: "fresh" | "stale" | "unknown";
}

export interface RefreshResult {
  success: boolean;
  viewName: string;
  rowsAffected: number;
  durationMs: number;
  error?: string;
  incremental: boolean;
}

// In-memory store for tenant configurations (in production, persist to DB)
export const tenantConfigs = new Map<string, TenantMaterializedViewConfig>();

/**
 * Generate the materialized view name for a tenant
 */
export function getMaterializedViewName(tenantId: string, viewId: string): string {
  // Sanitize tenant ID to be SQL-safe
  const sanitizedTenant = tenantId.replace(/[^a-zA-Z0-9]/g, "_");
  return `mv_${sanitizedTenant}_${viewId}`;
}

/**
 * Generate the CREATE MATERIALIZED VIEW SQL for a view definition
 */
export function generateCreateViewSQL(
  tenantId: string,
  viewDefinition: MaterializedViewDefinition,
  tenantFilter?: string
): string {
  const viewName = getMaterializedViewName(tenantId, viewDefinition.id);

  // Build column definitions
  const columnDefs = viewDefinition.columns
    .map((col) => {
      const agg = col.aggregation ? `${col.aggregation.toUpperCase()}(${col.name})` : col.name;
      return `  ${col.name}`;
    })
    .join(",\n");

  // Build SELECT with aggregations
  const selectColumns = viewDefinition.columns
    .map((col) => {
      if (col.isGroupBy) {
        return `  ${col.name}`;
      }
      if (col.aggregation === "count") {
        return `  COUNT(*) AS ${col.name}`;
      }
      if (col.aggregation === "sum") {
        return `  SUM(${col.name}) AS ${col.name}`;
      }
      if (col.aggregation === "avg") {
        return `  AVG(${col.name}) AS ${col.name}`;
      }
      if (col.aggregation === "min") {
        return `  MIN(${col.name}) AS ${col.name}`;
      }
      if (col.aggregation === "max") {
        return `  MAX(${col.name}) AS ${col.name}`;
      }
      return `  ${col.name}`;
    })
    .join(",\n");

  // Build time bucket expression
  let timeBucketExpr = "";
  if (viewDefinition.timeBucket) {
    const bucket = viewDefinition.timeBucket.bucket;
    const col = viewDefinition.timeBucket.column;
    const bucketExpr = `DATE_TRUNC('${bucket}', ${col})`;

    // Add time bucket to SELECT and GROUP BY if not already present
    if (!selectColumns.includes(bucketExpr)) {
      // Replace the time column with truncated version
      const timeColDef = viewDefinition.columns.find(
        (c) => c.name === viewDefinition.timeBucket?.column
      );
      if (timeColDef) {
        // Modify the column in the select
      }
    }
  }

  // Build WHERE clause
  const filters: string[] = [];
  if (viewDefinition.baseFilter) {
    filters.push(viewDefinition.baseFilter);
  }
  if (tenantFilter) {
    filters.push(tenantFilter);
  }
  // Always filter by tenant_id for tenant-scoped tables
  filters.push(`tenant_id = '${tenantId}'`);

  const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

  // Build GROUP BY
  const groupBy = viewDefinition.groupByColumns.join(", ");

  const sourceTable = viewDefinition.sourceTables[0];

  return `CREATE MATERIALIZED VIEW ${viewName} AS
SELECT
${selectColumns}
FROM ${sourceTable}
${whereClause}
${groupBy ? `GROUP BY ${groupBy}` : ""}
WITH DATA`;
}

/**
 * Generate refresh SQL for a materialized view
 */
export function generateRefreshSQL(
  tenantId: string,
  viewId: string,
  incremental: boolean = false
): string {
  const viewName = getMaterializedViewName(tenantId, viewId);

  if (incremental) {
    return `REFRESH MATERIALIZED VIEW CONCURRENTLY ${viewName}`;
  }
  return `REFRESH MATERIALIZED VIEW ${viewName}`;
}

/**
 * Check if a materialized view exists
 */
export async function checkViewExists(tenantId: string, viewId: string): Promise<boolean> {
  const viewName = getMaterializedViewName(tenantId, viewId);

  try {
    const result = await query(`SELECT 1 FROM pg_matviews WHERE matviewname = $1`, [viewName]);
    return result.length > 0;
  } catch (error) {
    logError("Failed to check view existence", { viewName, error });
    return false;
  }
}

/**
 * Get materialized view status
 */
export async function getViewStatus(
  tenantId: string,
  viewId: string
): Promise<MaterializedViewStatus> {
  const viewName = getMaterializedViewName(tenantId, viewId);

  try {
    const result = await query<{
      rowcount: string;
      lastrefresh: string | null;
    }>(
      `SELECT 
        pg_get_serial_sequence('${viewName}', 'ctid') as seq,
        (SELECT COUNT(*) FROM ${viewName}) as rowcount,
        lastrefresh::timestamp as lastrefresh
      FROM pg_matviews 
      WHERE matviewname = $1`,
      [viewName]
    );

    if (result.length === 0) {
      return {
        viewName,
        exists: false,
        rowCount: 0,
        lastRefreshedAt: null,
        staleness: "unknown",
      };
    }

    const row0 = result[0]!;
    const lastRefreshed = row0.lastrefresh ? new Date(row0.lastrefresh) : null;

    let staleness: "fresh" | "stale" | "unknown" = "unknown";
    if (lastRefreshed) {
      const staleThreshold = new Date(Date.now() - 60 * 60 * 1000); // 1 hour default
      staleness = lastRefreshed > staleThreshold ? "fresh" : "stale";
    }

    return {
      viewName,
      exists: true,
      rowCount: parseInt(row0.rowcount || "0"),
      lastRefreshedAt: lastRefreshed,
      staleness,
    };
  } catch (error) {
    logError("Failed to get view status", { viewName, error });
    return {
      viewName,
      exists: false,
      rowCount: 0,
      lastRefreshedAt: null,
      staleness: "unknown",
    };
  }
}

/**
 * Create a materialized view for a tenant
 */
export async function createMaterializedView(
  tenantId: string,
  viewDefinition: MaterializedViewDefinition,
  tenantFilter?: string
): Promise<{ success: boolean; viewName: string; error?: string }> {
  const viewName = getMaterializedViewName(tenantId, viewDefinition.id);

  // Check if view already exists
  const exists = await checkViewExists(tenantId, viewDefinition.id);
  if (exists) {
    logWarn("Materialized view already exists", { viewName });
    return { success: true, viewName };
  }

  const createSQL = generateCreateViewSQL(tenantId, viewDefinition, tenantFilter);

  try {
    await query(createSQL);
    logInfo("Created materialized view", { viewName });
    return { success: true, viewName };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError("Failed to create materialized view", { viewName, error: errorMessage });
    return { success: false, viewName, error: errorMessage };
  }
}

/**
 * Refresh a materialized view
 */
export async function refreshMaterializedView(
  tenantId: string,
  viewId: string,
  incremental: boolean = false
): Promise<RefreshResult> {
  const viewName = getMaterializedViewName(tenantId, viewId);
  const startTime = Date.now();

  // Check if view exists
  const exists = await checkViewExists(tenantId, viewId);
  if (!exists) {
    return {
      success: false,
      viewName,
      rowsAffected: 0,
      durationMs: 0,
      error: "View does not exist",
      incremental,
    };
  }

  const refreshSQL = generateRefreshSQL(tenantId, viewId, incremental);

  try {
    await query(refreshSQL);
    const durationMs = Date.now() - startTime;

    logInfo("Refreshed materialized view", { viewName, durationMs, incremental });
    return {
      success: true,
      viewName,
      rowsAffected: 0, // pg doesn't return count for REFRESH
      durationMs,
      incremental,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const durationMs = Date.now() - startTime;

    logError("Failed to refresh materialized view", { viewName, error: errorMessage });
    return {
      success: false,
      viewName,
      rowsAffected: 0,
      durationMs,
      error: errorMessage,
      incremental,
    };
  }
}

/**
 * Drop a materialized view
 */
export async function dropMaterializedView(
  tenantId: string,
  viewId: string
): Promise<{ success: boolean; error?: string }> {
  const viewName = getMaterializedViewName(tenantId, viewId);

  try {
    await query(`DROP MATERIALIZED VIEW IF EXISTS ${viewName}`);
    logInfo("Dropped materialized view", { viewName });
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError("Failed to drop materialized view", { viewName, error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

// ============================================================================
// Tenant Configuration Management
// ============================================================================

/**
 * Get tenant materialized view configuration
 */
export function getTenantConfig(tenantId: string): TenantMaterializedViewConfig | undefined {
  return tenantConfigs.get(tenantId);
}

/**
 * Initialize or update tenant configuration
 */
export function setTenantConfig(config: TenantMaterializedViewConfig): void {
  tenantConfigs.set(config.tenantId, config);
}

/**
 * Enable materialized views for a tenant
 */
export async function enableMaterializedViews(
  tenantId: string,
  maxViews: number = 10,
  defaultStrategy: RefreshStrategy = "automatic"
): Promise<TenantMaterializedViewConfig> {
  let config = tenantConfigs.get(tenantId);

  if (config) {
    config.enabled = true;
    config.maxViews = maxViews;
    config.defaultRefreshStrategy = defaultStrategy;
  } else {
    config = {
      tenantId,
      enabled: true,
      maxViews,
      views: [],
      defaultRefreshStrategy: defaultStrategy,
      settings: { ...DEFAULT_TENANT_VIEW_SETTINGS },
    };
  }

  tenantConfigs.set(tenantId, config);
  logInfo("Enabled materialized views for tenant", { tenantId, maxViews, defaultStrategy });

  return config;
}

/**
 * Disable materialized views for a tenant
 */
export function disableMaterializedViews(tenantId: string): void {
  const config = tenantConfigs.get(tenantId);
  if (config) {
    config.enabled = false;
    logInfo("Disabled materialized views for tenant", { tenantId });
  }
}

/**
 * Add a view to tenant configuration
 */
export function addViewToTenant(
  tenantId: string,
  viewId: string,
  refreshConfig?: RefreshConfig,
  tenantFilter?: string
): { success: boolean; error?: string } {
  const config = tenantConfigs.get(tenantId);
  if (!config) {
    return { success: false, error: "Tenant configuration not found" };
  }

  if (config.views.length >= config.maxViews) {
    return { success: false, error: `Maximum views limit (${config.maxViews}) reached` };
  }

  // Validate refresh config
  const finalRefreshConfig =
    refreshConfig || DEFAULT_REFRESH_CONFIGS[config.defaultRefreshStrategy];
  const validation = validateRefreshConfig(finalRefreshConfig);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const viewDef = COMMON_VIEW_TEMPLATES.find((v) => v.id === viewId);
  if (!viewDef) {
    return { success: false, error: `View template ${viewId} not found` };
  }

  const now = new Date();
  const tenantViewConfig: TenantViewConfig = {
    viewId,
    active: true,
    refreshConfig: finalRefreshConfig,
    tenantFilter,
    stalenessStatus: "fresh",
    createdAt: now,
    updatedAt: now,
  };

  config.views.push(tenantViewConfig);
  tenantConfigs.set(tenantId, config);

  logInfo("Added view to tenant config", { tenantId, viewId });
  return { success: true };
}

/**
 * Remove a view from tenant configuration
 */
export function removeViewFromTenant(
  tenantId: string,
  viewId: string
): { success: boolean; error?: string } {
  const config = tenantConfigs.get(tenantId);
  if (!config) {
    return { success: false, error: "Tenant configuration not found" };
  }

  const index = config.views.findIndex((v) => v.viewId === viewId);
  if (index === -1) {
    return { success: false, error: "View not found in tenant configuration" };
  }

  config.views.splice(index, 1);
  tenantConfigs.set(tenantId, config);

  logInfo("Removed view from tenant config", { tenantId, viewId });
  return { success: true };
}

/**
 * Update tenant view settings
 */
export function updateTenantViewSettings(
  tenantId: string,
  settings: Partial<TenantViewSettings>
): { success: boolean; error?: string } {
  const config = tenantConfigs.get(tenantId);
  if (!config) {
    return { success: false, error: "Tenant configuration not found" };
  }

  config.settings = { ...config.settings, ...settings };
  tenantConfigs.set(tenantId, config);

  logInfo("Updated tenant view settings", { tenantId, settings });
  return { success: true };
}

/**
 * Get all active views for a tenant
 */
export function getActiveTenantViews(tenantId: string): TenantViewConfig[] {
  const config = tenantConfigs.get(tenantId);
  if (!config || !config.enabled) {
    return [];
  }

  return config.views.filter((v) => v.active);
}

/**
 * Initialize default materialized view configuration for a new tenant
 */
export async function initializeTenantMaterializedViews(tenantId: string): Promise<void> {
  const config: TenantMaterializedViewConfig = {
    tenantId,
    enabled: false, // Disabled by default - tenants must opt-in
    maxViews: 10,
    views: [],
    defaultRefreshStrategy: "automatic",
    settings: { ...DEFAULT_TENANT_VIEW_SETTINGS },
  };

  tenantConfigs.set(tenantId, config);
  logInfo("Initialized materialized view config for tenant", { tenantId });
}
