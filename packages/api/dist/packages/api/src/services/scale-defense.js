"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.scaleDefenseService = exports.ScaleDefenseService = void 0;
const client_1 = require("../infrastructure/supabase/client");
const logger_1 = require("../utils/logger");
class ScaleDefenseService {
    throttleCache = new Map();
    killSwitchCache = new Map();
    /**
     * Check if tenant is throttled
     */
    async checkTenantThrottle(tenantId) {
        try {
            // Check cache first
            const cached = this.throttleCache.get(tenantId);
            if (cached && cached.until && cached.until > new Date()) {
                return cached;
            }
            // Check kill switch
            const killSwitch = await this.getKillSwitch('tenant', tenantId);
            if (killSwitch?.isActive) {
                return {
                    tenantId,
                    throttleLevel: 'blocked',
                    reason: killSwitch.reason,
                    requestsPerSecond: 0,
                    requestsPerMinute: 0,
                };
            }
            // Get tenant's recent request rate
            const requestRate = await this.getTenantRequestRate(tenantId);
            // Determine throttle level based on request rate
            const throttleLevel = this.determineThrottleLevel(requestRate);
            // Get plan-based limits
            const planLimits = await this.getPlanLimits(tenantId);
            const throttle = {
                tenantId,
                throttleLevel,
                requestsPerSecond: this.getRequestsPerSecond(throttleLevel, planLimits),
                requestsPerMinute: this.getRequestsPerMinute(throttleLevel, planLimits),
            };
            // Cache throttle
            this.throttleCache.set(tenantId, throttle);
            return throttle;
        }
        catch (error) {
            (0, logger_1.logError)('Error checking tenant throttle', error);
            // Fail open - allow request if throttle check fails
            return {
                tenantId,
                throttleLevel: 'none',
                requestsPerSecond: 100,
                requestsPerMinute: 6000,
            };
        }
    }
    /**
     * Get tenant request rate
     */
    async getTenantRequestRate(tenantId) {
        try {
            const now = new Date();
            const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
            // Count requests in last minute
            const { count: minuteCount } = await client_1.supabase
                .from('usage_events')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', tenantId)
                .eq('event_type', 'api_request')
                .gte('timestamp', oneMinuteAgo.toISOString());
            // Count requests in last hour
            const { count: hourCount } = await client_1.supabase
                .from('usage_events')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', tenantId)
                .eq('event_type', 'api_request')
                .gte('timestamp', oneHourAgo.toISOString());
            return {
                requestsPerSecond: (minuteCount || 0) / 60,
                requestsPerMinute: minuteCount || 0,
                requestsPerHour: hourCount || 0,
            };
        }
        catch (error) {
            (0, logger_1.logError)('Error getting tenant request rate', error);
            return {
                requestsPerSecond: 0,
                requestsPerMinute: 0,
                requestsPerHour: 0,
            };
        }
    }
    /**
     * Determine throttle level
     */
    determineThrottleLevel(requestRate) {
        // Thresholds (adjust based on plan)
        if (requestRate.requestsPerSecond > 100)
            return 'heavy';
        if (requestRate.requestsPerSecond > 50)
            return 'moderate';
        if (requestRate.requestsPerSecond > 20)
            return 'light';
        return 'none';
    }
    /**
     * Get requests per second for throttle level
     */
    getRequestsPerSecond(throttleLevel, planLimits) {
        const multipliers = {
            none: 1.0,
            light: 0.8,
            moderate: 0.5,
            heavy: 0.2,
            blocked: 0,
        };
        return planLimits.baseRps * multipliers[throttleLevel];
    }
    /**
     * Get requests per minute for throttle level
     */
    getRequestsPerMinute(throttleLevel, planLimits) {
        const multipliers = {
            none: 1.0,
            light: 0.8,
            moderate: 0.5,
            heavy: 0.2,
            blocked: 0,
        };
        return planLimits.baseRpm * multipliers[throttleLevel];
    }
    /**
     * Get plan limits
     */
    async getPlanLimits(_tenantId) {
        // Get tenant's plan (simplified - in production, query subscription)
        // Default limits
        return {
            baseRps: 100,
            baseRpm: 6000,
        };
    }
    /**
     * Prioritize background job
     */
    async prioritizeJob(tenantId, jobId, jobType, estimatedDuration) {
        try {
            // Determine priority based on job type and tenant
            let priority = 'normal';
            // Critical jobs: reconciliation results, exports
            if (jobType === 'reconciliation' || jobType === 'export') {
                priority = 'critical';
            }
            // High priority: syncs, webhooks
            if (jobType === 'sync' || jobType === 'webhook') {
                priority = 'high';
            }
            // Low priority: analytics, reporting
            if (jobType === 'analytics' || jobType === 'reporting') {
                priority = 'low';
            }
            // Check tenant throttle
            const throttle = await this.checkTenantThrottle(tenantId);
            if (throttle.throttleLevel === 'heavy' || throttle.throttleLevel === 'blocked') {
                priority = 'low'; // Degrade priority for throttled tenants
            }
            return {
                jobId,
                tenantId,
                priority,
                estimatedDuration,
                resourceRequirements: {
                    cpu: this.estimateCpuRequirement(jobType),
                    memory: this.estimateMemoryRequirement(jobType),
                    io: this.estimateIoRequirement(jobType),
                },
            };
        }
        catch (error) {
            (0, logger_1.logError)('Error prioritizing job', error);
            return {
                jobId,
                tenantId,
                priority: 'normal',
                estimatedDuration,
                resourceRequirements: {
                    cpu: 0.5,
                    memory: 512,
                    io: 0.5,
                },
            };
        }
    }
    /**
     * Estimate CPU requirement
     */
    estimateCpuRequirement(jobType) {
        const requirements = {
            reconciliation: 0.8,
            export: 0.6,
            sync: 0.4,
            webhook: 0.2,
            analytics: 0.3,
            reporting: 0.2,
        };
        return requirements[jobType] || 0.5;
    }
    /**
     * Estimate memory requirement
     */
    estimateMemoryRequirement(jobType) {
        const requirements = {
            reconciliation: 2048,
            export: 1024,
            sync: 512,
            webhook: 256,
            analytics: 512,
            reporting: 256,
        };
        return requirements[jobType] || 512;
    }
    /**
     * Estimate IO requirement
     */
    estimateIoRequirement(jobType) {
        const requirements = {
            reconciliation: 0.8,
            export: 0.9,
            sync: 0.6,
            webhook: 0.3,
            analytics: 0.5,
            reporting: 0.4,
        };
        return requirements[jobType] || 0.5;
    }
    /**
     * Activate kill switch
     */
    async activateKillSwitch(targetType, targetId, reason) {
        try {
            const killSwitch = {
                id: `${targetType}:${targetId}`,
                targetType,
                targetId,
                reason,
                isActive: true,
                createdAt: new Date(),
                activatedAt: new Date(),
            };
            // Store in cache
            this.killSwitchCache.set(killSwitch.id, killSwitch);
            // Store in database
            await client_1.supabase
                .from('usage_events')
                .insert({
                tenant_id: targetId, // Simplified
                event_type: 'kill_switch',
                quantity: 1,
                metadata: {
                    target_type: targetType,
                    target_id: targetId,
                    reason,
                    is_active: true,
                    activated_at: new Date().toISOString(),
                },
            });
            (0, logger_1.logWarn)('Kill switch activated', { targetType, targetId, reason });
            return killSwitch;
        }
        catch (error) {
            (0, logger_1.logError)('Error activating kill switch', error);
            throw error;
        }
    }
    /**
     * Deactivate kill switch
     */
    async deactivateKillSwitch(targetType, targetId) {
        try {
            const killSwitchId = `${targetType}:${targetId}`;
            const killSwitch = this.killSwitchCache.get(killSwitchId);
            if (killSwitch) {
                killSwitch.isActive = false;
                killSwitch.deactivatedAt = new Date();
                this.killSwitchCache.set(killSwitchId, killSwitch);
            }
            (0, logger_1.logInfo)('Kill switch deactivated', { targetType, targetId });
        }
        catch (error) {
            (0, logger_1.logError)('Error deactivating kill switch', error);
        }
    }
    /**
     * Get kill switch
     */
    async getKillSwitch(targetType, targetId) {
        try {
            const killSwitchId = `${targetType}:${targetId}`;
            const cached = this.killSwitchCache.get(killSwitchId);
            if (cached) {
                return cached;
            }
            // Query database
            const { data } = await client_1.supabase
                .from('usage_events')
                .select('*')
                .eq('event_type', 'kill_switch')
                .eq('metadata->>target_type', targetType)
                .eq('metadata->>target_id', targetId)
                .eq('metadata->>is_active', true)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            if (data) {
                const killSwitch = {
                    id: killSwitchId,
                    targetType,
                    targetId,
                    reason: data.metadata?.reason || 'Unknown',
                    isActive: true,
                    createdAt: new Date(data.created_at),
                    activatedAt: data.metadata?.activated_at ? new Date(data.metadata.activated_at) : undefined,
                };
                this.killSwitchCache.set(killSwitchId, killSwitch);
                return killSwitch;
            }
            return null;
        }
        catch (error) {
            (0, logger_1.logError)('Error getting kill switch', error);
            return null;
        }
    }
    /**
     * Check if operation should be degraded
     */
    async shouldDegrade(tenantId, _operationType) {
        try {
            // Check kill switch
            const killSwitch = await this.getKillSwitch('tenant', tenantId);
            if (killSwitch?.isActive) {
                return {
                    degrade: true,
                    reason: killSwitch.reason,
                    degradedFeatures: ['all'],
                };
            }
            // Check throttle
            const throttle = await this.checkTenantThrottle(tenantId);
            if (throttle.throttleLevel === 'heavy' || throttle.throttleLevel === 'moderate') {
                return {
                    degrade: true,
                    reason: `Tenant throttled: ${throttle.throttleLevel}`,
                    degradedFeatures: ['background_jobs', 'analytics', 'reporting'],
                };
            }
            return { degrade: false };
        }
        catch (error) {
            (0, logger_1.logError)('Error checking degradation', error);
            return { degrade: false };
        }
    }
}
exports.ScaleDefenseService = ScaleDefenseService;
exports.scaleDefenseService = new ScaleDefenseService();
//# sourceMappingURL=scale-defense.js.map