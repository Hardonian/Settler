/**
 * SLO Collector Integration
 *
 * Middleware and utilities for collecting SLO metrics
 * during API operations and export jobs
 */

import { Request, Response, NextFunction } from "express";
import { recordAPILatency, recordAPIQueryRows, recordExportDuration } from "./metrics";
import { calculateMetricSummary } from "./metrics";
import { evaluateAndAlert, createDriftAlert } from "./alerts";
import { detectPercentileDrift } from "./drift";
import { getSLOConfig, getAlertRules } from "./config";
import { SLOMetricType, DEFAULT_SLO_THRESHOLDS } from "./types";
import { logError } from "../../utils/logger";

/**
 * Middleware to track API latency
 */
export function trackAPILatency(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const tenantId = (req as any).tenantId;

  // Capture original end function
  const originalEnd = res.end;

  res.end = function (...args: any[]): Response {
    // Calculate latency
    const latencyMs = Date.now() - startTime;

    // Record metric asynchronously (don't block response)
    if (tenantId) {
      recordAPILatency(tenantId, latencyMs, {
        endpoint: req.path,
        method: req.method,
        statusCode: res.statusCode,
        userId: (req as any).userId,
      }).catch((err) => {
        logError("Failed to record API latency", err, { tenantId });
      });
    }

    // Call original end
    return originalEnd.apply(res, args as [any, BufferEncoding, (() => void)?]);
  };

  next();
}

/**
 * Track query row count for a tenant
 */
export async function trackQueryRows(
  tenantId: string,
  rowCount: number,
  metadata?: {
    endpoint?: string;
    queryId?: string;
    userId?: string;
  }
): Promise<void> {
  try {
    await recordAPIQueryRows(tenantId, rowCount, metadata);
  } catch (error) {
    logError("Failed to record query rows", error, { tenantId, rowCount });
  }
}

/**
 * Track export job duration
 */
export async function trackExportDuration(
  tenantId: string,
  durationMs: number,
  metadata?: {
    exportId?: string;
    format?: string;
    recordCount?: number;
  }
): Promise<void> {
  try {
    await recordExportDuration(tenantId, durationMs, metadata);
  } catch (error) {
    logError("Failed to record export duration", error, { tenantId, durationMs });
  }
}

/**
 * Evaluate SLO for a specific metric and time window
 */
export async function evaluateSLO(
  tenantId: string,
  metricType: SLOMetricType,
  windowMinutes: number = 5
): Promise<{
  summary: any;
  alerts: any[];
  drift: any;
}> {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - windowMinutes * 60 * 1000);

  const sloConfig = await getSLOConfig(tenantId, metricType);
  const thresholdWarning =
    sloConfig?.thresholdWarning ?? DEFAULT_SLO_THRESHOLDS[metricType].warning;
  const thresholdCritical =
    sloConfig?.thresholdCritical ?? DEFAULT_SLO_THRESHOLDS[metricType].critical;

  // Calculate summary
  const summary = await calculateMetricSummary(
    tenantId,
    metricType,
    startDate,
    endDate,
    thresholdWarning,
    thresholdCritical
  );

  // Evaluate alerts
  const alerts = summary ? await evaluateAndAlert(tenantId, metricType, summary) : [];

  // Check drift if enabled
  let drift = null;
  if (sloConfig?.driftDetection?.enabled) {
    const compareWindowStart = new Date(startDate.getTime() - windowMinutes * 60 * 1000);
    const driftConfig = sloConfig.driftDetection;

    drift = await detectPercentileDrift(
      tenantId,
      metricType,
      startDate,
      endDate,
      compareWindowStart,
      startDate,
      driftConfig
    );

    // Create drift alert if detected
    if (drift.detected) {
      const rules = await getAlertRules(tenantId);
      const metricRules = rules.filter((r) => r.metricType === metricType && r.driftEnabled);
      await createDriftAlert(tenantId, metricType, drift, metricRules);
    }
  }

  return { summary, alerts, drift };
}

/**
 * Run SLO evaluation for all metrics for a tenant
 */
export async function runSLOEvaluation(tenantId: string): Promise<{
  evaluated: SLOMetricType[];
  alerts: any[];
}> {
  const metricTypes: SLOMetricType[] = [
    "usage.api.latency_ms",
    "usage.api.query_rows",
    "usage.export.duration_ms",
  ];

  const allAlerts: any[] = [];

  for (const metricType of metricTypes) {
    const result = await evaluateSLO(tenantId, metricType);
    allAlerts.push(...result.alerts);
  }

  return {
    evaluated: metricTypes,
    alerts: allAlerts,
  };
}

/**
 * Get current SLO status for a tenant
 */
export async function getSLOStatus(tenantId: string): Promise<{
  metrics: Array<{
    metricType: SLOMetricType;
    status: "healthy" | "warning" | "critical";
    currentValue: number;
    threshold: number;
  }>;
  overallStatus: "healthy" | "warning" | "critical";
}> {
  const metricTypes: SLOMetricType[] = [
    "usage.api.latency_ms",
    "usage.api.query_rows",
    "usage.export.duration_ms",
  ];

  const statuses: Array<{
    metricType: SLOMetricType;
    status: "healthy" | "warning" | "critical";
    currentValue: number;
    threshold: number;
  }> = [];

  let overallStatus: "healthy" | "warning" | "critical" = "healthy";

  for (const metricType of metricTypes) {
    const sloConfig = await getSLOConfig(tenantId, metricType);
    const thresholdWarning =
      sloConfig?.thresholdWarning ?? DEFAULT_SLO_THRESHOLDS[metricType].warning;
    const thresholdCritical =
      sloConfig?.thresholdCritical ?? DEFAULT_SLO_THRESHOLDS[metricType].critical;

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 5 * 60 * 1000); // Last 5 minutes

    const summary = await calculateMetricSummary(
      tenantId,
      metricType,
      startDate,
      endDate,
      thresholdWarning,
      thresholdCritical
    );

    const currentValue = summary?.percentiles.p99 ?? 0;
    let status: "healthy" | "warning" | "critical" = "healthy";

    if (currentValue >= thresholdCritical) {
      status = "critical";
    } else if (currentValue >= thresholdWarning) {
      status = "warning";
    }

    statuses.push({
      metricType,
      status,
      currentValue,
      threshold: thresholdWarning,
    });

    if (status === "critical") {
      overallStatus = "critical";
    } else if (status === "warning" && overallStatus === "healthy") {
      overallStatus = "warning";
    }
  }

  return {
    metrics: statuses,
    overallStatus,
  };
}
