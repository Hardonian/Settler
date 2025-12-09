"use strict";
/**
 * Plan Configuration for API
 * Defines plan limits and features for reconciliation service
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlanLimits = getPlanLimits;
exports.getPlanFeatures = getPlanFeatures;
const PLAN_LIMITS = {
    free: {
        reconciliationsPerMonth: 1000,
        logRetentionDays: 7,
        platformAdapters: 2,
    },
    trial: {
        reconciliationsPerMonth: 100000,
        logRetentionDays: 30,
        platformAdapters: "unlimited",
    },
    commercial: {
        reconciliationsPerMonth: 100000,
        logRetentionDays: 90,
        platformAdapters: "unlimited",
    },
    enterprise: {
        reconciliationsPerMonth: "unlimited",
        logRetentionDays: "unlimited",
        platformAdapters: "unlimited",
    },
};
const PLAN_FEATURES = {
    free: {
        cookbooks: ["ecommerce-shopify-stripe", "scheduled-reconciliations", "error-handling"],
        docs: ["getting-started", "installation", "api-reference-basic"],
        playground: {
            runsPerDay: 3,
            advancedFeatures: false,
        },
        consulting: false,
        emailAnalysis: {
            enabled: true,
            reportsPerMonth: 5,
        },
        workflows: {
            maxWorkflows: 2,
            advancedWorkflows: false,
        },
        support: "community",
    },
    trial: {
        cookbooks: "all",
        docs: "all",
        playground: {
            runsPerDay: "unlimited",
            advancedFeatures: true,
        },
        consulting: false,
        emailAnalysis: {
            enabled: true,
            reportsPerMonth: "unlimited",
        },
        workflows: {
            maxWorkflows: "unlimited",
            advancedWorkflows: true,
        },
        support: "email",
    },
    commercial: {
        cookbooks: "all",
        docs: "all",
        playground: {
            runsPerDay: "unlimited",
            advancedFeatures: true,
        },
        consulting: false,
        emailAnalysis: {
            enabled: true,
            reportsPerMonth: "unlimited",
        },
        workflows: {
            maxWorkflows: "unlimited",
            advancedWorkflows: true,
        },
        support: "email",
    },
    enterprise: {
        cookbooks: "all",
        docs: "all",
        playground: {
            runsPerDay: "unlimited",
            advancedFeatures: true,
        },
        consulting: true,
        emailAnalysis: {
            enabled: true,
            reportsPerMonth: "unlimited",
        },
        workflows: {
            maxWorkflows: "unlimited",
            advancedWorkflows: true,
        },
        support: "dedicated",
    },
};
/**
 * Get plan limits for a plan type
 */
function getPlanLimits(planType) {
    return PLAN_LIMITS[planType] || PLAN_LIMITS.free;
}
/**
 * Get plan features for a plan type
 */
function getPlanFeatures(planType) {
    return PLAN_FEATURES[planType] || PLAN_FEATURES.free;
}
//# sourceMappingURL=plans.js.map