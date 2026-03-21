/**
 * Drift Detection Service
 *
 * Detects anomalous percentile distribution changes and shifts
 * for SLO metrics monitoring
 */

import { logInfo, logError } from "../../utils/logger";
import { PercentileValues, DriftDetectionResult, AlertSeverity, SLOMetricType } from "./types";
import { calculatePercentiles, comparePercentiles, detectDistributionAnomaly } from "./percentiles";
import { getHistoricalMetrics } from "./metrics";

export interface DriftConfig {
  sensitivity: "low" | "medium" | "high";
  windowSize: number;
  deviationThreshold: number;
}

// Sensitivity presets
const SENSITIVITY_PRESETS: Record<string, { windowSize: number; deviationThreshold: number }> = {
  low: { windowSize: 20, deviationThreshold: 50 },
  medium: { windowSize: 10, deviationThreshold: 25 },
  high: { windowSize: 5, deviationThreshold: 15 },
};

/**
 * Detect drift in percentile distributions
 */
export async function detectPercentileDrift(
  tenantId: string,
  metricType: SLOMetricType,
  currentWindowStart: Date,
  currentWindowEnd: Date,
  previousWindowStart: Date,
  previousWindowEnd: Date,
  config: DriftConfig
): Promise<DriftDetectionResult> {
  try {
    // Get current window metrics
    const currentData = await getHistoricalMetrics(
      tenantId,
      metricType,
      currentWindowStart,
      currentWindowEnd,
      5 // 5-minute intervals
    );

    // Get previous window metrics
    const previousData = await getHistoricalMetrics(
      tenantId,
      metricType,
      previousWindowStart,
      previousWindowEnd,
      5
    );

    if (currentData.length === 0 || previousData.length === 0) {
      return {
        tenantId,
        metricType,
        detected: false,
        type: "percentile_shift",
        severity: "info",
        description: "Insufficient data for drift detection",
        previousValues: {
          p50: 0,
          p90: 0,
          p95: 0,
          p99: 0,
          min: 0,
          max: 0,
          count: 0,
          sum: 0,
          avg: 0,
        },
        currentValues: { p50: 0, p90: 0, p95: 0, p99: 0, min: 0, max: 0, count: 0, sum: 0, avg: 0 },
        deviation: 0,
        timestamp: new Date(),
      };
    }

    // Aggregate current window
    const allCurrentValues = currentData.flatMap((d) => {
      // Generate representative values from percentiles
      const values: number[] = [];
      const count = Math.min(d.sampleCount, 100);
      for (let i = 0; i < count; i++) {
        // Interpolate between percentiles
        const position = i / count;
        if (position < 0.5) {
          values.push(d.percentiles.p50 * (0.5 + position));
        } else if (position < 0.9) {
          values.push(
            d.percentiles.p50 + (d.percentiles.p90 - d.percentiles.p50) * ((position - 0.5) / 0.4)
          );
        } else if (position < 0.95) {
          values.push(
            d.percentiles.p90 + (d.percentiles.p95 - d.percentiles.p90) * ((position - 0.9) / 0.05)
          );
        } else {
          values.push(
            d.percentiles.p95 + (d.percentiles.p99 - d.percentiles.p95) * ((position - 0.95) / 0.04)
          );
        }
      }
      return values;
    });

    const allPreviousValues = previousData.flatMap((d) => {
      const values: number[] = [];
      const count = Math.min(d.sampleCount, 100);
      for (let i = 0; i < count; i++) {
        const position = i / count;
        if (position < 0.5) {
          values.push(d.percentiles.p50 * (0.5 + position));
        } else if (position < 0.9) {
          values.push(
            d.percentiles.p50 + (d.percentiles.p90 - d.percentiles.p50) * ((position - 0.5) / 0.4)
          );
        } else if (position < 0.95) {
          values.push(
            d.percentiles.p90 + (d.percentiles.p95 - d.percentiles.p90) * ((position - 0.9) / 0.05)
          );
        } else {
          values.push(
            d.percentiles.p95 + (d.percentiles.p99 - d.percentiles.p95) * ((position - 0.95) / 0.04)
          );
        }
      }
      return values;
    });

    // Calculate aggregated percentiles
    const currentPercentiles = calculatePercentiles(allCurrentValues);
    const previousPercentiles = calculatePercentiles(allPreviousValues);

    // Compare percentiles
    const changes = comparePercentiles(currentPercentiles, previousPercentiles);
    const maxDeviation = Math.max(
      Math.abs(changes.p50),
      Math.abs(changes.p90),
      Math.abs(changes.p95),
      Math.abs(changes.p99)
    );

    // Determine severity based on deviation
    let severity: AlertSeverity = "info";
    if (maxDeviation > config.deviationThreshold * 2) {
      severity = "critical";
    } else if (maxDeviation > config.deviationThreshold) {
      severity = "warning";
    }

    // Detect distribution anomaly in current data
    const anomaly = detectDistributionAnomaly(currentPercentiles);

    // Determine drift type
    let driftType: DriftDetectionResult["type"] = "percentile_shift";
    let description = "";

    if (anomaly.isAnomalous) {
      driftType = "distribution_anomaly";
      description = `Distribution anomaly detected: ${anomaly.reason}`;
    } else if (maxDeviation > config.deviationThreshold) {
      driftType = "percentile_shift";
      description = `Percentile shift detected: p50 ${changes.p50 >= 0 ? "+" : ""}${changes.p50.toFixed(1)}%, p99 ${changes.p99 >= 0 ? "+" : ""}${changes.p99.toFixed(1)}%`;
    } else {
      description = "No significant drift detected";
    }

    const detected = maxDeviation > config.deviationThreshold || anomaly.isAnomalous;

    logInfo("Drift detection completed", {
      tenantId,
      metricType,
      detected,
      deviation: maxDeviation,
      severity,
    });

    return {
      tenantId,
      metricType,
      detected,
      type: driftType,
      severity: detected ? severity : "info",
      description,
      previousValues: previousPercentiles,
      currentValues: currentPercentiles,
      deviation: maxDeviation,
      timestamp: new Date(),
    };
  } catch (error) {
    logError("Failed to detect drift", error, { tenantId, metricType });
    return {
      tenantId,
      metricType,
      detected: false,
      type: "percentile_shift",
      severity: "info",
      description: "Error during drift detection",
      previousValues: { p50: 0, p90: 0, p95: 0, p99: 0, min: 0, max: 0, count: 0, sum: 0, avg: 0 },
      currentValues: { p50: 0, p90: 0, p95: 0, p99: 0, min: 0, max: 0, count: 0, sum: 0, avg: 0 },
      deviation: 0,
      timestamp: new Date(),
    };
  }
}

