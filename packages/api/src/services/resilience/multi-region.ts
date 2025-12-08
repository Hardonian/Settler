/**
 * Multi-Region & Failover
 * 
 * Regional redundancy, tenant locality, failover routing, isolated execution zones
 * Part 11: Resilience & Zero-Fault Hardening
 */

import { logInfo, logWarning } from '../../utils/logger';

export interface Region {
  id: string;
  name: string;
  endpoint: string;
  latency: number; // milliseconds
  available: boolean;
}

export interface TenantLocality {
  tenantId: string;
  preferredRegion: string;
  fallbackRegions: string[];
}

export class MultiRegionManager {
  private regions: Map<string, Region> = new Map();
  private tenantLocalities: Map<string, TenantLocality> = new Map();

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
  async registerTenantLocality(locality: TenantLocality): Promise<void> {
    this.tenantLocalities.set(locality.tenantId, locality);
    logInfo('Tenant locality registered', { tenantId: locality.tenantId });
  }

  /**
   * Get optimal region for tenant
   */
  getOptimalRegion(tenantId: string): Region {
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

    return availableRegions[0] || this.regions.get('us-east-1')!;
  }

  /**
   * Route with failover
   */
  async routeWithFailover(
    tenantId: string,
    request: any
  ): Promise<{
    region: Region;
    attempts: number;
  }> {
    const locality = this.tenantLocalities.get(tenantId);
    const regionsToTry = locality
      ? [locality.preferredRegion, ...locality.fallbackRegions]
      : Array.from(this.regions.keys());

    for (let i = 0; i < regionsToTry.length; i++) {
      const regionId = regionsToTry[i];
      const region = this.regions.get(regionId);

      if (region && region.available) {
        try {
          // TODO: Execute request
          return {
            region,
            attempts: i + 1,
          };
        } catch (error: any) {
          logWarning('Region request failed, trying next', {
            regionId,
            error: error.message,
          });
        }
      }
    }

    throw new Error('All regions failed');
  }

  /**
   * Mark region as unavailable
   */
  markRegionUnavailable(regionId: string): void {
    const region = this.regions.get(regionId);
    if (region) {
      region.available = false;
      logWarning('Region marked as unavailable', { regionId });
    }
  }

  /**
   * Mark region as available
   */
  markRegionAvailable(regionId: string): void {
    const region = this.regions.get(regionId);
    if (region) {
      region.available = true;
      logInfo('Region marked as available', { regionId });
    }
  }

  /**
   * Get isolated execution zone
   */
  getIsolatedExecutionZone(tenantId: string): string {
    // Return isolated zone identifier
    return `zone-${tenantId}`;
  }
}
