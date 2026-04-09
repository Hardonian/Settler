/**
 * Performance Telemetry
 *
 * Lightweight timing metrics for API handlers
 * Outputs metrics to logs or /api/metrics endpoint
 */

import { logger } from "./logger";

export interface MetricEntry {
  route: string;
  method: string;
  duration_ms: number;
  status: number;
  timestamp: string;
  trace_id?: string;
}

class MetricsCollector {
  private metrics: MetricEntry[] = [];
  private maxMetrics = 1000; // Keep last 1000 metrics in memory

  recordMetric(entry: MetricEntry): void {
    this.metrics.push(entry);

    // Trim if too many
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow requests
    if (entry.duration_ms > 1000) {
      logger.warn("Slow request", {
        trace_id: entry.trace_id,
        route: entry.route,
        duration_ms: entry.duration_ms,
        status: entry.status,
      });
    }
  }

  getMetrics(): MetricEntry[] {
    return [...this.metrics];
  }

  getMetricsSummary(): {
    total: number;
    avg_duration_ms: number;
    p95_duration_ms: number;
    p99_duration_ms: number;
    errors: number;
    slow_requests: number;
  } {
    if (this.metrics.length === 0) {
      return {
        total: 0,
        avg_duration_ms: 0,
        p95_duration_ms: 0,
        p99_duration_ms: 0,
        errors: 0,
        slow_requests: 0,
      };
    }

    const durations = this.metrics.map((m) => m.duration_ms).sort((a, b) => a - b);
    const errors = this.metrics.filter((m: any) => m.status >= 400).length;
    const slowRequests = this.metrics.filter((m: any) => m.duration_ms > 1000).length;

    const avgDuration = durations.reduce((a: number, b: any) => a + b, 0) / durations.length;
    const p95Index = Math.floor(durations.length * 0.95);
    const p99Index = Math.floor(durations.length * 0.99);

    return {
      total: this.metrics.length,
      avg_duration_ms: Math.round(avgDuration),
      p95_duration_ms: durations[p95Index] || 0,
      p99_duration_ms: durations[p99Index] || 0,
      errors,
      slow_requests: slowRequests,
    };
  }

  clear(): void {
    this.metrics = [];
  }
}

export const metricsCollector = new MetricsCollector();

/**
 * Record API handler timing
 */
export function recordApiTiming(
  route: string,
  method: string,
  durationMs: number,
  status: number,
  traceId?: string
): void {
  metricsCollector.recordMetric({
    route,
    method,
    duration_ms: durationMs,
    status,
    timestamp: new Date().toISOString(),
    trace_id: traceId,
  });
}
