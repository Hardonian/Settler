/**
 * Materialized View Configuration System
 *
 * Defines types and interfaces for tenant opt-in materialized view support.
 * This system allows tenants to enable pre-aggregation layers for:
 * - Large analytical windows
 * - High-frequency repeated query patterns
 * - Configurable refresh schedules
 */

import { z } from "zod";

// ============================================================================
// Refresh Schedule Types
// ============================================================================

export type RefreshStrategy = "manual" | "automatic" | "cron";

export const RefreshStrategySchema = z.enum(["manual", "automatic", "cron"]);

// Schedule configuration for different refresh strategies
export interface ManualRefreshConfig {
  strategy: "manual";
}

export interface AutomaticRefreshConfig {
  strategy: "automatic";
  /** Refresh interval in minutes */
  intervalMinutes: number;
  /** Maximum staleness allowed before auto-refresh (minutes) */
  maxStalenessMinutes: number;
}

export interface CronRefreshConfig {
  strategy: "cron";
  /** Cron expression for scheduling */
  cronExpression: string;
  /** Timezone for cron execution */
  timezone?: string;
}

export type RefreshConfig = ManualRefreshConfig | AutomaticRefreshConfig | CronRefreshConfig;

// ============================================================================
// Materialized View Definition Types
// ============================================================================

export type ViewAggregationType = "count" | "sum" | "avg" | "min" | "max";

export type ViewTimeBucket = "minute" | "hour" | "day" | "week" | "month" | "quarter" | "year";

export interface ViewColumn {
  name: string;
  type: string;
  aggregation?: ViewAggregationType;
  isGroupBy?: boolean;
}

export interface ViewTimeBucketConfig {
  column: string;
  bucket: ViewTimeBucket;
}

export interface MaterializedViewDefinition {
  /** Unique identifier for the view */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of the view's purpose */
  description: string;
  /** Source table(s) to aggregate from */
  sourceTables: string[];
  /** Columns in the materialized view */
  columns: ViewColumn[];
  /** Time bucket configuration for time-series aggregations */
  timeBucket?: ViewTimeBucketConfig;
  /** WHERE clause filter (base filter applied to all queries) */
  baseFilter?: string;
  /** GROUP BY columns */
  groupByColumns: string[];
  /** Whether this view supports incremental refresh */
  supportsIncremental: boolean;
  /** Typical query patterns this view optimizes */
  optimizedQueryPatterns: string[];
}

// ============================================================================
// Tenant Configuration
// ============================================================================

export interface TenantMaterializedViewConfig {
  /** Tenant ID */
  tenantId: string;
  /** Whether materialized views are enabled for this tenant */
  enabled: boolean;
  /** Maximum number of materialized views the tenant can have */
  maxViews: number;
  /** Current views configured for this tenant */
  views: TenantViewConfig[];
  /** Default refresh strategy for new views */
  defaultRefreshStrategy: RefreshStrategy;
  /** Tenant-specific settings */
  settings: TenantViewSettings;
}

export interface TenantViewConfig {
  /** Reference to the view definition */
  viewId: string;
  /** Whether this specific view is active */
  active: boolean;
  /** Refresh configuration for this view */
  refreshConfig: RefreshConfig;
  /** Custom filter for this tenant's data */
  tenantFilter?: string;
  /** Last refresh timestamp */
  lastRefreshedAt?: Date;
  /** Current staleness status */
  stalenessStatus: "fresh" | "stale" | "stale_overdue";
  /** Created at timestamp */
  createdAt: Date;
  /** Updated at timestamp */
  updatedAt: Date;
}

export interface TenantViewSettings {
  /** Enable query rewriting to use materialized views */
  enableQueryRewriting: boolean;
  /** Allow stale data for read queries */
  allowStaleData: boolean;
  /** Maximum acceptable staleness in minutes (for allowStaleData) */
  maxAcceptableStalenessMinutes: number;
  /** Enable incremental refresh where possible */
  preferIncrementalRefresh: boolean;
  /** Notify on refresh failures */
  notifyOnRefreshFailure: boolean;
  /** Email for notifications */
  notificationEmail?: string;
}

