"use strict";
/**
 * Usage Enforcement Middleware
 *
 * Checks usage limits before allowing operations.
 * Works with Supabase client used in API routes.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkIngestionLimit = checkIngestionLimit;
exports.checkExportLimit = checkExportLimit;
const billing_helpers_1 = require("../utils/billing-helpers");
const client_1 = require("../infrastructure/supabase/client");
const logger_1 = require("../utils/logger");
// Plan limits configuration (matching planConfig.ts)
const PLAN_LIMITS = {
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
async function getCurrentUsage(billingAccountId, eventType, subscription) {
    try {
        const startDate = new Date(subscription.current_period_start).toISOString().split("T")[0];
        const endDate = new Date(subscription.current_period_end).toISOString().split("T")[0];
        const { data, error } = await client_1.supabase
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
    }
    catch (error) {
        (0, logger_1.logError)("Error fetching usage", error);
        return 0;
    }
}
/**
 * Middleware to check usage limit for ingestions
 */
function checkIngestionLimit() {
    return async (req, res, next) => {
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
            const billingAccount = await (0, billing_helpers_1.getBillingAccount)(userId, tenantId);
            if (!billingAccount) {
                // Allow if no billing account (grace period for new users)
                (0, logger_1.logInfo)("No billing account found, allowing ingestion", { userId });
                return next();
            }
            // Get active subscription
            const subscription = await (0, billing_helpers_1.getActiveSubscription)(billingAccount.id);
            if (!subscription) {
                // Allow if no subscription (free tier)
                (0, logger_1.logInfo)("No subscription found, allowing ingestion", { userId });
                return next();
            }
            // Get current usage
            const currentUsage = await getCurrentUsage(billingAccount.id, "settler-ingestions:create", subscription);
            // Get plan limits
            const planId = subscription.plan_id || "base";
            const planLimits = (PLAN_LIMITS[planId] || PLAN_LIMITS.base);
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
        }
        catch (error) {
            (0, logger_1.logError)("Error checking ingestion limit", error);
            // Fail open - allow request if check fails
            next();
        }
    };
}
/**
 * Middleware to check usage limit for exports
 */
function checkExportLimit() {
    return async (req, res, next) => {
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
            const billingAccount = await (0, billing_helpers_1.getBillingAccount)(userId, tenantId);
            if (!billingAccount) {
                // Allow if no billing account (grace period for new users)
                (0, logger_1.logInfo)("No billing account found, allowing export", { userId });
                return next();
            }
            // Get active subscription
            const subscription = await (0, billing_helpers_1.getActiveSubscription)(billingAccount.id);
            if (!subscription) {
                // Allow if no subscription (free tier)
                (0, logger_1.logInfo)("No subscription found, allowing export", { userId });
                return next();
            }
            // Get current usage
            const currentUsage = await getCurrentUsage(billingAccount.id, "settler-exports:create", subscription);
            // Get plan limits
            const planId = subscription.plan_id || "base";
            const planLimits = (PLAN_LIMITS[planId] || PLAN_LIMITS.base);
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
        }
        catch (error) {
            (0, logger_1.logError)("Error checking export limit", error);
            // Fail open - allow request if check fails
            next();
        }
    };
}
//# sourceMappingURL=usage-enforcement.js.map