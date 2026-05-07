import { supabase } from "../../infrastructure/supabase/client";
import { logError, logWarn } from "../../utils/logger";
import { CostControlResult, TenantCostLimits } from "./types";
import { COST_DRIVERS, PLAN_COST_LIMITS } from "./constants";

export class CostControlService {
  /**
   * Check if a cost driver operation is allowed
   */
  async checkCostLimit(
    tenantId: string,
    billingAccountId: string,
    costDriverId: string,
    quantity: number = 1
  ): Promise<CostControlResult> {
    try {
      // Get tenant cost limits
      const limits = await this.getTenantCostLimits(tenantId, billingAccountId);

      if (!limits) {
        // Default to free tier limits if not found
        return {
          allowed: false,
          reason: "Cost limits not configured",
        };
      }

      const driverLimits = limits.limits[costDriverId];
      if (!driverLimits) {
        logWarn(`No limits configured for cost driver: ${costDriverId}`, { tenantId });
        return { allowed: true }; // Fail open for unknown drivers
      }

      const currentUsage = limits.currentUsage[costDriverId] || {
        daily: 0,
        monthly: 0,
        lastReset: new Date(),
      };

      // Check burst limit (short-term protection)
      if (quantity > driverLimits.burst) {
        return {
          allowed: false,
          reason: `Burst limit exceeded. Max ${driverLimits.burst} ${COST_DRIVERS[costDriverId]?.unit || "units"} per request`,
          currentUsage: currentUsage.daily,
          limit: driverLimits.daily,
          retryAfter: 60, // Wait 1 minute
        };
      }

      // Check daily limit
      if (currentUsage.daily + quantity > driverLimits.daily) {
        const degradedMode = currentUsage.daily > driverLimits.daily * 0.9; // Degrade at 90%
        return {
          allowed: false,
          reason: `Daily limit exceeded for ${costDriverId}`,
          currentUsage: currentUsage.daily,
          limit: driverLimits.daily,
          retryAfter: this.getSecondsUntilMidnight(),
          degradedMode,
        };
      }

      // Check monthly limit
      if (currentUsage.monthly + quantity > driverLimits.monthly) {
        return {
          allowed: false,
          reason: `Monthly limit exceeded for ${costDriverId}`,
          currentUsage: currentUsage.monthly,
          limit: driverLimits.monthly,
          retryAfter: this.getSecondsUntilMonthEnd(),
          degradedMode: true,
        };
      }

      // All checks passed
      return {
        allowed: true,
        currentUsage: currentUsage.daily,
        limit: driverLimits.daily,
      };
    } catch (error) {
      logError("Error checking cost limit", error);
      // Fail closed for cost control
      return {
        allowed: false,
        reason: "Cost control check failed",
      };
    }
  }

  /**
   * Record cost usage
   */
  async recordCostUsage(
    tenantId: string,
    billingAccountId: string,
    costDriverId: string,
    quantity: number = 1
  ): Promise<void> {
    try {
      // Update usage counters
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Get or create usage record
      const { data: existing } = await supabase
        .from("usage_events")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("billing_account_id", billingAccountId)
        .eq("event_type", `cost:${costDriverId}`)
        .gte("timestamp", today.toISOString())
        .order("timestamp", { ascending: false })
        .limit(1)
        .single();

      if (existing) {
        // Update existing
        await supabase
          .from("usage_events")
          .update({
            quantity: (Number(existing.quantity) || 0) + quantity,
            updated_at: now.toISOString(),
          })
          .eq("id", existing.id);
      } else {
        // Create new
        await supabase.from("usage_events").insert({
          billing_account_id: billingAccountId,
          tenant_id: tenantId,
          event_type: `cost:${costDriverId}`,
          quantity,
          unit: COST_DRIVERS[costDriverId]?.unit || "units",
          metadata: {
            cost_driver_id: costDriverId,
            estimated_cost: quantity * (COST_DRIVERS[costDriverId]?.baseCostPerUnit || 0),
          },
        });
      }

      // Update tenant cost limits cache
      await this.invalidateCostLimitsCache(tenantId);
    } catch (error) {
      logError("Error recording cost usage", error);
      // Don't throw - cost tracking should not break operations
    }
  }

