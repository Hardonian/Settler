/**
 * Billing Feature Gating Middleware
 *
 * Enforces plan limits, add-on purchases, and usage thresholds.
 * Blocks access to premium features if requirements not met.
 */

import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
import { supabase } from "../infrastructure/supabase/client";
import { logError } from "../utils/logger";

interface PlanLimits {
  reconciliation_jobs: number;
  api_requests: number;
  webhook_events: number;
  db_queries: number;
  ai_requests: number;
  auth_users: number;
  storage_gb: number;
}

interface FeatureGate {
  feature: string;
  requiresPlan?: string;
  requiresAddOn?: string;
  requiresUsage?: {
    eventType: string;
    maxQuantity: number;
  };
}

// Plan limits configuration (aligned with pricing page)
const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    reconciliation_jobs: 1000,
    api_requests: 10000,
    webhook_events: 5000,
    db_queries: 50000,
    ai_requests: 100,
    auth_users: 100,
    storage_gb: 1,
  },
  starter: {
    reconciliation_jobs: 50000,
    api_requests: 500000,
    webhook_events: 250000,
    db_queries: 2500000,
    ai_requests: 5000,
    auth_users: 5000,
    storage_gb: 10,
  },
  growth: {
    reconciliation_jobs: 500000,
    api_requests: 5000000,
    webhook_events: 2500000,
    db_queries: 25000000,
    ai_requests: 50000,
    auth_users: 50000,
    storage_gb: 50,
  },
  scale: {
    reconciliation_jobs: 5000000,
    api_requests: 50000000,
    webhook_events: 25000000,
    db_queries: 250000000,
    ai_requests: 500000,
    auth_users: 500000,
    storage_gb: 100,
  },
  enterprise: {
    reconciliation_jobs: -1, // unlimited
    api_requests: -1,
    webhook_events: -1,
    db_queries: -1,
    ai_requests: -1,
    auth_users: -1,
    storage_gb: 1000,
  },
  // Legacy plan names (for backward compatibility)
  base: {
    reconciliation_jobs: 50000, // Maps to starter
    api_requests: 500000,
    webhook_events: 250000,
    db_queries: 2500000,
    ai_requests: 5000,
    auth_users: 5000,
    storage_gb: 10,
  },
  pro: {
    reconciliation_jobs: 500000, // Maps to growth
    api_requests: 5000000,
    webhook_events: 2500000,
    db_queries: 25000000,
    ai_requests: 50000,
    auth_users: 50000,
    storage_gb: 50,
  },
};

// Feature gates configuration
const FEATURE_GATES: Record<string, FeatureGate> = {
  sql_editor: {
    feature: "sql_editor",
    requiresPlan: "pro",
  },
  advanced_analytics: {
    feature: "advanced_analytics",
    requiresPlan: "pro",
  },
  ai_workflows: {
    feature: "ai_workflows",
    requiresPlan: "base",
    requiresUsage: {
      eventType: "ai_request",
      maxQuantity: 1000,
    },
  },
  realtime_dashboards: {
    feature: "realtime_dashboards",
    requiresPlan: "pro",
  },
  high_volume_api: {
    feature: "high_volume_api",
    requiresPlan: "pro",
  },
  tiktok_integration: {
    feature: "tiktok_integration",
    requiresAddOn: "tiktok-shop",
  },
  wix_integration: {
    feature: "wix_integration",
    requiresAddOn: "wix-stores",
  },
  ga4_integration: {
    feature: "ga4_integration",
    requiresAddOn: "ga4-deep-sync",
  },
  paypal_payouts: {
    feature: "paypal_payouts",
    requiresAddOn: "paypal-payouts",
  },
  whatsapp_telegram: {
    feature: "whatsapp_telegram",
    requiresAddOn: "whatsapp-telegram",
  },
};

/**
 * Get billing account for user
 */
async function getBillingAccount(userId: string, _tenantId?: string) {
  try {
    const query = supabase
      .from("billing_accounts")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .eq("status", "active")
      .single();

    const { data, error } = await query;

    if (error || !data) {
      return null;
    }

    return data;
  } catch (error) {
    logError("Error fetching billing account", error);
    return null;
  }
}

/**
 * Get active subscription for billing account
 * Includes trialing subscriptions (pilots)
 */
