/**
 * Usage Tracking Service
 * Tracks user usage for quota enforcement and upgrade nudges
 */

import { query } from "../../db";
import { logInfo } from "../../utils/logger";
import { trackUsageEvent } from "../analytics/events";
import { meterFromLegacyUsageMetric } from "./metering";

export interface UsageTracking {
  userId: string;
  tenantId: string;
  metricType: string;
  metricValue: number;
  periodStart: Date;
  periodEnd: Date;
}

/**
 * Track usage for a metric
 */
export async function trackUsage(
  userId: string,
  tenantId: string,
  metricType: string,
  increment: number = 1
): Promise<void> {
  try {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    await query(
      `INSERT INTO usage_tracking (user_id, tenant_id, metric_type, metric_value, period_start, period_end, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (user_id, metric_type, period_start) 
       DO UPDATE SET 
         metric_value = usage_tracking.metric_value + $4,
         updated_at = NOW()`,
      [userId, tenantId, metricType, increment, periodStart, periodEnd]
    );

    // Also track as analytics event
    await trackUsageEvent(userId, metricType, increment, { tenantId });

    await meterFromLegacyUsageMetric({
      tenantId,
      metricType,
      quantity: increment,
      metadata: { user_id: userId },
    });

    logInfo("Usage tracked", { userId, tenantId, metricType, increment });
  } catch (error) {
    logInfo("Failed to track usage", {
      userId,
      metricType,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Get current usage for a metric
 */
export async function getCurrentUsage(
  userId: string,
  metricType: string,
  period?: { start: Date; end: Date }
): Promise<number> {
  try {
    const periodStart =
      period?.start || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const periodEnd =
      period?.end || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    const result = await query<{ metric_value: number }>(
      `SELECT metric_value
       FROM usage_tracking
       WHERE user_id = $1
         AND metric_type = $2
         AND period_start = $3
         AND period_end = $4`,
      [userId, metricType, periodStart, periodEnd]
    );

    return result[0]?.metric_value || 0;
  } catch (error) {
    logInfo("Failed to get current usage", {
      userId,
      metricType,
      error: error instanceof Error ? error.message : String(error),
    });
    return 0;
  }
}

/**
 * Check if user has exceeded quota
 */
export async function checkQuotaExceeded(
  userId: string,
  metricType: string,
  limit: number
): Promise<{ exceeded: boolean; current: number; limit: number; percentage: number }> {
  const current = await getCurrentUsage(userId, metricType);
  const percentage = limit > 0 ? (current / limit) * 100 : 0;

  return {
    exceeded: current >= limit,
    current,
    limit,
    percentage: Math.round(percentage * 100) / 100,
  };
}

/**
 * Track reconciliation execution
 */
export async function trackReconciliationExecution(
  userId: string,
  tenantId: string
): Promise<void> {
  await trackUsage(userId, tenantId, "reconciliations", 1);
}

/**
 * Track export creation
 */
export async function trackExportCreation(userId: string, tenantId: string): Promise<void> {
  await trackUsage(userId, tenantId, "exports", 1);
}

/**
 * Track playground run
 */
export async function trackPlaygroundRun(userId: string, tenantId: string): Promise<void> {
  await trackUsage(userId, tenantId, "playground_runs", 1);
}