  /**
   * Get tenant cost limits
   */
  private async getTenantCostLimits(
    tenantId: string,
    billingAccountId: string
  ): Promise<TenantCostLimits | null> {
    try {
      // Get subscription plan
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("plan_id, billing_account_id")
        .eq("billing_account_id", billingAccountId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const planId = subscription?.plan_id || "free";
      const planLimits = PLAN_COST_LIMITS[planId] || PLAN_COST_LIMITS.free;

      // Get current usage
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const { data: usageEvents } = await supabase
        .from("usage_events")
        .select("event_type, quantity, timestamp")
        .eq("tenant_id", tenantId)
        .eq("billing_account_id", billingAccountId)
        .like("event_type", "cost:%")
        .gte("timestamp", monthStart.toISOString());

      const currentUsage: Record<string, { daily: number; monthly: number; lastReset: Date }> = {};

      // Aggregate usage
      usageEvents?.forEach((event) => {
        const driverId = event.event_type.replace("cost:", "");
        const quantity = Number(event.quantity) || 0;
        const eventDate = new Date(event.timestamp);

        if (!currentUsage[driverId]) {
          currentUsage[driverId] = {
            daily: 0,
            monthly: 0,
            lastReset: today,
          };
        }

        currentUsage[driverId].monthly += quantity;
        if (eventDate >= today) {
          currentUsage[driverId].daily += quantity;
        }
      });

      return {
        tenantId,
        billingAccountId,
        planId,
        limits: planLimits || {},
        currentUsage,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      logError("Error getting tenant cost limits", error);
      return null;
    }
  }

  /**
   * Invalidate cost limits cache
   */
  private async invalidateCostLimitsCache(_tenantId: string): Promise<void> {
    // In a production system, this would invalidate Redis cache
    // For now, we'll rely on database queries
  }

  /**
   * Get seconds until midnight UTC
   */
  private getSecondsUntilMidnight(): number {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setUTCHours(24, 0, 0, 0);
    return Math.floor((midnight.getTime() - now.getTime()) / 1000);
  }

  /**
   * Get seconds until end of month
   */
  private getSecondsUntilMonthEnd(): number {
    const now = new Date();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return Math.floor((monthEnd.getTime() - now.getTime()) / 1000);
  }

  /**
   * Get estimated cost for a tenant
   */
  async getEstimatedCost(
    tenantId: string,
    billingAccountId: string,
    period: "daily" | "monthly" = "monthly"
  ): Promise<number> {
    try {
      const limits = await this.getTenantCostLimits(tenantId, billingAccountId);
      if (!limits) return 0;

      let totalCost = 0;
      Object.entries(limits.currentUsage).forEach(([driverId, usage]) => {
        const driver = COST_DRIVERS[driverId];
        if (driver) {
          const usageValue = period === "daily" ? usage.daily : usage.monthly;
          totalCost += usageValue * driver.baseCostPerUnit;
        }
      });

      return totalCost;
    } catch (error) {
      logError("Error calculating estimated cost", error);
      return 0;
    }
  }

  /**
   * Check for abuse scenarios
   */
  async detectAbuse(
    tenantId: string,
    billingAccountId: string
  ): Promise<{
    isAbuse: boolean;
    reason?: string;
    actions: string[];
  }> {
    try {
      const limits = await this.getTenantCostLimits(tenantId, billingAccountId);
      if (!limits) {
        return { isAbuse: false, actions: [] };
      }

      const abuseSignals: string[] = [];
      let isAbuse = false;

      // Check for rapid cost acceleration
      Object.entries(limits.currentUsage).forEach(([driverId, usage]) => {
        const driverLimits = limits.limits[driverId];
        if (driverLimits) {
          // If usage exceeds 95% of limit, flag as potential abuse
          if (usage.daily > driverLimits.daily * 0.95) {
            abuseSignals.push(
              `High daily usage for ${driverId}: ${usage.daily}/${driverLimits.daily}`
            );
            isAbuse = true;
          }
          if (usage.monthly > driverLimits.monthly * 0.95) {
            abuseSignals.push(
              `High monthly usage for ${driverId}: ${usage.monthly}/${driverLimits.monthly}`
            );
            isAbuse = true;
          }
        }
      });

      return {
        isAbuse,
        reason: abuseSignals.length > 0 ? abuseSignals.join("; ") : undefined,
        actions: isAbuse ? ["throttle", "alert", "review"] : [],
      };
    } catch (error) {
      logError("Error detecting abuse", error);
      return { isAbuse: false, actions: [] };
    }
  }
}
