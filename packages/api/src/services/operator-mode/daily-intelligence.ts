/**
 * Daily Intelligence Service
 * Aggregates key operational metrics for operator visibility
 */

import { query } from '../../db';
import { logInfo, logError } from '../../utils/logger';
import { httpRequestDuration, httpRequestErrors, httpRequestTotal } from '../../infrastructure/observability/metrics';

export interface DailyIntelligence {
  date: string;
  errorRate: {
    overall: number;
    byEndpoint: Array<{
      method: string;
      route: string;
      errorRate: number;
      errorCount: number;
      totalRequests: number;
    }>;
  };
  slowEndpoints: Array<{
    method: string;
    route: string;
    p50: number;
    p95: number;
    p99: number;
    requestCount: number;
  }>;
  failedIngestions: Array<{
    ingestionId: string;
    sourceId: string;
    tenantId: string;
    errorMessage: string;
    failedAt: string;
    traceId?: string;
  }>;
  billingAnomalies: Array<{
    tenantId: string;
    billingAccountId: string;
    anomalyType: 'usage_spike' | 'cost_spike' | 'unexpected_charge';
    currentValue: number;
    expectedValue: number;
    percentageChange: number;
    detectedAt: string;
  }>;
}

/**
 * Get error rate summary for the last 24 hours
 */
export async function getErrorRateSummary(date: Date = new Date()): Promise<DailyIntelligence['errorRate']> {
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  try {
    // Get error rates from audit logs
    const errorStats = await query<{
      method: string;
      path: string;
      error_count: number;
      total_count: number;
    }>(
      `SELECT 
        method,
        path,
        COUNT(*) FILTER (WHERE status_code >= 400) as error_count,
        COUNT(*) as total_count
      FROM audit_logs
      WHERE timestamp >= $1 AND timestamp <= $2
        AND method IS NOT NULL
        AND path IS NOT NULL
      GROUP BY method, path
      ORDER BY error_count DESC
      LIMIT 50`,
      [startDate, endDate]
    );

    let totalErrors = 0;
    let totalRequests = 0;

    const byEndpoint = errorStats.map(stat => {
      totalErrors += Number(stat.error_count);
      totalRequests += Number(stat.total_count);
      return {
        method: stat.method,
        route: stat.path,
        errorRate: Number(stat.total_count) > 0 
          ? Number(stat.error_count) / Number(stat.total_count) 
          : 0,
        errorCount: Number(stat.error_count),
        totalRequests: Number(stat.total_count),
      };
    });

    return {
      overall: totalRequests > 0 ? totalErrors / totalRequests : 0,
      byEndpoint,
    };
  } catch (error) {
    logError('Failed to get error rate summary', error);
    return { overall: 0, byEndpoint: [] };
  }
}

/**
 * Get slow endpoints (P50, P95, P99 latencies)
 */
export async function getSlowEndpoints(date: Date = new Date()): Promise<DailyIntelligence['slowEndpoints']> {
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  try {
    // Get latency stats from audit logs (if we're tracking duration)
    // For now, we'll use a simplified approach based on status codes and timestamps
    // In production, you'd want to track actual request durations
    
    const endpointStats = await query<{
      method: string;
      path: string;
      request_count: number;
      avg_duration_ms: number;
    }>(
      `SELECT 
        method,
        path,
        COUNT(*) as request_count,
        AVG(EXTRACT(EPOCH FROM (updated_at - timestamp)) * 1000) as avg_duration_ms
      FROM audit_logs
      WHERE timestamp >= $1 AND timestamp <= $2
        AND method IS NOT NULL
        AND path IS NOT NULL
        AND status_code < 400
      GROUP BY method, path
      HAVING COUNT(*) >= 10
      ORDER BY avg_duration_ms DESC
      LIMIT 20`,
      [startDate, endDate]
    );

    // For now, we'll estimate percentiles based on average
    // In production, you'd want to store actual histogram data
    return endpointStats.map(stat => ({
      method: stat.method,
      route: stat.path,
      p50: Number(stat.avg_duration_ms) * 0.7, // Estimate
      p95: Number(stat.avg_duration_ms) * 1.5, // Estimate
      p99: Number(stat.avg_duration_ms) * 2.0, // Estimate
      requestCount: Number(stat.request_count),
    }));
  } catch (error) {
    logError('Failed to get slow endpoints', error);
    return [];
  }
}

