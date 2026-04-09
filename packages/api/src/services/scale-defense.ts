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

import { supabase } from "../infrastructure/supabase/client";
import { logError, logWarn, logInfo } from "../utils/logger";

export interface TenantThrottle {
  tenantId: string;
  throttleLevel: "none" | "light" | "moderate" | "heavy" | "blocked";
  reason?: string;
  until?: Date;
  requestsPerSecond: number;
  requestsPerMinute: number;
}

export interface JobPriority {
  jobId: string;
  tenantId: string;
  priority: "critical" | "high" | "normal" | "low";
  estimatedDuration: number; // seconds
  resourceRequirements: {
    cpu: number; // 0-1
    memory: number; // MB
    io: number; // 0-1
  };
}

export interface KillSwitch {
  id: string;
  targetType: "integration" | "tenant" | "feature";
  targetId: string;
  reason: string;
  isActive: boolean;
  createdAt: Date;
  activatedAt?: Date;
  deactivatedAt?: Date;
}

export class ScaleDefenseService {
  private throttleCache: Map<string, TenantThrottle> = new Map();
  private killSwitchCache: Map<string, KillSwitch> = new Map();

  /**
   * Check if tenant is throttled
   */
  async checkTenantThrottle(tenantId: string): Promise<TenantThrottle> {
    try {
      // Check cache first
      const cached = this.throttleCache.get(tenantId);
      if (cached && cached.until && cached.until > new Date()) {
        return cached;
      }

      // Check kill switch
      const killSwitch = await this.getKillSwitch("tenant", tenantId);
      if (killSwitch?.isActive) {
        return {
          tenantId,
          throttleLevel: "blocked",
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

      const throttle: TenantThrottle = {
        tenantId,
        throttleLevel,
        requestsPerSecond: this.getRequestsPerSecond(throttleLevel, planLimits),
        requestsPerMinute: this.getRequestsPerMinute(throttleLevel, planLimits),
      };

      // Cache throttle
      this.throttleCache.set(tenantId, throttle);

      return throttle;
    } catch (error) {
      logError("Error checking tenant throttle", error);
      // Fail open - allow request if throttle check fails
      return {
        tenantId,
        throttleLevel: "none",
        requestsPerSecond: 100,
        requestsPerMinute: 6000,
      };
    }
  }

  /**
   * Get tenant request rate
   */
  private async getTenantRequestRate(tenantId: string): Promise<{
    requestsPerSecond: number;
    requestsPerMinute: number;
    requestsPerHour: number;
  }> {
    try {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Count requests in last minute
      const { count: minuteCount } = await supabase
        .from("usage_events")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("event_type", "api_request")
        .gte("timestamp", oneMinuteAgo.toISOString());

      // Count requests in last hour
      const { count: hourCount } = await supabase
        .from("usage_events")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("event_type", "api_request")
        .gte("timestamp", oneHourAgo.toISOString());

      return {
        requestsPerSecond: (minuteCount || 0) / 60,
        requestsPerMinute: minuteCount || 0,
        requestsPerHour: hourCount || 0,
      };
    } catch (error) {
      logError("Error getting tenant request rate", error);
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
  private determineThrottleLevel(requestRate: {
    requestsPerSecond: number;
    requestsPerMinute: number;
    requestsPerHour: number;
  }): TenantThrottle["throttleLevel"] {
    // Thresholds (adjust based on plan)
    if (requestRate.requestsPerSecond > 100) return "heavy";
    if (requestRate.requestsPerSecond > 50) return "moderate";
    if (requestRate.requestsPerSecond > 20) return "light";
    return "none";
  }

  /**
   * Get requests per second for throttle level
   */
  private getRequestsPerSecond(
    throttleLevel: TenantThrottle["throttleLevel"],
    planLimits: { baseRps: number }
  ): number {
    const multipliers: Record<TenantThrottle["throttleLevel"], number> = {
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
  private getRequestsPerMinute(
    throttleLevel: TenantThrottle["throttleLevel"],
    planLimits: { baseRpm: number }
  ): number {
    const multipliers: Record<TenantThrottle["throttleLevel"], number> = {
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
  private async getPlanLimits(_tenantId: string): Promise<{ baseRps: number; baseRpm: number }> {
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
  async prioritizeJob(
    tenantId: string,
    jobId: string,
    jobType: string,
    estimatedDuration: number
  ): Promise<JobPriority> {
    try {
      // Determine priority based on job type and tenant
      let priority: JobPriority["priority"] = "normal";

      // Critical jobs: reconciliation results, exports
      if (jobType === "reconciliation" || jobType === "export") {
        priority = "critical";
      }

      // High priority: syncs, webhooks
      if (jobType === "sync" || jobType === "webhook") {
        priority = "high";
      }

      // Low priority: analytics, reporting
      if (jobType === "analytics" || jobType === "reporting") {
        priority = "low";
      }

      // Check tenant throttle
      const throttle = await this.checkTenantThrottle(tenantId);
      if (throttle.throttleLevel === "heavy" || throttle.throttleLevel === "blocked") {
        priority = "low"; // Degrade priority for throttled tenants
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
    } catch (error) {
      logError("Error prioritizing job", error);
      return {
        jobId,
        tenantId,
        priority: "normal",
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
  private estimateCpuRequirement(jobType: string): number {
    const requirements: Record<string, number> = {
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
  private estimateMemoryRequirement(jobType: string): number {
    const requirements: Record<string, number> = {
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
  private estimateIoRequirement(jobType: string): number {
    const requirements: Record<string, number> = {
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
  async activateKillSwitch(
    targetType: KillSwitch["targetType"],
    targetId: string,
    reason: string
  ): Promise<KillSwitch> {
    try {
      const killSwitch: KillSwitch = {
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
      await supabase.from("usage_events").insert({
        tenant_id: targetId, // Simplified
        event_type: "kill_switch",
        quantity: 1,
        metadata: {
          target_type: targetType,
          target_id: targetId,
          reason,
          is_active: true,
          activated_at: new Date().toISOString(),
        },
      });

      logWarn("Kill switch activated", { targetType, targetId, reason });

      return killSwitch;
    } catch (error) {
      logError("Error activating kill switch", error);
      throw error;
    }
  }

  /**
   * Deactivate kill switch
   */
  async deactivateKillSwitch(
    targetType: KillSwitch["targetType"],
    targetId: string
  ): Promise<void> {
    try {
      const killSwitchId = `${targetType}:${targetId}`;
      const killSwitch = this.killSwitchCache.get(killSwitchId);

      if (killSwitch) {
        killSwitch.isActive = false;
        killSwitch.deactivatedAt = new Date();
        this.killSwitchCache.set(killSwitchId, killSwitch);
      }

      logInfo("Kill switch deactivated", { targetType, targetId });
    } catch (error) {
      logError("Error deactivating kill switch", error);
    }
  }

  /**
   * Get kill switch
   */
  async getKillSwitch(
    targetType: KillSwitch["targetType"],
    targetId: string
  ): Promise<KillSwitch | null> {
    try {
      const killSwitchId = `${targetType}:${targetId}`;
      const cached = this.killSwitchCache.get(killSwitchId);
      if (cached) {
        return cached;
      }

      // Query database
      const { data } = await supabase
        .from("usage_events")
        .select("*")
        .eq("event_type", "kill_switch")
        .eq("metadata->>target_type", targetType)
        .eq("metadata->>target_id", targetId)
        .eq("metadata->>is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        const killSwitch: KillSwitch = {
          id: killSwitchId,
          targetType,
          targetId,
          reason: (data.metadata?.reason as string) || "Unknown",
          isActive: true,
          createdAt: new Date(data.created_at),
          activatedAt: data.metadata?.activated_at
            ? new Date(data.metadata.activated_at as string)
            : undefined,
        };
        this.killSwitchCache.set(killSwitchId, killSwitch);
        return killSwitch;
      }

      return null;
    } catch (error) {
      logError("Error getting kill switch", error);
      return null;
    }
  }

  /**
   * Check if operation should be degraded
   */
  async shouldDegrade(
    tenantId: string,
    _operationType: string
  ): Promise<{
    degrade: boolean;
    reason?: string;
    degradedFeatures?: string[];
  }> {
    try {
      // Check kill switch
      const killSwitch = await this.getKillSwitch("tenant", tenantId);
      if (killSwitch?.isActive) {
        return {
          degrade: true,
          reason: killSwitch.reason,
          degradedFeatures: ["all"],
        };
      }

      // Check throttle
      const throttle = await this.checkTenantThrottle(tenantId);
      if (throttle.throttleLevel === "heavy" || throttle.throttleLevel === "moderate") {
        return {
          degrade: true,
          reason: `Tenant throttled: ${throttle.throttleLevel}`,
          degradedFeatures: ["background_jobs", "analytics", "reporting"],
        };
      }

      return { degrade: false };
    } catch (error) {
      logError("Error checking degradation", error);
      return { degrade: false };
    }
  }
}

export const scaleDefenseService = new ScaleDefenseService();
