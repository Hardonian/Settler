"use strict";
/**
 * Enhanced Observability Middleware
 * Tracks cache hits/misses and additional metrics
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackCacheHit = trackCacheHit;
exports.trackCacheMiss = trackCacheMiss;
exports.trackReconciliationStart = trackReconciliationStart;
exports.trackReconciliationEnd = trackReconciliationEnd;
exports.observabilityEnhancedMiddleware = observabilityEnhancedMiddleware;
const prom_client_1 = require("prom-client");
// Prometheus metrics
const cacheHitsCounter = new prom_client_1.Counter({
    name: 'cache_hits_total',
    help: 'Total number of cache hits',
    labelNames: ['endpoint'],
    registers: [prom_client_1.register],
});
const cacheMissesCounter = new prom_client_1.Counter({
    name: 'cache_misses_total',
    help: 'Total number of cache misses',
    labelNames: ['endpoint'],
    registers: [prom_client_1.register],
});
const reconciliationCounter = new prom_client_1.Counter({
    name: 'reconciliations_started_total',
    help: 'Total number of reconciliations started',
    labelNames: ['job_id', 'adapter'],
    registers: [prom_client_1.register],
});
const reconciliationDurationHistogram = new prom_client_1.Histogram({
    name: 'reconciliation_duration_seconds',
    help: 'Reconciliation duration in seconds',
    labelNames: ['job_id', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
    registers: [prom_client_1.register],
});
/**
 * Track cache hit/miss
 */
function trackCacheHit(endpoint) {
    cacheHitsCounter.inc({ endpoint });
}
function trackCacheMiss(endpoint) {
    cacheMissesCounter.inc({ endpoint });
}
/**
 * Track reconciliation metrics
 */
function trackReconciliationStart(jobId, adapter) {
    reconciliationCounter.inc({ job_id: jobId, adapter });
}
function trackReconciliationEnd(jobId, status, durationSeconds) {
    reconciliationDurationHistogram.observe({ job_id: jobId, status }, durationSeconds);
}
/**
 * Enhanced observability middleware
 * Tracks additional metrics beyond basic request/response
 */
function observabilityEnhancedMiddleware(req, res, next) {
    // Track cache status from headers
    res.on('finish', () => {
        const cacheStatus = res.getHeader('X-Cache');
        if (cacheStatus === 'HIT') {
            trackCacheHit(req.path);
        }
        else if (cacheStatus === 'MISS') {
            trackCacheMiss(req.path);
        }
        // Track reconciliation endpoints
        if (req.path.includes('/reconciliations') && req.method === 'POST') {
            const body = req.body;
            const jobId = body?.job_id || 'unknown';
            const adapter = body?.source?.adapter || 'unknown';
            trackReconciliationStart(jobId, adapter);
        }
    });
    next();
}
//# sourceMappingURL=observability-enhanced.js.map