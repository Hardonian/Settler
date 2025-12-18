/**
 * Usage Enforcement Middleware
 * 
 * Checks usage limits before allowing operations.
 * Works with Supabase client used in API routes.
 */

import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
import { getBillingAccount, getActiveSubscription } from "../utils/billing-helpers";
import { supabase } from "../infrastructure/supabase/client";
import { logError, logInfo } from "../utils/logger";

interface PlanLimits {
  ingestions: number;
  exports: number;
}

// Plan limits configuration (matching planConfig.ts)
const PLAN_LIMITS: Record<string, PlanLimits> = {
  base: {
    ingestions: 100,
    exports: 50,
  },
  pro: {
    ingestions: 10000,
    exports: 5000,
  },
  enterprise: {
    ingestions: 100000,
    exports: 50000,
  },
};

/**
 * Get current usage for a service in current period
 */
async function getCurrentUsage(
  billingAccountId: string,
  eventType: string,
  subscription: { current_period_start: string | Date; current_period_end: string | Date }
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
 * Middleware to check usage limit for ingestions
 */
export function checkIngestionLimit() {
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
        // Allow if no billing account (grace period for new users)
        logInfo("No billing account found, allowing ingestion", { userId });
        return next();
      }

      // Get active subscription
      const subscription = await getActiveSubscription(billingAccount.id);

      if (!subscription) {
        // Allow if no subscription (free tier)
        logInfo("No subscription found, allowing ingestion", { userId });
        return next();
      }

      // Get current usage
      const currentUsage = await getCurrentUsage(
        billingAccount.id,
        "settler-ingestions:create",
        subscription
      );

      // Get plan limits
      const planId = subscription.plan_id || "base";
      const planLimits = (PLAN_LIMITS[planId] || PLAN_LIMITS.base) as PlanLimits;
      const limit = planLimits.ingestions;

      // Check if limit is exceeded
      if (limit > 0 && currentUsage >= limit) {
        return res.status(403).json({
          error: "Usage Limit Exceeded",
          message: `You have reached your ingestion limit (${limit}/month) for this billing period`,
          current_usage: currentUsage,
          limit: limit,
          upgrade_required: true,
          upgrade_url: "/pricing",
        });
      }

      // Within limits, allow
      next();
    } catch (error) {
      logError("Error checking ingestion limit", error);
      // Fail open - allow request if check fails
      next();
    }
  };
}

/**
 * Middleware to check usage limit for exports
 */
export function checkExportLimit() {
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
        // Allow if no billing account (grace period for new users)
        logInfo("No billing account found, allowing export", { userId });
        return next();
      }

      // Get active subscription
      const subscription = await getActiveSubscription(billingAccount.id);

      if (!subscription) {
        // Allow if no subscription (free tier)
        logInfo("No subscription found, allowing export", { userId });
        return next();
      }

      // Get current usage
      const currentUsage = await getCurrentUsage(
        billingAccount.id,
        "settler-exports:create",
        subscription
      );

      // Get plan limits
      const planId = subscription.plan_id || "base";
      const planLimits = (PLAN_LIMITS[planId] || PLAN_LIMITS.base) as PlanLimits;
      const limit = planLimits.exports;

      // Check if limit is exceeded
      if (limit > 0 && currentUsage >= limit) {
        return res.status(403).json({
          error: "Usage Limit Exceeded",
          message: `You have reached your export limit (${limit}/month) for this billing period`,
          current_usage: currentUsage,
          limit: limit,
          upgrade_required: true,
          upgrade_url: "/pricing",
        });
      }

      // Within limits, allow
      next();
    } catch (error) {
      logError("Error checking export limit", error);
      // Fail open - allow request if check fails
      next();
    }
  };
}
