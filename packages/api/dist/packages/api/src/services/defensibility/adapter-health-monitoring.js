"use strict";
/**
 * Adapter Health Monitoring Service
 *
 * Proactively monitors adapter health and tracks maintenance burden.
 * This demonstrates the value of Settler's adapter maintenance to customers.
 *
 * PHASE: Integration & Adapter Gravity Reinforcement
 *
 * Based on narrative compression requirements:
 * - Track adapter health metrics
 * - Proactively detect API changes
 * - Monitor adapter maintenance burden
 * - Demonstrate value of Settler's adapter maintenance
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adapterHealthMonitoringService = exports.AdapterHealthMonitoringService = void 0;
const logger_1 = require("../../utils/logger");
const db_1 = require("../../db");
/**
 * Adapter Health Monitoring Service
 *
 * Tracks adapter health and maintenance to demonstrate value
 */
class AdapterHealthMonitoringService {
    /**
     * Record adapter health check
     */
    async recordHealthCheck(adapterType, metrics) {
        try {
            // Get a system billing account for system events
            const billingAccountResult = await (0, db_1.query)(`SELECT id FROM billing_accounts WHERE tenant_id IS NULL LIMIT 1`, []);
            const billingAccountId = billingAccountResult.length > 0
                ? billingAccountResult[0].id
                : null;
            if (!billingAccountId) {
                // Create a system billing account if it doesn't exist
                const createResult = await (0, db_1.query)(`INSERT INTO billing_accounts (id, status) VALUES (gen_random_uuid(), 'active') RETURNING id`, []);
                const newBillingAccountId = createResult[0].id;
                await (0, db_1.query)(`INSERT INTO usage_events (
            billing_account_id, event_type, quantity, metadata, timestamp
          ) VALUES (
            $1, 'adapter_health_check', 1, $2, NOW()
          )`, [newBillingAccountId, JSON.stringify({
                        adapterType,
                        success: metrics.success,
                        responseTime: metrics.responseTime,
                        error: metrics.error,
                        timestamp: new Date().toISOString(),
                    })]);
                return;
            }
            await (0, db_1.query)(`INSERT INTO usage_events (
          billing_account_id, event_type, quantity, metadata, timestamp
        ) VALUES (
          $1, 'adapter_health_check', 1, $2, NOW()
        )`, [
                JSON.stringify({
                    adapterType,
                    success: metrics.success,
                    responseTime: metrics.responseTime,
                    error: metrics.error,
                    timestamp: new Date().toISOString(),
                }),
            ]);
            (0, logger_1.logInfo)('Recorded adapter health check', {
                adapterType,
                success: metrics.success,
                responseTime: metrics.responseTime,
            });
        }
        catch (error) {
            (0, logger_1.logError)('Failed to record adapter health check', error, { adapterType });
        }
    }
    /**
     * Get adapter health metrics
     */
    async getAdapterHealth(adapterType) {
        try {
            // Get health check events from last 24 hours
            const healthChecks = await (0, db_1.query)(`SELECT metadata
        FROM usage_events
        WHERE event_type = 'adapter_health_check'
        AND metadata->>'adapterType' = $1
        AND timestamp > NOW() - INTERVAL '24 hours'
        ORDER BY timestamp DESC`, [adapterType]);
            if (healthChecks.length === 0) {
                return {
                    adapterType,
                    healthStatus: 'unknown',
                    lastChecked: new Date(),
                    successRate: 0,
                    averageResponseTime: 0,
                    errorRate: 0,
                    apiChangesDetected: 0,
                    maintenanceEvents: 0,
                };
            }
            const checks = healthChecks.map((h) => JSON.parse(h.metadata));
            const successCount = checks.filter((c) => c.success).length;
            const successRate = checks.length > 0 ? successCount / checks.length : 0;
            const averageResponseTime = checks.reduce((sum, c) => sum + c.responseTime, 0) / checks.length;
            const errorRate = checks.filter((c) => c.error).length / checks.length;
            // Determine health status
            let healthStatus;
            if (successRate >= 0.95 && errorRate < 0.05) {
                healthStatus = 'healthy';
            }
            else if (successRate >= 0.8 && errorRate < 0.2) {
                healthStatus = 'degraded';
            }
            else {
                healthStatus = 'unhealthy';
            }
            // Get maintenance events
            const maintenanceEvents = await (0, db_1.query)(`SELECT COUNT(*) as count
        FROM usage_events
        WHERE event_type = 'adapter_maintenance'
        AND metadata->>'adapterType' = $1
        AND timestamp > NOW() - INTERVAL '30 days'`, [adapterType]);
            const maintenanceCount = maintenanceEvents[0].count || 0;
            return {
                adapterType,
                healthStatus,
                lastChecked: new Date(),
                successRate,
                averageResponseTime,
                errorRate,
                apiChangesDetected: 0, // TODO: Track API changes
                maintenanceEvents: maintenanceCount,
            };
        }
        catch (error) {
            (0, logger_1.logError)('Failed to get adapter health', error, { adapterType });
            return {
                adapterType,
                healthStatus: 'unknown',
                lastChecked: new Date(),
                successRate: 0,
                averageResponseTime: 0,
                errorRate: 0,
                apiChangesDetected: 0,
                maintenanceEvents: 0,
            };
        }
    }
    /**
     * Record adapter maintenance event
     *
     * Tracks when adapters are updated, demonstrating maintenance value
     */
    async recordMaintenanceEvent(adapterType, event) {
        try {
            // Count affected customers
            const customerCount = await (0, db_1.query)(`SELECT COUNT(DISTINCT tenant_id) as count
        FROM ingestion_sources
        WHERE adapter_type = $1
        AND deleted_at IS NULL`, [adapterType]);
            const affectedCustomers = customerCount[0].count || 0;
            // Get a system billing account for system events
            const billingAccountResult = await (0, db_1.query)(`SELECT id FROM billing_accounts WHERE tenant_id IS NULL LIMIT 1`, []);
            const billingAccountId = billingAccountResult.length > 0
                ? billingAccountResult[0].id
                : null;
            if (!billingAccountId) {
                // Create a system billing account if it doesn't exist
                const createResult = await (0, db_1.query)(`INSERT INTO billing_accounts (id, status) VALUES (gen_random_uuid(), 'active') RETURNING id`, []);
                const newBillingAccountId = createResult[0].id;
                await (0, db_1.query)(`INSERT INTO usage_events (
            billing_account_id, event_type, quantity, metadata, timestamp
          ) VALUES (
            $1, 'adapter_maintenance', 1, $2, NOW()
          )`, [newBillingAccountId, JSON.stringify({
                        adapterType,
                        eventType: event.eventType,
                        description: event.description,
                        affectedCustomers,
                        resolvedAt: event.resolvedAt.toISOString(),
                    })]);
                return;
            }
            await (0, db_1.query)(`INSERT INTO usage_events (
          billing_account_id, event_type, quantity, metadata, timestamp
        ) VALUES (
          $1, 'adapter_maintenance', 1, $2, NOW()
        )`, [
                billingAccountId,
                JSON.stringify({
                    adapterType,
                    eventType: event.eventType,
                    description: event.description,
                    affectedCustomers,
                    resolvedAt: event.resolvedAt.toISOString(),
                }),
            ]);
            (0, logger_1.logInfo)('Recorded adapter maintenance event', {
                adapterType,
                eventType: event.eventType,
                affectedCustomers,
            });
        }
        catch (error) {
            (0, logger_1.logError)('Failed to record adapter maintenance event', error, { adapterType });
        }
    }
    /**
     * Get maintenance burden metrics
     *
     * Demonstrates the value of Settler's adapter maintenance
     */
    async getMaintenanceBurdenMetrics() {
        try {
            // Get all adapters
            const adaptersResult = await (0, db_1.query)(`SELECT DISTINCT adapter_type
        FROM ingestion_sources
        WHERE deleted_at IS NULL`, []);
            const totalAdapters = adaptersResult.length;
            // Get maintenance events from last 30 days
            const maintenanceEvents = await (0, db_1.query)(`SELECT metadata
        FROM usage_events
        WHERE event_type = 'adapter_maintenance'
        AND timestamp > NOW() - INTERVAL '30 days'`, []);
            const totalMaintenanceEvents = maintenanceEvents.length;
            const averageEventsPerAdapter = totalAdapters > 0 ? totalMaintenanceEvents / totalAdapters : 0;
            // Calculate total affected customers
            let totalAffectedCustomers = 0;
            for (const event of maintenanceEvents) {
                const metadata = JSON.parse(event.metadata);
                totalAffectedCustomers += metadata.affectedCustomers || 0;
            }
            // Estimate maintenance cost (200-400 hours/year per adapter × $100/hour)
            const maintenanceCostEstimate = totalAdapters * 300 * 100; // $30K per adapter per year
            return {
                totalAdapters,
                totalMaintenanceEvents,
                averageEventsPerAdapter,
                totalAffectedCustomers,
                maintenanceCostEstimate,
            };
        }
        catch (error) {
            (0, logger_1.logError)('Failed to get maintenance burden metrics', error);
            return {
                totalAdapters: 0,
                totalMaintenanceEvents: 0,
                averageEventsPerAdapter: 0,
                totalAffectedCustomers: 0,
                maintenanceCostEstimate: 0,
            };
        }
    }
}
exports.AdapterHealthMonitoringService = AdapterHealthMonitoringService;
exports.adapterHealthMonitoringService = new AdapterHealthMonitoringService();
//# sourceMappingURL=adapter-health-monitoring.js.map