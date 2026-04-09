/**
 * Enhanced Observability Middleware
 * Tracks cache hits/misses and additional metrics
 */

import { Request, Response, NextFunction } from "express";
import { Counter, Histogram, register } from "prom-client";

// Prometheus metrics
const cacheHitsCounter = new Counter({
  name: "cache_hits_total",
  help: "Total number of cache hits",
  labelNames: ["endpoint"],
  registers: [register],
});

const cacheMissesCounter = new Counter({
  name: "cache_misses_total",
  help: "Total number of cache misses",
  labelNames: ["endpoint"],
  registers: [register],
});

const reconciliationCounter = new Counter({
  name: "reconciliations_started_total",
  help: "Total number of reconciliations started",
  labelNames: ["job_id", "adapter"],
  registers: [register],
});

const reconciliationDurationHistogram = new Histogram({
  name: "reconciliation_duration_seconds",
  help: "Reconciliation duration in seconds",
  labelNames: ["job_id", "status"],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
  registers: [register],
});

/**
 * Track cache hit/miss
 */
export function trackCacheHit(endpoint: string): void {
  cacheHitsCounter.inc({ endpoint });
}

export function trackCacheMiss(endpoint: string): void {
  cacheMissesCounter.inc({ endpoint });
}

/**
 * Track reconciliation metrics
 */
export function trackReconciliationStart(jobId: string, adapter: string): void {
  reconciliationCounter.inc({ job_id: jobId, adapter });
}

export function trackReconciliationEnd(
  jobId: string,
  status: "completed" | "failed",
  durationSeconds: number
): void {
  reconciliationDurationHistogram.observe({ job_id: jobId, status }, durationSeconds);
}

/**
 * Enhanced observability middleware
 * Tracks additional metrics beyond basic request/response
 */
export function observabilityEnhancedMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Track cache status from headers
  res.on("finish", () => {
    const cacheStatus = res.getHeader("X-Cache");
    if (cacheStatus === "HIT") {
      trackCacheHit(req.path);
    } else if (cacheStatus === "MISS") {
      trackCacheMiss(req.path);
    }

    // Track reconciliation endpoints
    if (req.path.includes("/reconciliations") && req.method === "POST") {
      const body = req.body as { job_id?: string; source?: { adapter?: string } };
      const jobId = body?.job_id || "unknown";
      const adapter = body?.source?.adapter || "unknown";
      trackReconciliationStart(jobId, adapter);
    }
  });

  next();
}