/**
 * Get failed ingestions for the last 24 hours
 */
export async function getFailedIngestions(date: Date = new Date()): Promise<DailyIntelligence['failedIngestions']> {
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  try {
    const failed = await query<{
      id: string;
      source_id: string;
      tenant_id: string;
      error_message: string;
      updated_at: Date;
      trace_id: string | null;
    }>(
      `SELECT 
        id,
        source_id,
        tenant_id,
        error_message,
        updated_at,
        trace_id
      FROM ingestions
      WHERE status = 'failed'
        AND updated_at >= $1 AND updated_at <= $2
      ORDER BY updated_at DESC
      LIMIT 100`,
      [startDate, endDate]
    );

    return failed.map(ingestion => ({
      ingestionId: ingestion.id,
      sourceId: ingestion.source_id,
      tenantId: ingestion.tenant_id,
      errorMessage: ingestion.error_message || 'Unknown error',
      failedAt: ingestion.updated_at.toISOString(),
      traceId: ingestion.trace_id || undefined,
    }));
  } catch (error) {
    logError('Failed to get failed ingestions', error);
    return [];
  }
}

/**
 * Detect billing anomalies
 */
export async function getBillingAnomalies(date: Date = new Date()): Promise<DailyIntelligence['billingAnomalies']> {
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  try {
    // Get usage aggregates for today
    const todayUsage = await query<{
      billing_account_id: string;
      tenant_id: string;
      total_quantity: number;
      event_type: string;
    }>(
      `SELECT 
        billing_account_id,
        tenant_id,
        SUM(total_quantity) as total_quantity,
        event_type
      FROM usage_aggregate_daily
      WHERE date = $1
      GROUP BY billing_account_id, tenant_id, event_type`,
      [date.toISOString().split('T')[0]]
    );

    // Get average usage for the last 7 days (excluding today)
    const historicalAvg = await query<{
      billing_account_id: string;
      tenant_id: string;
      avg_quantity: number;
      event_type: string;
    }>(
      `SELECT 
        billing_account_id,
        tenant_id,
        AVG(total_quantity) as avg_quantity,
        event_type
      FROM usage_aggregate_daily
      WHERE date >= $1 AND date < $2
      GROUP BY billing_account_id, tenant_id, event_type`,
      [
        new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        date.toISOString().split('T')[0],
      ]
    );

    const anomalies: DailyIntelligence['billingAnomalies'] = [];

    for (const today of todayUsage) {
      const historical = historicalAvg.find(
        h => h.billing_account_id === today.billing_account_id &&
             h.tenant_id === today.tenant_id &&
             h.event_type === today.event_type
      );

      if (historical && Number(historical.avg_quantity) > 0) {
        const currentValue = Number(today.total_quantity);
        const expectedValue = Number(historical.avg_quantity);
        const percentageChange = ((currentValue - expectedValue) / expectedValue) * 100;

        // Flag if usage is 200% higher than average (spike)
        if (percentageChange > 200) {
          anomalies.push({
            tenantId: today.tenant_id,
            billingAccountId: today.billing_account_id,
            anomalyType: 'usage_spike',
            currentValue,
            expectedValue,
            percentageChange,
            detectedAt: new Date().toISOString(),
          });
        }
      }
    }

    return anomalies;
  } catch (error) {
    logError('Failed to get billing anomalies', error);
    return [];
  }
}

/**
 * Generate daily intelligence report
 */
export async function generateDailyIntelligence(date: Date = new Date()): Promise<DailyIntelligence> {
  logInfo('Generating daily intelligence report', { date: date.toISOString() });

  const [errorRate, slowEndpoints, failedIngestions, billingAnomalies] = await Promise.all([
    getErrorRateSummary(date),
    getSlowEndpoints(date),
    getFailedIngestions(date),
    getBillingAnomalies(date),
  ]);

  const intelligence: DailyIntelligence = {
    date: date.toISOString().split('T')[0],
    errorRate,
    slowEndpoints,
    failedIngestions,
    billingAnomalies,
  };

  logInfo('Daily intelligence report generated', {
    date: intelligence.date,
    errorRate: intelligence.errorRate.overall,
    slowEndpointsCount: intelligence.slowEndpoints.length,
    failedIngestionsCount: intelligence.failedIngestions.length,
    billingAnomaliesCount: intelligence.billingAnomalies.length,
  });

  return intelligence;
}
