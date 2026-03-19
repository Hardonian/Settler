/**
 * SLO Alerting Types
 *
 * Defines types for per-tenant SLO alerting infrastructure
 * Monitors: usage.api.latency_ms, usage.api.query_rows, usage.export.duration_ms
 */

// Metric types we're monitoring
export type SLOMetricType =
  | "usage.api.latency_ms"
  | "usage.api.query_rows"
  | "usage.export.duration_ms";

// Percentile types
export type PercentileType = "p50" | "p90" | "p95" | "p99";

// Alert severity levels
export type AlertSeverity = "info" | "warning" | "critical";

// SLO configuration for a tenant
export interface SLOConfig {
  id: string;
  tenantId: string;
  metricType: SLOMetricType;

  // Thresholds
  thresholdWarning: number;
  thresholdCritical: number;

  // Percentile-based thresholds (optional)
  percentileThreshold?: {
    p50?: number;
    p90?: number;
    p95?: number;
    p99?: number;
  };

  // Drift detection settings
  driftDetection?: {
    enabled: boolean;
    sensitivity: "low" | "medium" | "high";
    windowSize: number; // number of data points to compare
    deviationThreshold: number; // percentage deviation to trigger
  };

  // Configuration
  enabled: boolean;
  evaluationInterval: number; // in minutes
  createdAt: Date;
  updatedAt: Date;
}

// Recorded metric data point
export interface MetricDataPoint {
  id: string;
  tenantId: string;
  metricType: SLOMetricType;
  value: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// Aggregated percentile values
export interface PercentileValues {
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
  count: number;
  sum: number;
  avg: number;
}

// Time-windowed metric summary
export interface MetricSummary {
  tenantId: string;
  metricType: SLOMetricType;
  windowStart: Date;
  windowEnd: Date;
  percentiles: PercentileValues;
  thresholdWarning: number;
  thresholdCritical: number;
  sampleCount: number;
}

// Drift detection result
export interface DriftDetectionResult {
  tenantId: string;
  metricType: SLOMetricType;
  detected: boolean;
  type: "percentile_shift" | "distribution_anomaly" | "trend_change";
  severity: AlertSeverity;
  description: string;
  previousValues: PercentileValues;
  currentValues: PercentileValues;
  deviation: number;
  timestamp: Date;
}

// SLO Alert
export interface SLOAlert {
  id: string;
  tenantId: string;
  metricType: SLOMetricType;
  alertType: "threshold_breach" | "drift_detected" | "percentile_breach";
  severity: AlertSeverity;

  // Alert details
  message: string;
  currentValue?: number;
  threshold?: number;
  percentile?: PercentileType;

  // Drift info (if applicable)
  driftResult?: DriftDetectionResult;

  // Status
  status: "firing" | "acknowledged" | "resolved";
  triggeredAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;

  // Links
  runbookUrl?: string;
  dashboardUrl?: string;
}

// Alert rule configuration
export interface SLOAlertRule {
  id: string;
  tenantId: string;
  name: string;
  metricType: SLOMetricType;

  // Conditions
  conditionType: "threshold" | "percentile" | "drift";
  threshold?: number;
  percentile?: PercentileType;
  driftEnabled?: boolean;

  // Severity mapping
  warningSeverity: AlertSeverity;
  criticalSeverity: AlertSeverity;

  // Actions
  channels: AlertChannel[];
  enabled: boolean;

  createdAt: Date;
  updatedAt: Date;
}

// Alert notification channels
export type AlertChannel =
  | { type: "email"; address: string }
  | { type: "slack"; webhookUrl: string; channel: string }
  | { type: "pagerduty"; integrationKey: string }
  | { type: "webhook"; url: string; headers?: Record<string, string> };

// Historical trend data
export interface TrendDataPoint {
  timestamp: Date;
  value: number;
  percentiles: PercentileValues;
}

// Alert summary for dashboard
export interface AlertSummary {
  tenantId: string;
  totalAlerts: number;
  activeAlerts: number;
  criticalAlerts: number;
  warningAlerts: number;
  resolvedToday: number;
  byMetric: Record<
    SLOMetricType,
    {
      total: number;
      active: number;
    }
  >;
}

// Dashboard metric summary
export interface DashboardMetricSummary {
  tenantId: string;
  metricType: SLOMetricType;
  currentPercentiles: PercentileValues;
  thresholds: {
    warning: number;
    critical: number;
  };
  status: "healthy" | "warning" | "critical";
  trend: "improving" | "stable" | "degrading";
  lastUpdated: Date;
  alertCount: number;
}

// Default SLO thresholds (can be overridden per tenant)
export const DEFAULT_SLO_THRESHOLDS: Record<SLOMetricType, { warning: number; critical: number }> =
  {
    "usage.api.latency_ms": {
      warning: 1000, // 1 second
      critical: 2000, // 2 seconds
    },
    "usage.api.query_rows": {
      warning: 10000, // 10k rows
      critical: 50000, // 50k rows
    },
    "usage.export.duration_ms": {
      warning: 60000, // 1 minute
      critical: 300000, // 5 minutes
    },
  };

// Default percentile thresholds
export const DEFAULT_PERCENTILE_THRESHOLDS: Record<SLOMetricType, PercentileValues> = {
  "usage.api.latency_ms": {
    p50: 200,
    p90: 500,
    p95: 800,
    p99: 1500,
    min: 0,
    max: 0,
    count: 0,
    sum: 0,
    avg: 0,
  },
  "usage.api.query_rows": {
    p50: 100,
    p90: 1000,
    p95: 5000,
    p99: 10000,
    min: 0,
    max: 0,
    count: 0,
    sum: 0,
    avg: 0,
  },
  "usage.export.duration_ms": {
    p50: 5000,
    p90: 30000,
    p95: 60000,
    p99: 180000,
    min: 0,
    max: 0,
    count: 0,
    sum: 0,
    avg: 0,
  },
};