async function getActiveSubscription(billingAccountId: string) {
  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("billing_account_id", billingAccountId)
      .in("status", ["active", "trialing"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  } catch (error) {
    logError("Error fetching subscription", error);
    return null;
  }
}

/**
 * Subscription type for pilot checking
 */
interface SubscriptionForPilot {
  status?: string;
  trial_end?: string | Date | null;
}

/**
 * Check if subscription is in pilot/trial period
 */
function isPilotSubscription(subscription: SubscriptionForPilot | null): boolean {
  if (!subscription) {
    return false;
  }

  // Check if status is trialing
  if (subscription.status === "trialing") {
    return true;
  }

  // Check if trial_end exists and is in the future
  if (subscription.trial_end) {
    const trialEnd = new Date(subscription.trial_end);
    const now = new Date();
    return trialEnd > now;
  }

  return false;
}

/**
 * Check if pilot/trial has expired
 */
function isPilotExpired(subscription: SubscriptionForPilot | null): boolean {
  if (!subscription) {
    return false;
  }

  // Check if trial_end exists and is in the past
  if (subscription.trial_end) {
    const trialEnd = new Date(subscription.trial_end);
    const now = new Date();
    // Add 7-day grace period
    const gracePeriodEnd = new Date(trialEnd);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);
    return now > gracePeriodEnd;
  }

  return false;
}

/**
 * Get days remaining in pilot/trial
 */
function getPilotDaysRemaining(subscription: SubscriptionForPilot | null): number | null {
  if (!subscription || !subscription.trial_end) {
    return null;
  }

  const trialEnd = new Date(subscription.trial_end);
  const now = new Date();
  const diffMs = trialEnd.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
}

/**
 * Check if add-on is purchased
 */
async function hasAddOn(billingAccountId: string, addOnIntegrationId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("add_on_purchases")
      .select("*, add_ons!inner(integration_id)")
      .eq("billing_account_id", billingAccountId)
      .eq("status", "active")
      .eq("add_ons.integration_id", addOnIntegrationId)
      .limit(1);

    if (error || !data || data.length === 0) {
      return false;
    }

    return true;
  } catch (error) {
    logError("Error checking add-on", error);
    return false;
  }
}

/**
 * Get current usage for event type in current period
 */
interface Subscription {
  current_period_start: string | number | Date;
  current_period_end: string | number | Date;
  plan_id?: string;
}

async function getCurrentUsage(
  billingAccountId: string,
  eventType: string,
  subscription: Subscription
): Promise<number> {
  try {
    const startDate = new Date(subscription.current_period_start).toISOString().split("T")[0];
    const endDate = new Date(subscription.current_period_end).toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("usage_aggregate_daily")
      .select("total_quantity")
      .eq("billing_account_id", billingAccountId)
      .eq("event_type", eventType)
      .gte("date", startDate)
      .lte("date", endDate);

    if (error || !data) {
      return 0;
    }

    return data.reduce((sum, row) => sum + Number(row.total_quantity || 0), 0);
  } catch (error) {
    logError("Error fetching usage", error);
    return 0;
  }
}

/**
 * Check if plan meets requirement
 */
/**
 * Numeric plan hierarchy used for feature-gate comparisons.
 *
 * CANONICAL ALIGNMENT: this must stay consistent with
 * `mapLegacyPlanTypeToPlanCode` in `@settler/types/commercial-spine`.
 * The canonical function maps: free→starter, base→starter, pro→growth.
 * Levels here must reflect those equivalences — `free` is starter-equivalent (1),
 * not a sub-starter tier (0).
 */
const PLAN_HIERARCHY: Record<string, number> = {
  free: 1, // canonical: free → starter
  starter: 1,
  growth: 2,
  scale: 3,
  enterprise: 4,
  // Legacy Stripe plan IDs (canonical: base → starter, pro → growth)
  base: 1,
  pro: 2,
  trial: 2, // canonical: trial → growth
  commercial: 2, // canonical: commercial → growth
};

function planMeetsRequirement(userPlan: string, requiredPlan?: string): boolean {
  if (!requiredPlan) {
    return true;
  }

  const userPlanLevel = PLAN_HIERARCHY[userPlan] ?? 0;
  const requiredPlanLevel = PLAN_HIERARCHY[requiredPlan] ?? 0;

  return userPlanLevel >= requiredPlanLevel;
}

/**
 * Feature gating middleware factory
 */
