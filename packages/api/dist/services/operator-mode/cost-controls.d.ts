/**
 * Cost Controls Service
 * Usage ceilings per tenant and background job limits
 */
export interface TenantUsageCeiling {
    tenantId: string;
    billingAccountId: string;
    usageType: 'ingestions' | 'reconciliations' | 'api_requests' | 'storage';
    monthlyLimit: number;
    currentUsage: number;
    resetDate: Date;
}
export interface BackgroundJobLimit {
    jobType: 'ingestion' | 'reconciliation' | 'webhook' | 'export';
    maxConcurrent: number;
    currentRunning: number;
    maxPerTenant: number;
}
/**
 * Set usage ceiling for a tenant
 */
export declare function setTenantUsageCeiling(tenantId: string, billingAccountId: string, usageType: TenantUsageCeiling['usageType'], monthlyLimit: number): Promise<void>;
/**
 * Check if tenant has exceeded usage ceiling
 */
export declare function checkUsageCeiling(tenantId: string, usageType: TenantUsageCeiling['usageType']): Promise<{
    exceeded: boolean;
    currentUsage: number;
    limit: number;
}>;
/**
 * Set background job limit
 */
export declare function setBackgroundJobLimit(jobType: BackgroundJobLimit['jobType'], maxConcurrent: number, maxPerTenant: number): Promise<void>;
/**
 * Check if background job can run
 */
export declare function canRunBackgroundJob(jobType: BackgroundJobLimit['jobType'], tenantId?: string): Promise<{
    allowed: boolean;
    reason?: string;
    currentRunning: number;
    limit: number;
}>;
/**
 * Get all tenant usage ceilings
 */
export declare function getAllUsageCeilings(): Promise<TenantUsageCeiling[]>;
//# sourceMappingURL=cost-controls.d.ts.map