// ============================================================================
// Common Analytics View Templates
// ============================================================================

export const COMMON_VIEW_TEMPLATES: MaterializedViewDefinition[] = [
  {
    id: "daily_execution_count",
    name: "Daily Execution Counts",
    description: "Count of reconciliation executions per day per job",
    sourceTables: ["executions"],
    columns: [
      { name: "date", type: "date", isGroupBy: true },
      { name: "job_id", type: "uuid", isGroupBy: true },
      { name: "execution_count", type: "bigint", aggregation: "count" },
    ],
    timeBucket: { column: "started_at", bucket: "day" },
    groupByColumns: ["date", "job_id"],
    supportsIncremental: true,
    optimizedQueryPatterns: [
      "count executions by day",
      "daily execution trends",
      "execution volume by job",
    ],
  },
  {
    id: "daily_execution_status",
    name: "Daily Execution Status Counts",
    description: "Count of executions by status per day",
    sourceTables: ["executions"],
    columns: [
      { name: "date", type: "date", isGroupBy: true },
      { name: "status", type: "varchar", isGroupBy: true },
      { name: "count", type: "bigint", aggregation: "count" },
    ],
    timeBucket: { column: "started_at", bucket: "day" },
    groupByColumns: ["date", "status"],
    supportsIncremental: true,
    optimizedQueryPatterns: [
      "execution success rate",
      "failed executions by day",
      "execution status distribution",
    ],
  },
  {
    id: "hourly_match_stats",
    name: "Hourly Match Statistics",
    description: "Match counts and confidence scores aggregated hourly",
    sourceTables: ["matches"],
    columns: [
      { name: "hour", type: "timestamp", isGroupBy: true },
      { name: "total_matches", type: "bigint", aggregation: "count" },
      { name: "high_confidence_count", type: "bigint", aggregation: "count" },
      { name: "avg_confidence", type: "decimal", aggregation: "avg" },
    ],
    timeBucket: { column: "created_at", bucket: "hour" },
    groupByColumns: ["hour"],
    supportsIncremental: true,
    optimizedQueryPatterns: [
      "match trends over time",
      "confidence score trends",
      "hourly match volume",
    ],
  },
  {
    id: "daily_export_summary",
    name: "Daily Export Summary",
    description: "Daily export counts and sizes per tenant",
    sourceTables: ["exports"],
    columns: [
      { name: "date", type: "date", isGroupBy: true },
      { name: "export_count", type: "bigint", aggregation: "count" },
      { name: "total_records", type: "bigint", aggregation: "sum" },
      { name: "total_size_bytes", type: "bigint", aggregation: "sum" },
    ],
    timeBucket: { column: "created_at", bucket: "day" },
    groupByColumns: ["date"],
    supportsIncremental: true,
    optimizedQueryPatterns: ["export volume by day", "export trends", "daily export statistics"],
  },
  {
    id: "weekly_rolling_match_rate",
    name: "Weekly Rolling Match Rate",
    description: "Rolling weekly match rate calculation",
    sourceTables: ["matches", "executions"],
    columns: [
      { name: "week_start", type: "date", isGroupBy: true },
      { name: "total_records", type: "bigint", aggregation: "count" },
      { name: "matched_records", type: "bigint", aggregation: "count" },
      { name: "match_rate", type: "decimal", aggregation: "avg" },
    ],
    timeBucket: { column: "created_at", bucket: "week" },
    groupByColumns: ["week_start"],
    supportsIncremental: false,
    optimizedQueryPatterns: ["weekly match rate", "match rate trends", "rolling match statistics"],
  },
  {
    id: "daily_user_activity",
    name: "Daily User Activity",
    description: "Daily active users and their activity counts",
    sourceTables: ["analytics_events"],
    columns: [
      { name: "date", type: "date", isGroupBy: true },
      { name: "active_users", type: "bigint", aggregation: "count" },
      { name: "total_events", type: "bigint", aggregation: "count" },
    ],
    timeBucket: { column: "created_at", bucket: "day" },
    groupByColumns: ["date"],
    supportsIncremental: true,
    optimizedQueryPatterns: ["daily active users", "user engagement metrics", "activity trends"],
  },
  {
    id: "job_performance_summary",
    name: "Job Performance Summary",
    description: "Execution time and success metrics per job",
    sourceTables: ["executions"],
    columns: [
      { name: "job_id", type: "uuid", isGroupBy: true },
      { name: "date", type: "date", isGroupBy: true },
      { name: "execution_count", type: "bigint", aggregation: "count" },
      { name: "avg_duration_ms", type: "decimal", aggregation: "avg" },
      { name: "min_duration_ms", type: "decimal", aggregation: "min" },
      { name: "max_duration_ms", type: "decimal", aggregation: "max" },
      { name: "success_rate", type: "decimal", aggregation: "avg" },
    ],
    timeBucket: { column: "started_at", bucket: "day" },
    groupByColumns: ["job_id", "date"],
    supportsIncremental: true,
    optimizedQueryPatterns: [
      "job performance over time",
      "execution duration trends",
      "job success metrics",
    ],
  },
  {
    id: "monthly_revenue_aggregation",
    name: "Monthly Revenue Aggregation",
    description: "Monthly revenue metrics per tenant",
    sourceTables: ["subscriptions", "invoices"],
    columns: [
      { name: "month", type: "date", isGroupBy: true },
      { name: "total_revenue", type: "decimal", aggregation: "sum" },
      { name: "invoice_count", type: "bigint", aggregation: "count" },
      { name: "avg_invoice_value", type: "decimal", aggregation: "avg" },
    ],
    timeBucket: { column: "created_at", bucket: "month" },
    groupByColumns: ["month"],
    supportsIncremental: true,
    optimizedQueryPatterns: ["monthly revenue", "revenue trends", "invoice analytics"],
  },
];