export function featureGate(featureName: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;
      const tenantId = req.tenantId;

      if (!userId) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "Authentication required",
        });
      }

      // Get billing account
      const billingAccount = await getBillingAccount(userId, tenantId);

      if (!billingAccount) {
        return res.status(403).json({
          error: "Billing Account Required",
          message: "Please set up billing to access this feature",
          upgrade_required: true,
        });
      }

      // Get active subscription
      const subscription = await getActiveSubscription(billingAccount.id);

      if (!subscription) {
        return res.status(403).json({
          error: "Active Subscription Required",
          message: "Please subscribe to a plan to access this feature",
          upgrade_required: true,
        });
      }

      // Check if pilot has expired
      if (isPilotExpired(subscription)) {
        return res.status(403).json({
          error: "Pilot Expired",
          message:
            "Your pilot has expired. Please upgrade to a paid plan to continue using Settler.",
          upgrade_required: true,
          pilot_expired: true,
          days_expired: getPilotDaysRemaining(subscription)
            ? Math.abs(getPilotDaysRemaining(subscription) || 0)
            : null,
        });
      }

      // Check if pilot is expiring soon (warn but allow)
      const daysRemaining = getPilotDaysRemaining(subscription);
      if (isPilotSubscription(subscription) && daysRemaining !== null && daysRemaining <= 7) {
        // Add warning header but allow access
        res.setHeader(
          "X-Pilot-Warning",
          `Your pilot expires in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}. Please upgrade to continue.`
        );
      }

      // Get feature gate configuration
      const gate = FEATURE_GATES[featureName];

      if (!gate) {
        // Feature not gated, allow access
        return next();
      }

      // Check plan requirement
      if (gate.requiresPlan) {
        const planId = subscription.plan_id || "base";
        if (!planMeetsRequirement(planId, gate.requiresPlan)) {
          return res.status(403).json({
            error: "Plan Upgrade Required",
            message: `This feature requires ${gate.requiresPlan} plan or higher`,
            current_plan: planId,
            required_plan: gate.requiresPlan,
            upgrade_required: true,
          });
        }
      }

      // Check add-on requirement
      if (gate.requiresAddOn) {
        const hasAddOnPurchase = await hasAddOn(billingAccount.id, gate.requiresAddOn);

        if (!hasAddOnPurchase) {
          return res.status(403).json({
            error: "Add-On Required",
            message: `This feature requires the ${gate.requiresAddOn} add-on`,
            add_on_required: gate.requiresAddOn,
            upgrade_required: true,
          });
        }
      }

      // Check usage requirement
      if (gate.requiresUsage) {
        // Pilots have unlimited usage (within reason)
        const isPilot = isPilotSubscription(subscription);

        if (!isPilot) {
          const currentUsage = await getCurrentUsage(
            billingAccount.id,
            gate.requiresUsage.eventType,
            subscription
          );

          const planId = subscription.plan_id || "free";
          const planLimits = PLAN_LIMITS[planId] || PLAN_LIMITS.free;
          if (!planLimits) {
            return res.status(500).json({
              error: "Internal Server Error",
              message: "Plan limits not configured",
            });
          }
          const limit = planLimits[gate.requiresUsage.eventType as keyof PlanLimits];

          if (limit > 0 && currentUsage >= limit) {
            return res.status(403).json({
              error: "Usage Limit Exceeded",
              message: `You have reached your ${gate.requiresUsage.eventType} limit for this billing period`,
              current_usage: currentUsage,
              limit: limit,
              upgrade_required: true,
            });
          }
        }
        // For pilots, allow unlimited usage (no limit check)
      }

      // All checks passed, allow access
      next();
    } catch (error) {
      logError("Error in feature gating middleware", error);
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to verify feature access",
      });
    }
  };
}

/**
 * Check usage quota for a specific event type
 * This is a helper function, not middleware
 * Use the checkUsageQuota middleware from usage-quota.ts for route-level checks
 */
