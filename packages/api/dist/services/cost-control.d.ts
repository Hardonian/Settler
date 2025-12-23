/**
 * Cost Control Service
 *
 * PHASE 1: Cost Surface & Marginal Cost Audit
 *
 * Enumerates all cost drivers and implements:
 * - Hard caps per tenant
 * - Backpressure mechanisms
 * - Degradation paths
 * - Abuse scenario mitigation
 *
 * Goal: Marginal cost per tenant trends downward, no single tenant can spike global cost
 */
export interface CostDriver {
    id: string;
    name: string;
    category: 'compute' | 'storage' | 'external_api' | 'retries' | 'support';
    unit: string;
    baseCostPerUnit: number;
    scalingBehavior: 'linear' | 'sublinear' | 'fixed';
}
export interface TenantCostLimits {
    tenantId: string;
    billingAccountId: string;
    planId: string;
    limits: Record<string, {
        daily: number;
        monthly: number;
        burst: number;
    }>;
    currentUsage: Record<string, {
        daily: number;
        monthly: number;
        lastReset: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
}
export interface CostControlResult {
    allowed: boolean;
    reason?: string;
    currentUsage?: number;
    limit?: number;
    retryAfter?: number;
    degradedMode?: boolean;
}
export declare const COST_DRIVERS: Record<string, CostDriver>;
export declare class CostControlService {
    /**
     * Check if a cost driver operation is allowed
     */
    checkCostLimit(tenantId: string, billingAccountId: string, costDriverId: string, quantity?: number): Promise<CostControlResult>;
    /**
     * Record cost usage
     */
    recordCostUsage(tenantId: string, billingAccountId: string, costDriverId: string, quantity?: number): Promise<void>;
    /**
     * Get tenant cost limits
     */
    private getTenantCostLimits;
    /**
     * Invalidate cost limits cache
     */
    private invalidateCostLimitsCache;
    /**
     * Get seconds until midnight UTC
     */
    private getSecondsUntilMidnight;
    /**
     * Get seconds until end of month
     */
    private getSecondsUntilMonthEnd;
    /**
     * Get estimated cost for a tenant
     */
    getEstimatedCost(tenantId: string, billingAccountId: string, period?: 'daily' | 'monthly'): Promise<number>;
    /**
     * Check for abuse scenarios
     */
    detectAbuse(tenantId: string, billingAccountId: string): Promise<{
        isAbuse: boolean;
        reason?: string;
        actions: string[];
    }>;
}
export declare const costControlService: CostControlService;
//# sourceMappingURL=cost-control.d.ts.map