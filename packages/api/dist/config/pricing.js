"use strict";
/**
 * Pricing Configuration
 * Defines pricing tiers, feature gates, and revenue calculations
 *
 * NOTE: This file is for Edge AI pricing tiers only.
 * Main reconciliation pricing is defined in config/plans.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FINANCIAL_MODEL = exports.PRICING_TIERS = exports.PricingTier = void 0;
exports.calculateMonthlyRevenue = calculateMonthlyRevenue;
exports.hasFeature = hasFeature;
exports.getFeatureLimit = getFeatureLimit;
var PricingTier;
(function (PricingTier) {
    PricingTier["SAAS_ONLY"] = "saas_only";
    PricingTier["EDGE_STARTER"] = "edge_starter";
    PricingTier["EDGE_PRO"] = "edge_pro";
    PricingTier["ENTERPRISE_EDGE"] = "enterprise_edge";
})(PricingTier || (exports.PricingTier = PricingTier = {}));
exports.PRICING_TIERS = {
    [PricingTier.SAAS_ONLY]: {
        tier: PricingTier.SAAS_ONLY,
        name: "SaaS Only",
        monthlyPrice: 99,
        features: {
            edgeNodes: 0,
            modelOptimizations: 0,
            monthlyReconciliations: 10000,
            apiCalls: 100000,
            anomalyDetection: false,
            onDeviceOCR: false,
            customModels: false,
            onPremDeployment: false,
            dedicatedSupport: false,
            sla: null,
        },
    },
    [PricingTier.EDGE_STARTER]: {
        tier: PricingTier.EDGE_STARTER,
        name: "Edge Starter",
        monthlyPrice: 299,
        features: {
            edgeNodes: 1,
            modelOptimizations: 1,
            monthlyReconciliations: 50000,
            apiCalls: 500000,
            anomalyDetection: true,
            onDeviceOCR: false,
            customModels: false,
            onPremDeployment: false,
            dedicatedSupport: false,
            sla: "99.5%",
        },
        perNodePrice: 0, // Included
        perVolumePrice: 0.01, // $0.01 per 1000 reconciliations over limit
        perOptimizationPrice: 50, // $50 per additional optimization
    },
    [PricingTier.EDGE_PRO]: {
        tier: PricingTier.EDGE_PRO,
        name: "Edge Pro",
        monthlyPrice: 999,
        features: {
            edgeNodes: 5,
            modelOptimizations: null, // Unlimited
            monthlyReconciliations: 500000,
            apiCalls: 5000000,
            anomalyDetection: true,
            onDeviceOCR: true,
            customModels: false,
            onPremDeployment: false,
            dedicatedSupport: true,
            sla: "99.9%",
        },
        perNodePrice: 100, // $100 per additional node
        perVolumePrice: 0.005, // $0.005 per 1000 reconciliations over limit
        perOptimizationPrice: 0, // Included
    },
    [PricingTier.ENTERPRISE_EDGE]: {
        tier: PricingTier.ENTERPRISE_EDGE,
        name: "Enterprise Edge",
        monthlyPrice: 4999,
        features: {
            edgeNodes: null, // Unlimited
            modelOptimizations: null, // Unlimited
            monthlyReconciliations: null, // Unlimited
            apiCalls: null, // Unlimited
            anomalyDetection: true,
            onDeviceOCR: true,
            customModels: true,
            onPremDeployment: true,
            dedicatedSupport: true,
            sla: "99.99%",
        },
        perNodePrice: 0, // Included
        perVolumePrice: 0, // Included
        perOptimizationPrice: 0, // Included
    },
};
/**
 * Calculate monthly revenue for a tenant
 */
function calculateMonthlyRevenue(tier, edgeNodes, reconciliations, optimizations) {
    const config = exports.PRICING_TIERS[tier];
    let revenue = config.monthlyPrice;
    // Edge node overage
    if (config.features.edgeNodes !== null && edgeNodes > config.features.edgeNodes) {
        const overage = edgeNodes - config.features.edgeNodes;
        revenue += overage * (config.perNodePrice || 0);
    }
    // Reconciliation volume overage
    if (config.features.monthlyReconciliations !== null &&
        reconciliations > config.features.monthlyReconciliations) {
        const overage = reconciliations - config.features.monthlyReconciliations;
        revenue += (overage / 1000) * (config.perVolumePrice || 0);
    }
    // Optimization overage
    if (config.features.modelOptimizations !== null &&
        optimizations > config.features.modelOptimizations) {
        const overage = optimizations - config.features.modelOptimizations;
        revenue += overage * (config.perOptimizationPrice || 0);
    }
    return revenue;
}
/**
 * Check if a feature is available for a tier
 */
function hasFeature(tier, feature) {
    return exports.PRICING_TIERS[tier].features[feature] === true;
}
/**
 * Get feature limit for a tier
 */
function getFeatureLimit(tier, feature) {
    const value = exports.PRICING_TIERS[tier].features[feature];
    if (typeof value === "number") {
        return value;
    }
    return null;
}
/**
 * Financial model assumptions
 */
exports.FINANCIAL_MODEL = {
    cac: {
        saas_only: 50,
        edge_starter: 150,
        edge_pro: 500,
        enterprise_edge: 5000,
    },
    ltv: {
        saas_only: 1188, // 12 months * $99
        edge_starter: 3588, // 12 months * $299
        edge_pro: 11988, // 12 months * $999
        enterprise_edge: 59988, // 12 months * $4999
    },
    churn: {
        saas_only: 0.05, // 5% monthly
        edge_starter: 0.03, // 3% monthly
        edge_pro: 0.02, // 2% monthly
        enterprise_edge: 0.01, // 1% monthly
    },
    grossMargin: 0.75, // 75%
    targetLtvCacRatio: 3.0,
};
//# sourceMappingURL=pricing.js.map