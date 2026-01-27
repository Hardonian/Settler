"use strict";
/**
 * Multi-Region & Failover
 *
 * Regional redundancy, tenant locality, failover routing, isolated execution zones
 * Part 11: Resilience & Zero-Fault Hardening
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiRegionManager = void 0;
const logger_1 = require("../../utils/logger");
class MultiRegionManager {
    regions = new Map();
    tenantLocalities = new Map();
    constructor() {
        // Initialize default regions
        this.regions.set('us-east-1', {
            id: 'us-east-1',
            name: 'US East (N. Virginia)',
            endpoint: 'https://api-us-east-1.settler.io',
            latency: 50,
            available: true,
        });
        this.regions.set('us-west-2', {
            id: 'us-west-2',
            name: 'US West (Oregon)',
            endpoint: 'https://api-us-west-2.settler.io',
            latency: 60,
            available: true,
        });
        this.regions.set('eu-west-1', {
            id: 'eu-west-1',
            name: 'EU (Ireland)',
            endpoint: 'https://api-eu-west-1.settler.io',
            latency: 80,
            available: true,
        });
    }
    /**
     * Register tenant locality
     */
    async registerTenantLocality(locality) {
        this.tenantLocalities.set(locality.tenantId, locality);
        (0, logger_1.logInfo)('Tenant locality registered', { tenantId: locality.tenantId });
    }
    /**
     * Get optimal region for tenant
     */
    getOptimalRegion(tenantId) {
        const locality = this.tenantLocalities.get(tenantId);
        if (locality) {
            // Try preferred region first
            const preferred = this.regions.get(locality.preferredRegion);
            if (preferred && preferred.available) {
                return preferred;
            }
            // Try fallback regions
            for (const fallbackId of locality.fallbackRegions) {
                const fallback = this.regions.get(fallbackId);
                if (fallback && fallback.available) {
                    return fallback;
                }
            }
        }
        // Default to lowest latency available region
        const availableRegions = Array.from(this.regions.values())
            .filter(r => r.available)
            .sort((a, b) => a.latency - b.latency);
        return availableRegions[0] || this.regions.get('us-east-1');
    }
    /**
     * Route with failover
     */
    async routeWithFailover(tenantId, _request) {
        const locality = this.tenantLocalities.get(tenantId);
        const regionsToTry = locality
            ? [locality.preferredRegion, ...locality.fallbackRegions]
            : Array.from(this.regions.keys());
        for (let i = 0; i < regionsToTry.length; i++) {
            const regionId = regionsToTry[i];
            if (!regionId)
                continue;
            const region = this.regions.get(regionId);
            if (region && region.available) {
                try {
                    // TODO: Execute request
                    return {
                        region,
                        attempts: i + 1,
                    };
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    (0, logger_1.logWarn)('Region request failed, trying next', {
                        regionId,
                        error: errorMessage,
                    });
                }
            }
        }
        throw new Error('All regions failed');
    }
    /**
     * Mark region as unavailable
     */
    markRegionUnavailable(regionId) {
        const region = this.regions.get(regionId);
        if (region) {
            region.available = false;
            (0, logger_1.logWarn)('Region marked as unavailable', { regionId });
        }
    }
    /**
     * Mark region as available
     */
    markRegionAvailable(regionId) {
        const region = this.regions.get(regionId);
        if (region) {
            region.available = true;
            (0, logger_1.logInfo)('Region marked as available', { regionId });
        }
    }
    /**
     * Get isolated execution zone
     */
    getIsolatedExecutionZone(tenantId) {
        // Return isolated zone identifier
        return `zone-${tenantId}`;
    }
}
exports.MultiRegionManager = MultiRegionManager;
//# sourceMappingURL=multi-region.js.map