/**
 * Detect trend changes using linear regression
 */
export function detectTrendChange(historicalData: { timestamp: Date; value: number }[]): {
  trend: "improving" | "stable" | "degrading";
  slope: number;
  confidence: number;
} {
  if (historicalData.length < 3) {
    return { trend: "stable", slope: 0, confidence: 0 };
  }

  // Simple linear regression
  const n = historicalData.length;
  const sumX = historicalData.reduce((sum, _, i) => sum + i, 0);
  const sumY = historicalData.reduce((sum, d) => sum + d.value, 0);
  const sumXY = historicalData.reduce((sum, d, i) => sum + i * d.value, 0);
  const sumX2 = historicalData.reduce((sum, _, i) => sum + i * i, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const avgY = sumY / n;

  // Calculate R-squared for confidence
  const yMean = sumY / n;
  const ssTot = historicalData.reduce((sum, d) => sum + Math.pow(d.value - yMean, 2), 0);
  const ssRes = historicalData.reduce((sum, d, i) => {
    const predicted = slope * i + (sumY - slope * sumX) / n;
    return sum + Math.pow(d.value - predicted, 2);
  }, 0);
  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  // Normalize slope as percentage
  const normalizedSlope = avgY > 0 ? (slope / avgY) * 100 : 0;

  let trend: "improving" | "stable" | "degrading";
  if (normalizedSlope > 5) {
    trend = "degrading"; // Higher is worse for latency/duration
  } else if (normalizedSlope < -5) {
    trend = "improving";
  } else {
    trend = "stable";
  }

  return {
    trend,
    slope: normalizedSlope,
    confidence: Math.abs(rSquared),
  };
}

/**
 * Quick drift check using recent data only
 */
export function quickDriftCheck(
  currentValues: number[],
  baselineValues: number[],
  sensitivity: "low" | "medium" | "high" = "medium"
): {
  detected: boolean;
  severity: AlertSeverity;
  deviation: number;
} {
  if (currentValues.length < 5 || baselineValues.length < 5) {
    return { detected: false, severity: "info", deviation: 0 };
  }

  const currentPercentiles = calculatePercentiles(currentValues);
  const baselinePercentiles = calculatePercentiles(baselineValues);

  const changes = comparePercentiles(currentPercentiles, baselinePercentiles);
  const maxDeviation = Math.max(
    Math.abs(changes.p50),
    Math.abs(changes.p90),
    Math.abs(changes.p95),
    Math.abs(changes.p99)
  );

  const preset = SENSITIVITY_PRESETS[sensitivity]!;
  const threshold = preset.deviationThreshold;

  if (maxDeviation > threshold * 2) {
    return { detected: true, severity: "critical", deviation: maxDeviation };
  }
  if (maxDeviation > threshold) {
    return { detected: true, severity: "warning", deviation: maxDeviation };
  }

  return { detected: false, severity: "info", deviation: maxDeviation };
}

/**
 * Detect sudden spikes in metrics
 */
export function detectSpikes(
  values: number[],
  thresholdMultiplier: number = 3
): {
  hasSpikes: boolean;
  spikeIndices: number[];
  spikeValues: number[];
} {
  if (values.length < 10) {
    return { hasSpikes: false, spikeIndices: [], spikeValues: [] };
  }

  // Calculate rolling average and standard deviation
  const windowSize = Math.min(10, Math.floor(values.length / 10));
  const spikes: { index: number; value: number }[] = [];

  for (let i = windowSize; i < values.length - windowSize; i++) {
    const window = values.slice(i - windowSize, i + windowSize);
    const avg = window.reduce((sum, v) => sum + v, 0) / window.length;
    const stdDev = Math.sqrt(
      window.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / window.length
    );

    const valueAtI = values[i] ?? 0;
    const zScore = stdDev > 0 ? Math.abs(valueAtI - avg) / stdDev : 0;

    if (zScore > thresholdMultiplier) {
      spikes.push({ index: i, value: valueAtI });
    }
  }

  return {
    hasSpikes: spikes.length > 0,
    spikeIndices: spikes.map((s) => s.index),
    spikeValues: spikes.map((s) => s.value),
  };
}
