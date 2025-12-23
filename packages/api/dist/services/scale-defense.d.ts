/**
 * Scale Defense Service
 *
 * PHASE 6: Operational Scale Defense
 *
 * Ensures Settler scales better than competitors:
 * - Tenant-level isolation and throttling
 * - Background job prioritization
 * - Graceful degradation under load
 * - Kill switches for misbehaving integrations
 *
 * Goal: Growth does not increase fragility, failures are local not systemic
 */
export interface TenantThrottle {
    tenantId: string;
    throttleLevel: 'none' | 'light' | 'moderate' | 'heavy' | 'blocked';
    reason?: string;
    until?: Date;
    requestsPerSecond: number;
    requestsPerMinute: number;
}
export interface JobPriority {
    jobId: string;
    tenantId: string;
    priority: 'critical' | 'high' | 'normal' | 'low';
    estimatedDuration: number;
    resourceRequirements: {
        cpu: number;
        memory: number;
        io: number;
    };
}
export interface KillSwitch {
    id: string;
    targetType: 'integration' | 'tenant' | 'feature';
    targetId: string;
    reason: string;
    isActive: boolean;
    createdAt: Date;
    activatedAt?: Date;
    deactivatedAt?: Date;
}
export declare class ScaleDefenseService {
    private throttleCache;
    private killSwitchCache;
    /**
     * Check if tenant is throttled
     */
    checkTenantThrottle(tenantId: string): Promise<TenantThrottle>;
    /**
     * Get tenant request rate
     */
    private getTenantRequestRate;
    /**
     * Determine throttle level
     */
    private determineThrottleLevel;
    /**
     * Get requests per second for throttle level
     */
    private getRequestsPerSecond;
    /**
     * Get requests per minute for throttle level
     */
    private getRequestsPerMinute;
    /**
     * Get plan limits
     */
    private getPlanLimits;
    /**
     * Prioritize background job
     */
    prioritizeJob(tenantId: string, jobId: string, jobType: string, estimatedDuration: number): Promise<JobPriority>;
    /**
     * Estimate CPU requirement
     */
    private estimateCpuRequirement;
    /**
     * Estimate memory requirement
     */
    private estimateMemoryRequirement;
    /**
     * Estimate IO requirement
     */
    private estimateIoRequirement;
    /**
     * Activate kill switch
     */
    activateKillSwitch(targetType: KillSwitch['targetType'], targetId: string, reason: string): Promise<KillSwitch>;
    /**
     * Deactivate kill switch
     */
    deactivateKillSwitch(targetType: KillSwitch['targetType'], targetId: string): Promise<void>;
    /**
     * Get kill switch
     */
    getKillSwitch(targetType: KillSwitch['targetType'], targetId: string): Promise<KillSwitch | null>;
    /**
     * Check if operation should be degraded
     */
    shouldDegrade(tenantId: string, _operationType: string): Promise<{
        degrade: boolean;
        reason?: string;
        degradedFeatures?: string[];
    }>;
}
export declare const scaleDefenseService: ScaleDefenseService;
//# sourceMappingURL=scale-defense.d.ts.map