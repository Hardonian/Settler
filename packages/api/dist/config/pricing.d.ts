/**
 * Pricing Configuration
 * Defines pricing tiers, feature gates, and revenue calculations
 *
 * NOTE: This file is for Edge AI pricing tiers only.
 * Main reconciliation pricing is defined in config/plans.ts
 */
export declare enum PricingTier {
    SAAS_ONLY = "saas_only",
    EDGE_STARTER = "edge_starter",
    EDGE_PRO = "edge_pro",
    ENTERPRISE_EDGE = "enterprise_edge"
}
export interface PricingTierConfig {
    tier: PricingTier;
    name: string;
    monthlyPrice: number;
    features: {
        edgeNodes: number | null;
        modelOptimizations: number | null;
        monthlyReconciliations: number | null;
        apiCalls: number | null;
        anomalyDetection: boolean;
        onDeviceOCR: boolean;
        customModels: boolean;
        onPremDeployment: boolean;
        dedicatedSupport: boolean;
        sla: string | null;
    };
    perNodePrice?: number;
    perVolumePrice?: number;
    perOptimizationPrice?: number;
}
export declare const PRICING_TIERS: Record<PricingTier, PricingTierConfig>;
/**
 * Calculate monthly revenue for a tenant
 */
export declare function calculateMonthlyRevenue(tier: PricingTier, edgeNodes: number, reconciliations: number, optimizations: number): number;
/**
 * Check if a feature is available for a tier
 */
export declare function hasFeature(tier: PricingTier, feature: keyof PricingTierConfig["features"]): boolean;
/**
 * Get feature limit for a tier
 */
export declare function getFeatureLimit(tier: PricingTier, feature: keyof PricingTierConfig["features"]): number | null;
/**
 * Financial model assumptions
 */
export declare const FINANCIAL_MODEL: {
    cac: {
        saas_only: number;
        edge_starter: number;
        edge_pro: number;
        enterprise_edge: number;
    };
    ltv: {
        saas_only: number;
        edge_starter: number;
        edge_pro: number;
        enterprise_edge: number;
    };
    churn: {
        saas_only: number;
        edge_starter: number;
        edge_pro: number;
        enterprise_edge: number;
    };
    grossMargin: number;
    targetLtvCacRatio: number;
};
//# sourceMappingURL=pricing.d.ts.map