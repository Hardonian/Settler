/**
 * Multi-Region & Failover
 *
 * Regional redundancy, tenant locality, failover routing, isolated execution zones
 * Part 11: Resilience & Zero-Fault Hardening
 */
export interface Region {
    id: string;
    name: string;
    endpoint: string;
    latency: number;
    available: boolean;
}
export interface TenantLocality {
    tenantId: string;
    preferredRegion: string;
    fallbackRegions: string[];
}
export declare class MultiRegionManager {
    private regions;
    private tenantLocalities;
    constructor();
    /**
     * Register tenant locality
     */
    registerTenantLocality(locality: TenantLocality): Promise<void>;
    /**
     * Get optimal region for tenant
     */
    getOptimalRegion(tenantId: string): Region;
    /**
     * Route with failover
     */
    routeWithFailover(tenantId: string, _request: Record<string, unknown>): Promise<{
        region: Region;
        attempts: number;
    }>;
    /**
     * Mark region as unavailable
     */
    markRegionUnavailable(regionId: string): void;
    /**
     * Mark region as available
     */
    markRegionAvailable(regionId: string): void;
    /**
     * Get isolated execution zone
     */
    getIsolatedExecutionZone(tenantId: string): string;
}
//# sourceMappingURL=multi-region.d.ts.map