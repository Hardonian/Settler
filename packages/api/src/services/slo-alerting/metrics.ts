/**
 * Metrics Collection Service
 *
 * Collects and stores metrics for SLO monitoring:
 * - usage.api.latency_ms - API latency in milliseconds
 * - usage.api.query_rows - Number of rows returned per query
 * - usage.export.duration_ms - Export job duration in milliseconds
 */

import { query } from "../../db";
import { logInfo, logError } from "../../utils/logger";
import { MetricDataPoint, MetricSummary, SLOMetricType, PercentileValues } from "./types";
import { calculatePercentiles } from "./percentiles";

/**
 * Record a metric data point
 */
export async function recordMetric(
  tenantId: string,
  metricType: SLOMetricType,
  value: number,
  metadata?: Record<string, unknown>
): Promise<string> {
  try {
    const result = await query<{ id: string }>(
      `INSERT INTO slo_metrics (tenant_id, metric_type, value, metadata, timestamp)
       VALUES ($1, $2, $3, $4, now())
       RETURNING id`,
      [tenantId, metricType, value, metadata ? JSON.stringify(metadata) : null]
    );

    const metricId = result[0]?.id || "";
    return metricId;
  } catch (error) {
    logError("Failed to record metric", error, { tenantId, metricType, value });
    throw error;
  }
}

/**
 * Record API latency metric
 */
export async function recordAPILatency(
  tenantId: string,
  latencyMs: number,
  metadata?: {
    endpoint?: string;
    method?: string;
    statusCode?: number;
    userId?: string;
  }
): Promise<string> {
  return recordMetric(tenantId, "usage.api.latency_ms", latencyMs, metadata);
}

/**
 * Record API query rows metric
 */
export async function recordAPIQueryRows(
  tenantId: string,
  rowCount: number,
  metadata?: {
    endpoint?: string;
    queryId?: string;
    userId?: string;
  }
): Promise<string> {
  return recordMetric(tenantId, "usage.api.query_rows", rowCount, metadata);
}

/**
 * Record export duration metric
 */
export async function recordExportDuration(
  tenantId: string,
  durationMs: number,
  metadata?: {
    exportId?: string;
    format?: string;
    recordCount?: number;
  }
): Promise<string> {
  return recordMetric(tenantId, "usage.export.duration_ms", durationMs, metadata);
}

/**
 * Get metrics for a time window
 */
export async function getMetricsInWindow(
  tenantId: string,
  metricType: SLOMetricType,
  windowStart: Date,
  windowEnd: Date
): Promise<MetricDataPoint[]> {
  try {
    const results = await query<Record<string, unknown>>(
      `SELECT id, tenant_id, metric_type, value, timestamp, metadata
       FROM slo_metrics
       WHERE tenant_id = $1 AND metric_type = $2
         AND timestamp >= $3 AND timestamp <= $4
       ORDER BY timestamp ASC`,
      [tenantId, metricType, windowStart.toISOString(), windowEnd.toISOString()]
    );

    return results.map((row) => ({
      id: row.id as string,
      tenantId: row.tenant_id as string,
      metricType: row.metric_type as SLOMetricType,
      value: row.value as number,
      timestamp: row.timestamp as Date,
      metadata: row.metadata as Record<string, unknown> | undefined,
    }));
  } catch (error) {
    logError("Failed to get metrics in window", error, { tenantId, metricType });
    throw error;
  }
}

/**
 * Get latest metrics count
 */
