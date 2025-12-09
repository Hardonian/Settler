/**
 * Noisy Neighbor Detection Service
 * Identifies tenants consuming excessive resources
 */
export interface NoisyNeighborAlert {
    tenantId: string;
    tenantTier: string;
    resourceType: string;
    currentUsage: number;
    averageUsage: number;
    threshold: number;
    severity: 'warning' | 'critical';
    timestamp: Date;
}
export declare class NoisyNeighborDetection {
    /**
     * Detect noisy neighbors based on resource usage
     */
    detectNoisyNeighbors(timeWindowMinutes?: number): Promise<NoisyNeighborAlert[]>;
    /**
     * Detect tenants with excessive database usage
     */
    private detectDatabaseNoise;
    /**
     * Detect tenants with excessive API request rates
     */
    private detectApiNoise;
    /**
     * Detect tenants with excessive concurrent jobs
     */
    private detectJobNoise;
    /**
     * Send alerts for noisy neighbors
     */
    sendAlerts(alerts: NoisyNeighborAlert[]): Promise<void>;
}
//# sourceMappingURL=NoisyNeighborDetection.d.ts.map