export async function checkUsageQuotaForEvent(
  userId: string,
  eventType: string,
  quantity: number = 1
): Promise<{
  allowed: boolean;
  currentUsage?: number;
  limit?: number;
  reason?: string;
  pilot_expired?: boolean;
  is_pilot?: boolean;
}> {
  try {
    // Get billing account
    const billingAccount = await getBillingAccount(userId);

    if (!billingAccount) {
      // Allow operation if no billing account (grace period)
      return { allowed: true };
    }

    // Get active subscription
    const subscription = await getActiveSubscription(billingAccount.id);

    if (!subscription) {
      // Allow operation if no subscription (grace period)
      return { allowed: true };
    }

    // Check if pilot has expired
    if (isPilotExpired(subscription)) {
      return {
        allowed: false,
        reason: "Pilot expired. Please upgrade to a paid plan.",
        pilot_expired: true,
      };
    }

    // Pilots have unlimited usage (within reason)
    const isPilot = isPilotSubscription(subscription);
    if (isPilot) {
      return { allowed: true, is_pilot: true };
    }

    // Get current usage
    const currentUsage = await getCurrentUsage(billingAccount.id, eventType, subscription);

    // Get plan limits (map legacy plan names)
    const planId = subscription.plan_id || "free";
    const planLimits = PLAN_LIMITS[planId] || PLAN_LIMITS.free;
    if (!planLimits) {
      logError(
        "Plan limits not found",
        new Error(`Plan limits not configured for plan: ${subscription.plan_id || "base"}`)
      );
      return { allowed: true }; // Fail open
    }
    const limit = planLimits[eventType as keyof PlanLimits];

    // Check if limit is exceeded
    if (limit > 0 && currentUsage + quantity > limit) {
      return {
        allowed: false,
        currentUsage,
        limit,
        reason: `Usage quota exceeded for ${eventType}`,
      };
    }

    // Within limits
    return { allowed: true, currentUsage, limit };
  } catch (error) {
    logError("Error checking usage quota", error);
    // On error, allow operation (fail open)
    return { allowed: true };
  }
}

/**
 * Middleware to check integration access
 * Supports dynamic integration ID from route params
 */
export function checkIntegrationAccess(integrationIdOrParam: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "Authentication required",
        });
      }

      // Extract integration ID from route params if ":id" pattern used
      let integrationId = integrationIdOrParam;
      if (integrationIdOrParam === ":id" && req.params && req.params.id) {
        const rawId = req.params.id;
        integrationId = Array.isArray(rawId) ? (rawId[0] ?? "") : rawId;
      }

      // Check if integration is standard (included in base plan)
      const { data: addOn, error: addOnError } = await supabase
        .from("add_ons")
        .select("*")
        .eq("integration_id", integrationId)
        .single();

      if (addOnError || !addOn) {
        return res.status(404).json({
          error: "Integration Not Found",
          message: `Integration ${integrationId} not found`,
        });
      }

      // If standard, allow access
      if (addOn.is_standard) {
        return next();
      }

      // If premium, check if purchased
      const billingAccount = await getBillingAccount(userId, req.tenantId);

      if (!billingAccount) {
        return res.status(403).json({
          error: "Billing Account Required",
          message: "Please set up billing to access this integration",
          upgrade_required: true,
        });
      }

      const hasAddOnPurchase = await hasAddOn(billingAccount.id, integrationId);

      if (!hasAddOnPurchase) {
        return res.status(403).json({
          error: "Add-On Required",
          message: `This integration requires the ${addOn.name} add-on`,
          add_on_required: integrationId,
          add_on_name: addOn.name,
          upgrade_required: true,
        });
      }

      // Add-on purchased, allow access
      next();
    } catch (error) {
      logError("Error checking integration access", error);
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to verify integration access",
      });
    }
  };
}

/**
 * Middleware to check pilot status and expiration
 * Use this to add pilot warnings/errors to responses
 */
export function checkPilotStatus() {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;

      if (!userId) {
        return next();
      }

      const billingAccount = await getBillingAccount(userId, req.tenantId);
      if (!billingAccount) {
        return next();
      }

      const subscription = await getActiveSubscription(billingAccount.id);
      if (!subscription) {
        return next();
      }

      // Check if pilot has expired
      if (isPilotExpired(subscription)) {
        // Don't block, but add warning header
        res.setHeader("X-Pilot-Expired", "true");
        return next();
      }

      // Check if pilot is expiring soon
      const daysRemaining = getPilotDaysRemaining(subscription);
      if (isPilotSubscription(subscription) && daysRemaining !== null) {
        if (daysRemaining <= 7) {
          res.setHeader(
            "X-Pilot-Warning",
            `Your pilot expires in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}. Please upgrade to continue.`
          );
        }
        res.setHeader("X-Pilot-Days-Remaining", daysRemaining.toString());
      }

      next();
    } catch (error) {
      logError("Error checking pilot status", error);
      // Don't block on error
      next();
    }
  };
}

/**
 * Export pilot helper functions for use in other modules
 */
export { isPilotSubscription, isPilotExpired, getPilotDaysRemaining };