export async function getMetricsCount(
  tenantId: string,
  metricType: SLOMetricType,
  since: Date
): Promise<number> {
  try {
    const results = await query<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM slo_metrics
       WHERE tenant_id = $1 AND metric_type = $2 AND timestamp >= $3`,
      [tenantId, metricType, since.toISOString()]
    );

    return parseInt(results[0]?.count || "0", 10);
  } catch (error) {
    logError("Failed to get metrics count", error, { tenantId, metricType });
    throw error;
  }
}

/**
 * Calculate metric summary for a time window
 */
export async function calculateMetricSummary(
  tenantId: string,
  metricType: SLOMetricType,
  windowStart: Date,
  windowEnd: Date,
  thresholdWarning: number,
  thresholdCritical: number
): Promise<MetricSummary | null> {
  try {
    const metrics = await getMetricsInWindow(tenantId, metricType, windowStart, windowEnd);

    if (metrics.length === 0) {
      return null;
    }

    const values = metrics.map((m) => m.value);
    const percentiles = calculatePercentiles(values);

    return {
      tenantId,
      metricType,
      windowStart,
      windowEnd,
      percentiles,
      thresholdWarning,
      thresholdCritical,
      sampleCount: metrics.length,
    };
  } catch (error) {
    logError("Failed to calculate metric summary", error, { tenantId, metricType });
    throw error;
  }
}

/**
 * Get historical metric data for trend analysis
 */
export async function getHistoricalMetrics(
  tenantId: string,
  metricType: SLOMetricType,
  startDate: Date,
  endDate: Date,
  intervalMinutes: number = 60
): Promise<
  {
    timestamp: Date;
    percentiles: PercentileValues;
    sampleCount: number;
  }[]
> {
  try {
    // Generate time buckets
    const results: {
      timestamp: Date;
      percentiles: PercentileValues;
      sampleCount: number;
    }[] = [];

    let currentStart = new Date(startDate);
    while (currentStart < endDate) {
      const currentEnd = new Date(currentStart.getTime() + intervalMinutes * 60 * 1000);

      if (currentEnd > endDate) break;

      const metrics = await getMetricsInWindow(tenantId, metricType, currentStart, currentEnd);

      if (metrics.length > 0) {
        const values = metrics.map((m) => m.value);
        results.push({
          timestamp: currentStart,
          percentiles: calculatePercentiles(values),
          sampleCount: metrics.length,
        });
      }

      currentStart = currentEnd;
    }

    return results;
  } catch (error) {
    logError("Failed to get historical metrics", error, { tenantId, metricType });
    throw error;
  }
}

/**
 * Get latest metric value
 */
export async function getLatestMetric(
  tenantId: string,
  metricType: SLOMetricType
): Promise<MetricDataPoint | null> {
  try {
    const results = await query<Record<string, unknown>>(
      `SELECT id, tenant_id, metric_type, value, timestamp, metadata
       FROM slo_metrics
       WHERE tenant_id = $1 AND metric_type = $2
       ORDER BY timestamp DESC
       LIMIT 1`,
      [tenantId, metricType]
    );

    if (results.length === 0) {
      return null;
    }

    const row = results[0]!;
    return {
      id: row.id as string,
      tenantId: row.tenant_id as string,
      metricType: row.metric_type as SLOMetricType,
      value: row.value as number,
      timestamp: row.timestamp as Date,
      metadata: row.metadata as Record<string, unknown> | undefined,
    };
  } catch (error) {
    logError("Failed to get latest metric", error, { tenantId, metricType });
    throw error;
  }
}

/**
 * Clean up old metrics (retention policy)
 */
export async function cleanupOldMetrics(
  tenantId: string,
  retentionDays: number = 90
): Promise<number> {
  try {
    const result = await query<{ count: string }>(
      `DELETE FROM slo_metrics
       WHERE tenant_id = $1 AND timestamp < NOW() - INTERVAL '{$2} days'
       RETURNING COUNT(*)`,
      [tenantId, retentionDays]
    );

    const deleted = parseInt(result[0]?.count || "0", 10);
    logInfo("Cleaned up old metrics", { tenantId, deleted, retentionDays });
    return deleted;
  } catch (error) {
    logError("Failed to cleanup old metrics", error, { tenantId });
    throw error;
  }
}

/**
 * Bulk insert metrics (for batch processing)
 */
export async function bulkInsertMetrics(
  metrics: Array<{
    tenantId: string;
    metricType: SLOMetricType;
    value: number;
    timestamp?: Date;
    metadata?: Record<string, unknown>;
  }>
): Promise<number> {
  if (metrics.length === 0) return 0;

  try {
    // Use batch insert with multiple VALUES
    const values: string[] = [];
    const params: (string | number | boolean | null | Date | string[])[] = [];
    let paramIndex = 1;

    for (const metric of metrics) {
      values.push(
        `($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`
      );
      params.push(
        metric.tenantId,
        metric.metricType,
        metric.value,
        metric.timestamp?.toISOString() || new Date().toISOString(),
        metric.metadata ? JSON.stringify(metric.metadata) : null
      );
    }

    const result = await query<{ count: string }>(
      `INSERT INTO slo_metrics (tenant_id, metric_type, value, timestamp, metadata)
       VALUES ${values.join(", ")}
       RETURNING COUNT(*)`,
      params
    );

    const inserted = parseInt(result[0]?.count || "0", 10);
    logInfo("Bulk inserted metrics", { count: inserted });
    return inserted;
  } catch (error) {
    logError("Failed to bulk insert metrics", error);
    throw error;
  }
}
