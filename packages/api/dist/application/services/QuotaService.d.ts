/**
 * Quota Service
 * Enforces resource quotas for tenants
 */
import { ITenantRepository } from '../../domain/repositories/ITenantRepository';
export declare enum QuotaType {
    RATE_LIMIT = "rateLimitRpm",
    STORAGE = "storageBytes",
    CONCURRENT_JOBS = "concurrentJobs",
    MONTHLY_RECONCILIATIONS = "monthlyReconciliations",
    CUSTOM_DOMAINS = "customDomains"
}
export declare class QuotaExceededError extends Error {
    quotaType: QuotaType;
    currentUsage: number;
    limit: number;
    constructor(quotaType: QuotaType, currentUsage: number, limit: number);
}
export declare class QuotaService {
    private tenantRepo;
    constructor(tenantRepo: ITenantRepository);
    /**
     * Check if tenant can perform an action within quota limits
     */
    checkQuota(tenantId: string, quotaType: QuotaType, requestedValue?: number): Promise<{
        allowed: boolean;
        currentUsage: number;
        limit: number;
    }>;
    /**
     * Enforce quota - throws QuotaExceededError if exceeded
     */
    enforceQuota(tenantId: string, quotaType: QuotaType, requestedValue?: number): Promise<void>;
    /**
     * Increment quota usage
     */
    incrementUsage(tenantId: string, quotaType: QuotaType, value?: number): Promise<void>;
    /**
     * Decrement quota usage
     */
    decrementUsage(tenantId: string, quotaType: QuotaType, value?: number): Promise<void>;
    /**
     * Get current usage for all quotas
     */
    getUsage(tenantId: string): Promise<Record<QuotaType, {
        current: number;
        limit: number;
    }>>;
}
//# sourceMappingURL=QuotaService.d.ts.map