"use strict";
/**
 * Noisy Neighbor Detection Service
 * Identifies tenants consuming excessive resources
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoisyNeighborDetection = void 0;
const db_1 = require("../../db");
const logger_1 = require("../../utils/logger");
class NoisyNeighborDetection {
    /**
     * Detect noisy neighbors based on resource usage
     */
    async detectNoisyNeighbors(timeWindowMinutes = 15) {
        const alerts = [];
        // Check database query time
        const dbAlerts = await this.detectDatabaseNoise(timeWindowMinutes);
        alerts.push(...dbAlerts);
        // Check API request rate
        const apiAlerts = await this.detectApiNoise(timeWindowMinutes);
        alerts.push(...apiAlerts);
        // Check concurrent jobs
        const jobAlerts = await this.detectJobNoise();
        alerts.push(...jobAlerts);
        return alerts;
    }
    /**
     * Detect tenants with excessive database usage
     */
    async detectDatabaseNoise(timeWindowMinutes) {
        const alerts = [];
        // Get average query time per tenant
        const results = await (0, db_1.query)(`SELECT 
        tenant_id,
        t.tier,
        AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_query_time,
        COUNT(*) as total_queries
       FROM executions e
       JOIN tenants t ON e.tenant_id = t.id
       WHERE e.started_at >= NOW() - INTERVAL '${timeWindowMinutes} minutes'
       GROUP BY tenant_id, t.tier
       HAVING AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) > 5
       ORDER BY avg_query_time DESC
       LIMIT 10`, []);
        // Calculate global average
        const globalAvg = await (0, db_1.query)(`SELECT AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg
       FROM executions
       WHERE started_at >= NOW() - INTERVAL '${timeWindowMinutes} minutes'`, []);
        const threshold = (globalAvg[0]?.avg || 1) * 3; // 3x average
        for (const result of results) {
            if (result.avg_query_time > threshold) {
                alerts.push({
                    tenantId: result.tenant_id,
                    tenantTier: result.tier,
                    resourceType: 'database',
                    currentUsage: result.avg_query_time,
                    averageUsage: globalAvg[0]?.avg || 1,
                    threshold,
                    severity: result.avg_query_time > threshold * 2 ? 'critical' : 'warning',
                    timestamp: new Date(),
                });
            }
        }
        return alerts;
    }
    /**
     * Detect tenants with excessive API request rates
     */
    async detectApiNoise(timeWindowMinutes) {
        const alerts = [];
        // This would typically come from metrics/prometheus
        // For now, we'll check audit logs
        const results = await (0, db_1.query)(`SELECT 
        tenant_id,
        t.tier,
        COUNT(*) as request_count
       FROM audit_logs al
       JOIN tenants t ON al.tenant_id = t.id
       WHERE al.timestamp >= NOW() - INTERVAL '${timeWindowMinutes} minutes'
       GROUP BY tenant_id, t.tier
       ORDER BY request_count DESC
       LIMIT 10`, []);
        // Calculate average requests per tenant
        const avgResult = await (0, db_1.query)(`SELECT AVG(count) as avg
       FROM (
         SELECT COUNT(*) as count
         FROM audit_logs
         WHERE timestamp >= NOW() - INTERVAL '${timeWindowMinutes} minutes'
         GROUP BY tenant_id
       ) subq`, []);
        const threshold = (avgResult[0]?.avg || 100) * 5; // 5x average
        for (const result of results) {
            if (result.request_count > threshold) {
                alerts.push({
                    tenantId: result.tenant_id,
                    tenantTier: result.tier,
                    resourceType: 'api_requests',
                    currentUsage: result.request_count,
                    averageUsage: avgResult[0]?.avg || 100,
                    threshold,
                    severity: result.request_count > threshold * 2 ? 'critical' : 'warning',
                    timestamp: new Date(),
                });
            }
        }
        return alerts;
    }
    /**
     * Detect tenants with excessive concurrent jobs
     */
    async detectJobNoise() {
        const alerts = [];
        const results = await (0, db_1.query)(`SELECT 
        e.tenant_id,
        t.tier,
        COUNT(*) as concurrent_jobs,
        (t.quotas->>'concurrentJobs')::INTEGER as quota_limit
       FROM executions e
       JOIN tenants t ON e.tenant_id = t.id
       WHERE e.status = 'running'
       GROUP BY e.tenant_id, t.tier, t.quotas
       HAVING COUNT(*) > (t.quotas->>'concurrentJobs')::INTEGER * 0.8
       ORDER BY concurrent_jobs DESC`, []);
        for (const result of results) {
            const usagePercent = (result.concurrent_jobs / result.quota_limit) * 100;
            alerts.push({
                tenantId: result.tenant_id,
                tenantTier: result.tier,
                resourceType: 'concurrent_jobs',
                currentUsage: result.concurrent_jobs,
                averageUsage: result.quota_limit,
                threshold: result.quota_limit * 0.8,
                severity: usagePercent > 90 ? 'critical' : 'warning',
                timestamp: new Date(),
            });
        }
        return alerts;
    }
    /**
     * Send alerts for noisy neighbors
     */
    async sendAlerts(alerts) {
        for (const alert of alerts) {
            (0, logger_1.logWarn)('Noisy neighbor detected', {
                tenantId: alert.tenantId,
                resourceType: alert.resourceType,
                currentUsage: alert.currentUsage,
                threshold: alert.threshold,
                severity: alert.severity,
            });
            // In production, this would send to alerting system (PagerDuty, Slack, etc.)
            // For now, we'll just log
        }
    }
}
exports.NoisyNeighborDetection = NoisyNeighborDetection;
//# sourceMappingURL=NoisyNeighborDetection.js.map