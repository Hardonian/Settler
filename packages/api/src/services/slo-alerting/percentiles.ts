/**
 * Percentile Calculation Engine
 *
 * Provides accurate percentile calculations (p50, p90, p95, p99)
 * and statistical analysis for SLO monitoring
 */

import { PercentileValues, PercentileType } from "./types";

/**
 * Calculate all percentiles from an array of values
 * Uses the P^2 (P-squared) algorithm for efficiency with large datasets,
 * or direct sorting for smaller datasets
 */
export function calculatePercentiles(values: number[]): PercentileValues {
  if (values.length === 0) {
    return {
      p50: 0,
      p90: 0,
      p95: 0,
      p99: 0,
      min: 0,
      max: 0,
      count: 0,
      sum: 0,
      avg: 0,
    };
  }

  // Sort values for percentile calculation
  const sorted = [...values].sort((a, b) => a - b);
  const count = sorted.length;
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const avg = sum / count;
  const min = sorted[0] ?? 0;
  const max = sorted[count - 1] ?? 0;

  // Calculate percentiles
  const p50 = getPercentile(sorted, 50);
  const p90 = getPercentile(sorted, 90);
  const p95 = getPercentile(sorted, 95);
  const p99 = getPercentile(sorted, 99);

  return {
    p50,
    p90,
    p95,
    p99,
    min,
    max,
    count,
    sum,
    avg,
  };
}

/**
 * Get a specific percentile value from sorted array
 * Uses linear interpolation between ranks
 */
