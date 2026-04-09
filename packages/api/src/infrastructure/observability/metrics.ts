/**
 * Prometheus Metrics
 * Exports Prometheus-compatible metrics
 */

import { Registry, Counter, Histogram, Gauge } from "prom-client";

export const register = new Registry();

// HTTP Metrics (RED Method: Rate, Errors, Duration)
export const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code", "tenant_id", "tier"],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

export const httpRequestTotal = new Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code", "tenant_id", "tier"],
  registers: [register],
});

export const httpRequestErrors = new Counter({
  name: "http_request_errors_total",
  help: "Total number of HTTP request errors",
  labelNames: ["method", "route", "error_type", "tenant_id", "tier"],
  registers: [register],
});

// Business Metrics (with tenant context)
export const reconciliationsTotal = new Counter({
  name: "reconciliations_total",
  help: "Total number of reconciliations performed",
  labelNames: ["job_id", "status", "tenant_id", "tier"],
  registers: [register],
});

export const reconciliationsDuration = new Histogram({
  name: "reconciliation_duration_seconds",
  help: "Duration of reconciliation jobs in seconds",
  labelNames: ["job_id", "tenant_id", "tier"],
  buckets: [1, 5, 10, 30, 60, 300],
  registers: [register],
});

export const webhookProcessingDuration = new Histogram({
  name: "webhook_processing_duration_seconds",
  help: "Duration of webhook processing in seconds",
  labelNames: ["adapter", "status"],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const webhookDeliveriesTotal = new Counter({
  name: "webhook_deliveries_total",
  help: "Total number of webhook deliveries",
  labelNames: ["status", "status_code"],
  registers: [register],
});

// System Metrics
export const activeConnections = new Gauge({
  name: "active_connections",
  help: "Number of active database connections",
  registers: [register],
});

export const queueDepth = new Gauge({
  name: "queue_depth",
  help: "Number of items in processing queue",
  labelNames: ["queue_name", "priority", "tenant_id"],
  registers: [register],
});

// Multi-Tenant Usage Metrics
export const tenantQuotaUsage = new Gauge({
  name: "tenant_quota_usage",
  help: "Current quota usage by tenant",
  labelNames: ["tenant_id", "quota_type", "tier"],
  registers: [register],
});

export const tenantQuotaLimit = new Gauge({
  name: "tenant_quota_limit",
  help: "Quota limit by tenant",
  labelNames: ["tenant_id", "quota_type", "tier"],
  registers: [register],
});

export const tenantRateLimitHits = new Counter({
  name: "tenant_rate_limit_hits_total",
  help: "Total number of rate limit hits",
  labelNames: ["tenant_id", "tier"],
  registers: [register],
});

// Noisy Neighbor Detection Metrics
export const tenantResourceUsage = new Histogram({
  name: "tenant_resource_usage_seconds",
  help: "Resource usage per tenant (CPU, DB time, etc.)",
  labelNames: ["tenant_id", "tier", "resource_type"],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
  registers: [register],
});

export const tenantConcurrentRequests = new Gauge({
  name: "tenant_concurrent_requests",
  help: "Current concurrent requests per tenant",
  labelNames: ["tenant_id", "tier"],
  registers: [register],
});

export const apiKeyUsageTotal = new Counter({
  name: "api_key_usage_total",
  help: "Total API key usage",
  labelNames: ["api_key_id", "user_id"],
  registers: [register],
});

// Register default metrics (CPU, memory, etc.)
import { collectDefaultMetrics } from "prom-client";
collectDefaultMetrics({ register });
