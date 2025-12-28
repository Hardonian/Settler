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
export interface AdapterHealthMetrics {
    adapterType: string;
    healthStatus: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
    lastChecked: Date;
    successRate: number;
    averageResponseTime: number;
    errorRate: number;
    apiChangesDetected: number;
    maintenanceEvents: number;
    lastMaintenanceEvent?: Date;
}
export interface AdapterMaintenanceEvent {
    adapterType: string;
    eventType: 'api_change' | 'bug_fix' | 'feature_update' | 'security_patch';
    description: string;
    affectedCustomers: number;
    resolvedAt: Date;
}
/**
 * Adapter Health Monitoring Service
 *
 * Tracks adapter health and maintenance to demonstrate value
 */
export declare class AdapterHealthMonitoringService {
    /**
     * Record adapter health check
     */
    recordHealthCheck(adapterType: string, metrics: {
        success: boolean;
        responseTime: number;
        error?: string;
    }): Promise<void>;
    /**
     * Get adapter health metrics
     */
    getAdapterHealth(adapterType: string): Promise<AdapterHealthMetrics>;
    /**
     * Record adapter maintenance event
     *
     * Tracks when adapters are updated, demonstrating maintenance value
     */
    recordMaintenanceEvent(adapterType: string, event: AdapterMaintenanceEvent): Promise<void>;
    /**
     * Get maintenance burden metrics
     *
     * Demonstrates the value of Settler's adapter maintenance
     */
    getMaintenanceBurdenMetrics(): Promise<{
        totalAdapters: number;
        totalMaintenanceEvents: number;
        averageEventsPerAdapter: number;
        totalAffectedCustomers: number;
        maintenanceCostEstimate: number;
    }>;
}
export declare const adapterHealthMonitoringService: AdapterHealthMonitoringService;
//# sourceMappingURL=adapter-health-monitoring.d.ts.map