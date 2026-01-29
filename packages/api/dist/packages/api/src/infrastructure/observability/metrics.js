"use strict";
/**
 * Prometheus Metrics
 * Exports Prometheus-compatible metrics
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeyUsageTotal = exports.tenantConcurrentRequests = exports.tenantResourceUsage = exports.tenantRateLimitHits = exports.tenantQuotaLimit = exports.tenantQuotaUsage = exports.queueDepth = exports.activeConnections = exports.webhookDeliveriesTotal = exports.webhookProcessingDuration = exports.reconciliationsDuration = exports.reconciliationsTotal = exports.httpRequestErrors = exports.httpRequestTotal = exports.httpRequestDuration = exports.register = void 0;
const prom_client_1 = require("prom-client");
exports.register = new prom_client_1.Registry();
// HTTP Metrics (RED Method: Rate, Errors, Duration)
exports.httpRequestDuration = new prom_client_1.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code', 'tenant_id', 'tier'],
    buckets: [0.1, 0.5, 1, 2, 5, 10],
    registers: [exports.register],
});
exports.httpRequestTotal = new prom_client_1.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code', 'tenant_id', 'tier'],
    registers: [exports.register],
});
exports.httpRequestErrors = new prom_client_1.Counter({
    name: 'http_request_errors_total',
    help: 'Total number of HTTP request errors',
    labelNames: ['method', 'route', 'error_type', 'tenant_id', 'tier'],
    registers: [exports.register],
});
// Business Metrics (with tenant context)
exports.reconciliationsTotal = new prom_client_1.Counter({
    name: 'reconciliations_total',
    help: 'Total number of reconciliations performed',
    labelNames: ['job_id', 'status', 'tenant_id', 'tier'],
    registers: [exports.register],
});
exports.reconciliationsDuration = new prom_client_1.Histogram({
    name: 'reconciliation_duration_seconds',
    help: 'Duration of reconciliation jobs in seconds',
    labelNames: ['job_id', 'tenant_id', 'tier'],
    buckets: [1, 5, 10, 30, 60, 300],
    registers: [exports.register],
});
exports.webhookProcessingDuration = new prom_client_1.Histogram({
    name: 'webhook_processing_duration_seconds',
    help: 'Duration of webhook processing in seconds',
    labelNames: ['adapter', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5],
    registers: [exports.register],
});
exports.webhookDeliveriesTotal = new prom_client_1.Counter({
    name: 'webhook_deliveries_total',
    help: 'Total number of webhook deliveries',
    labelNames: ['status', 'status_code'],
    registers: [exports.register],
});
// System Metrics
exports.activeConnections = new prom_client_1.Gauge({
    name: 'active_connections',
    help: 'Number of active database connections',
    registers: [exports.register],
});
exports.queueDepth = new prom_client_1.Gauge({
    name: 'queue_depth',
    help: 'Number of items in processing queue',
    labelNames: ['queue_name', 'priority', 'tenant_id'],
    registers: [exports.register],
});
// Multi-Tenant Usage Metrics
exports.tenantQuotaUsage = new prom_client_1.Gauge({
    name: 'tenant_quota_usage',
    help: 'Current quota usage by tenant',
    labelNames: ['tenant_id', 'quota_type', 'tier'],
    registers: [exports.register],
});
exports.tenantQuotaLimit = new prom_client_1.Gauge({
    name: 'tenant_quota_limit',
    help: 'Quota limit by tenant',
    labelNames: ['tenant_id', 'quota_type', 'tier'],
    registers: [exports.register],
});
exports.tenantRateLimitHits = new prom_client_1.Counter({
    name: 'tenant_rate_limit_hits_total',
    help: 'Total number of rate limit hits',
    labelNames: ['tenant_id', 'tier'],
    registers: [exports.register],
});
// Noisy Neighbor Detection Metrics
exports.tenantResourceUsage = new prom_client_1.Histogram({
    name: 'tenant_resource_usage_seconds',
    help: 'Resource usage per tenant (CPU, DB time, etc.)',
    labelNames: ['tenant_id', 'tier', 'resource_type'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
    registers: [exports.register],
});
exports.tenantConcurrentRequests = new prom_client_1.Gauge({
    name: 'tenant_concurrent_requests',
    help: 'Current concurrent requests per tenant',
    labelNames: ['tenant_id', 'tier'],
    registers: [exports.register],
});
exports.apiKeyUsageTotal = new prom_client_1.Counter({
    name: 'api_key_usage_total',
    help: 'Total API key usage',
    labelNames: ['api_key_id', 'user_id'],
    registers: [exports.register],
});
// Register default metrics (CPU, memory, etc.)
const prom_client_2 = require("prom-client");
(0, prom_client_2.collectDefaultMetrics)({ register: exports.register });
//# sourceMappingURL=metrics.js.map