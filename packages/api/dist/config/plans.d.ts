/**
 * Plan Configuration for API
 * Defines plan limits and features for reconciliation service
 */
export type PlanType = "free" | "trial" | "commercial" | "enterprise";
export interface PlanLimits {
    reconciliationsPerMonth: number | "unlimited";
    logRetentionDays: number | "unlimited";
    platformAdapters: number | "unlimited";
}
export interface PlanFeatures {
    cookbooks: string[] | "all";
    docs: string[] | "all";
    playground: {
        runsPerDay: number | "unlimited";
        advancedFeatures: boolean;
    };
    consulting: boolean;
    emailAnalysis: {
        enabled: boolean;
        reportsPerMonth: number | "unlimited";
    };
    workflows: {
        maxWorkflows: number | "unlimited";
        advancedWorkflows: boolean;
    };
    support: "community" | "email" | "priority" | "dedicated";
}
/**
 * Get plan limits for a plan type
 */
export declare function getPlanLimits(planType: PlanType): PlanLimits;
/**
 * Get plan features for a plan type
 */
export declare function getPlanFeatures(planType: PlanType): PlanFeatures;
//# sourceMappingURL=plans.d.ts.map