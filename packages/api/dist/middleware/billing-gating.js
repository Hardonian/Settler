"use strict";
/**
 * Billing Feature Gating Middleware
 *
 * Enforces plan limits, add-on purchases, and usage thresholds.
 * Blocks access to premium features if requirements not met.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.featureGate = featureGate;
exports.checkUsageQuotaForEvent = checkUsageQuotaForEvent;
exports.checkIntegrationAccess = checkIntegrationAccess;
const client_1 = require("../infrastructure/supabase/client");
const logger_1 = require("../utils/logger");
// Plan limits configuration
const PLAN_LIMITS = {
    base: {
        reconciliation_jobs: 10000,
        api_requests: 100000,
        webhook_events: 50000,
        db_queries: 500000,
        ai_requests: 1000,
        auth_users: 1000,
        storage_gb: 10,
    },
    pro: {
        reconciliation_jobs: 50000,
        api_requests: 500000,
        webhook_events: 250000,
        db_queries: 2500000,
        ai_requests: 5000,
        auth_users: 5000,
        storage_gb: 50,
    },
    enterprise: {
        reconciliation_jobs: -1, // unlimited
        api_requests: -1,
        webhook_events: -1,
        db_queries: -1,
        ai_requests: -1,
        auth_users: -1,
        storage_gb: 100,
    },
};
// Feature gates configuration
const FEATURE_GATES = {
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
async function getBillingAccount(userId, _tenantId) {
    try {
        const query = client_1.supabase
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
    }
    catch (error) {
        (0, logger_1.logError)("Error fetching billing account", error);
        return null;
    }
}
/**
 * Get active subscription for billing account
 */
async function getActiveSubscription(billingAccountId) {
    try {
        const { data, error } = await client_1.supabase
            .from("subscriptions")
            .select("*")
            .eq("billing_account_id", billingAccountId)
            .eq("status", "active")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
        if (error || !data) {
            return null;
        }
        return data;
    }
    catch (error) {
        (0, logger_1.logError)("Error fetching subscription", error);
        return null;
    }
}
/**
 * Check if add-on is purchased
 */
async function hasAddOn(billingAccountId, addOnIntegrationId) {
    try {
        const { data, error } = await client_1.supabase
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
    }
    catch (error) {
        (0, logger_1.logError)("Error checking add-on", error);
        return false;
    }
}
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
 * Check if plan meets requirement
 */
function planMeetsRequirement(userPlan, requiredPlan) {
    if (!requiredPlan) {
        return true;
    }
    const planHierarchy = {
        base: 1,
        pro: 2,
        enterprise: 3,
    };
    const userPlanLevel = planHierarchy[userPlan] || 0;
    const requiredPlanLevel = planHierarchy[requiredPlan] || 0;
    return userPlanLevel >= requiredPlanLevel;
}
/**
 * Feature gating middleware factory
 */
function featureGate(featureName) {
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
                const currentUsage = await getCurrentUsage(billingAccount.id, gate.requiresUsage.eventType, subscription);
                const planLimits = PLAN_LIMITS[subscription.plan_id || "base"] || PLAN_LIMITS.base;
                if (!planLimits) {
                    return res.status(500).json({
                        error: "Internal Server Error",
                        message: "Plan limits not configured",
                    });
                }
                const limit = planLimits[gate.requiresUsage.eventType];
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
            // All checks passed, allow access
            next();
        }
        catch (error) {
            (0, logger_1.logError)("Error in feature gating middleware", error);
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
async function checkUsageQuotaForEvent(userId, eventType, quantity = 1) {
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
        // Get current usage
        const currentUsage = await getCurrentUsage(billingAccount.id, eventType, subscription);
        // Get plan limits
        const planLimits = PLAN_LIMITS[subscription.plan_id || "base"] || PLAN_LIMITS.base;
        if (!planLimits) {
            (0, logger_1.logError)("Plan limits not found", new Error(`Plan limits not configured for plan: ${subscription.plan_id || "base"}`));
            return { allowed: true }; // Fail open
        }
        const limit = planLimits[eventType];
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
    }
    catch (error) {
        (0, logger_1.logError)("Error checking usage quota", error);
        // On error, allow operation (fail open)
        return { allowed: true };
    }
}
/**
 * Middleware to check integration access
 */
function checkIntegrationAccess(integrationId) {
    return async (req, res, next) => {
        try {
            const userId = req.userId;
            if (!userId) {
                return res.status(401).json({
                    error: "Unauthorized",
                    message: "Authentication required",
                });
            }
            // Check if integration is standard (included in base plan)
            const { data: addOn, error: addOnError } = await client_1.supabase
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
        }
        catch (error) {
            (0, logger_1.logError)("Error checking integration access", error);
            return res.status(500).json({
                error: "Internal Server Error",
                message: "Failed to verify integration access",
            });
        }
    };
}
//# sourceMappingURL=billing-gating.js.map