// ============================================================================
// Default Configurations
// ============================================================================

export const DEFAULT_TENANT_VIEW_SETTINGS: TenantViewSettings = {
  enableQueryRewriting: true,
  allowStaleData: false,
  maxAcceptableStalenessMinutes: 30,
  preferIncrementalRefresh: true,
  notifyOnRefreshFailure: true,
};

export const DEFAULT_REFRESH_CONFIGS: Record<RefreshStrategy, RefreshConfig> = {
  manual: { strategy: "manual" },
  automatic: {
    strategy: "automatic",
    intervalMinutes: 60,
    maxStalenessMinutes: 120,
  },
  cron: {
    strategy: "cron",
    cronExpression: "0 * * * *", // Hourly by default
    timezone: "UTC",
  },
};

// ============================================================================
// Validation Functions
// ============================================================================

export function isValidCronExpression(expression: string): boolean {
  // Basic cron validation - 5 fields: minute hour day month weekday
  const cronRegex =
    /^(\*|(\d+(-\d+)?)(,\d+(-\d+)?)*)\s+(\*|(\d+(-\d+)?)(,\d+(-\d+)?)*)\s+(\*|(\d+(-\d+)?)(,\d+(-\d+)?)*)\s+(\*|(\d+(-\d+)?)(,\d+(-\d+)?)*)\s+(\*|(\d+(-\d+)?)(,\d+(-\d+)?)*)$/;
  return cronRegex.test(expression);
}

export function validateRefreshConfig(config: RefreshConfig): { valid: boolean; error?: string } {
  if (config.strategy === "automatic") {
    if (config.intervalMinutes < 1 || config.intervalMinutes > 1440) {
      return { valid: false, error: "Interval must be between 1 and 1440 minutes" };
    }
    if (config.maxStalenessMinutes < config.intervalMinutes) {
      return { valid: false, error: "Max staleness must be >= interval" };
    }
  }

  if (config.strategy === "cron") {
    if (!isValidCronExpression(config.cronExpression)) {
      return { valid: false, error: "Invalid cron expression" };
    }
  }

  return { valid: true };
}

export function getViewTemplate(id: string): MaterializedViewDefinition | undefined {
  return COMMON_VIEW_TEMPLATES.find((v) => v.id === id);
}