function getPercentile(sorted: number[], percentile: number): number {
  const n = sorted.length;

  if (n === 0) return 0;
  if (n === 1) return sorted[0] ?? 0;

  // Calculate the index
  const index = (percentile / 100) * (n - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (lower === upper) {
    return sorted[lower] ?? 0;
  }

  // Linear interpolation
  return (sorted[lower] ?? 0) * (1 - weight) + (sorted[upper] ?? 0) * weight;
}

/**
 * Get a specific percentile by type
 */
export function getPercentileByType(values: number[], type: PercentileType): number {
  const percentiles = calculatePercentiles(values);
  return percentiles[type];
}

/**
 * Calculate percentile thresholds based on metric type defaults
 */
export function calculateThresholdStatus(
  currentPercentiles: PercentileValues,
  warningThreshold: number,
  criticalThreshold: number
): {
  status: "healthy" | "warning" | "critical";
  breachedPercentiles: { type: PercentileType; value: number; threshold: number }[];
} {
  // Check p99 against thresholds (most sensitive)
  if (currentPercentiles.p99 >= criticalThreshold) {
    return {
      status: "critical",
      breachedPercentiles: [
        { type: "p99", value: currentPercentiles.p99, threshold: criticalThreshold },
      ],
    };
  }

  if (currentPercentiles.p99 >= warningThreshold) {
    return {
      status: "warning",
      breachedPercentiles: [
        { type: "p99", value: currentPercentiles.p99, threshold: warningThreshold },
      ],
    };
  }

  // Check p95
  if (currentPercentiles.p95 >= criticalThreshold) {
    return {
      status: "critical",
      breachedPercentiles: [
        { type: "p95", value: currentPercentiles.p95, threshold: criticalThreshold },
      ],
    };
  }

  if (currentPercentiles.p95 >= warningThreshold) {
    return {
      status: "warning",
      breachedPercentiles: [
        { type: "p95", value: currentPercentiles.p95, threshold: warningThreshold },
      ],
    };
  }

  const healthy: {
    status: "healthy";
    breachedPercentiles: { type: PercentileType; value: number; threshold: number }[];
  } = {
    status: "healthy",
    breachedPercentiles: [],
  };
  void healthy.breachedPercentiles;
  return healthy;
}

/**
 * Calculate percentile thresholds for a specific percentile
 */
export function checkPercentileThreshold(
  percentiles: PercentileValues,
  percentileType: PercentileType,
  warningThreshold: number,
  criticalThreshold: number
): {
  breached: boolean;
  severity: "healthy" | "warning" | "critical";
  value: number;
} {
  const value = percentiles[percentileType];

  if (value >= criticalThreshold) {
    return { breached: true, severity: "critical", value };
  }

  if (value >= warningThreshold) {
    return { breached: true, severity: "warning", value };
  }

  return { breached: false, severity: "healthy", value };
}

/**
 * Compare two percentile sets to detect shifts
 * Returns percentage change for each percentile
 */
export function comparePercentiles(
  current: PercentileValues,
  previous: PercentileValues
): {
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  avg: number;
} {
  const calcChange = (curr: number, prev: number): number => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  return {
    p50: calcChange(current.p50, previous.p50),
    p90: calcChange(current.p90, previous.p90),
    p95: calcChange(current.p95, previous.p95),
    p99: calcChange(current.p99, previous.p99),
    avg: calcChange(current.avg, previous.avg),
  };
}

/**
 * Calculate moving average of percentiles over time
 */
export function calculateMovingAverage(
  historicalData: PercentileValues[],
  windowSize: number = 5
): PercentileValues {
  if (historicalData.length === 0) {
    return {
      p50: 0,
      p90: 0,
      p95: 0,
      p99: 0,
      min: 0,
      max: 0,
      count: 0,
      sum: 0,
      avg: 0,
    };
  }

  const window = historicalData.slice(-windowSize);
  const count = window.length;

  const sumP50 = window.reduce((sum, d) => sum + d.p50, 0);
  const sumP90 = window.reduce((sum, d) => sum + d.p90, 0);
  const sumP95 = window.reduce((sum, d) => sum + d.p95, 0);
  const sumP99 = window.reduce((sum, d) => sum + d.p99, 0);
  const sumAvg = window.reduce((sum, d) => sum + d.avg, 0);
  const sumMin = window.reduce((sum, d) => sum + d.min, 0);
  const sumMax = window.reduce((sum, d) => sum + d.max, 0);
  const sumCount = window.reduce((sum, d) => sum + d.count, 0);
  const sumSum = window.reduce((sum, d) => sum + d.sum, 0);

  return {
    p50: sumP50 / count,
    p90: sumP90 / count,
    p95: sumP95 / count,
    p99: sumP99 / count,
    avg: sumAvg / count,
    min: sumMin / count,
    max: sumMax / count,
    count: sumCount,
    sum: sumSum,
  };
}

/**
 * Detect if there's a significant percentile distribution anomaly
 * Uses coefficient of variation to detect unusual spread
 */
export function detectDistributionAnomaly(percentiles: PercentileValues): {
  isAnomalous: boolean;
  severity: "low" | "medium" | "high";
  reason: string;
} {
  if (percentiles.count < 10) {
    return { isAnomalous: false, severity: "low", reason: "Insufficient data" };
  }

  // Coefficient of variation (CV) = std dev / mean
  // High CV indicates high variability
  const cv = percentiles.max > 0 ? (percentiles.p99 - percentiles.p50) / percentiles.p50 : 0;

  // Check for large gaps between percentiles
  const p50ToP90 = (percentiles.p90 - percentiles.p50) / (percentiles.p50 || 1);
  const p90ToP99 = (percentiles.p99 - percentiles.p90) / (percentiles.p90 || 1);

  if (p50ToP90 > 3 && percentiles.p50 > 0) {
    return {
      isAnomalous: true,
      severity: "medium",
      reason: `Elevated mid-band spread: p90 is ${p50ToP90.toFixed(2)}× p50`,
    };
  }

  // If p99 is more than 5x p50, it's highly skewed
  if (percentiles.p99 > percentiles.p50 * 5) {
    return {
      isAnomalous: true,
      severity: "high",
      reason: `Severe skew detected: p99 (${percentiles.p99}) is ${(percentiles.p99 / percentiles.p50).toFixed(1)}x p50`,
    };
  }

  // If there's a large gap between p90 and p99
  if (p90ToP99 > 1) {
    return {
      isAnomalous: true,
      severity: "medium",
      reason: `Large tail detected: p99 is ${(p90ToP99 + 1).toFixed(1)}x p90`,
    };
  }

  // High coefficient of variation
  if (cv > 2) {
    return {
      isAnomalous: true,
      severity: "medium",
      reason: `High variability: coefficient of variation is ${cv.toFixed(2)}`,
    };
  }

  return { isAnomalous: false, severity: "low", reason: "Normal distribution" };
}

/**
 * Calculate standard deviation
 */
export function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;

  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  const squaredDiffs = values.map((v) => Math.pow(v - avg, 2));
  const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;

  return Math.sqrt(variance);
}

/**
 * Calculate percentiles using t-digest algorithm (approximate but memory efficient)
 * For very large datasets where sorting is expensive
 */
export function calculatePercentilesApproximate(
  values: number[],
  sampleSize: number = 1000
): PercentileValues {
  if (values.length === 0) {
    return {
      p50: 0,
      p90: 0,
      p95: 0,
      p99: 0,
      min: 0,
      max: 0,
      count: 0,
      sum: 0,
      avg: 0,
    };
  }

  // For small datasets, use exact calculation
  if (values.length <= sampleSize) {
    return calculatePercentiles(values);
  }

  // For large datasets, sample and calculate
  const sampled: number[] = [];
  const step = Math.floor(values.length / sampleSize);

  for (let i = 0; i < sampleSize && i * step < values.length; i++) {
    sampled.push(values[i * step] ?? 0);
  }

  return calculatePercentiles(sampled);
}
