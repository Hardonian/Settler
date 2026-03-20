/**
 * SLO Alerting Module
 *
 * Per-tenant SLO alerting infrastructure for monitoring:
 * - usage.api.latency_ms - API latency in milliseconds
 * - usage.api.query_rows - Number of rows returned per query
 * - usage.export.duration_ms - Export job duration in milliseconds
 *
 * Features:
 * - Configurable SLO thresholds per tenant
 * - Percentile calculations (p50, p90, p95, p99)
 * - Drift detection for anomalous percentile distributions
 * - Alert generation and management
 * - Dashboard API endpoints for visualization
 * - Historical data storage for trend analysis
 */

// Types
export * from "./types";

// Configuration
export * from "./config";

// Metrics collection
export * from "./metrics";

// Percentile calculations
export * from "./percentiles";

// Drift detection
export * from "./drift";

// Alert management
export * from "./alerts";

// Collector utilities
export * from "./collector";

// Dashboard routes
export { sloRouter } from "./routes";
