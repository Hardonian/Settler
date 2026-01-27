"use strict";
/**
 * Pricing Middleware
 * Enforces feature gates based on pricing tier
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.pricingMiddleware = pricingMiddleware;
exports.requireFeature = requireFeature;
exports.checkFeatureLimit = checkFeatureLimit;
const db_1 = require("../db");
const pricing_1 = require("../config/pricing");
const api_response_1 = require("../utils/api-response");
/**
 * Middleware to load pricing tier and feature limits
 */
async function pricingMiddleware(req, _res, next) {
    try {
        const tenantId = req.tenantId;
        if (!tenantId) {
            return next();
        }
        // Get tenant tier from database
        const result = await (0, db_1.query)(`SELECT tier FROM tenants WHERE id = $1`, [
            tenantId,
        ]);
        if (result.length === 0) {
            return next();
        }
        const tier = result[0]?.tier;
        req.pricingTier = tier;
        req.featureLimits = {
            edgeNodes: (0, pricing_1.getFeatureLimit)(tier, "edgeNodes"),
            modelOptimizations: (0, pricing_1.getFeatureLimit)(tier, "modelOptimizations"),
            monthlyReconciliations: (0, pricing_1.getFeatureLimit)(tier, "monthlyReconciliations"),
            apiCalls: (0, pricing_1.getFeatureLimit)(tier, "apiCalls"),
        };
        next();
    }
    catch (error) {
        next(error);
    }
}
/**
 * Check if tenant has access to a feature
 */
function requireFeature(feature) {
    return async (req, res, next) => {
        const tier = req.pricingTier || pricing_1.PricingTier.SAAS_ONLY;
        if (!(0, pricing_1.hasFeature)(tier, feature)) {
            (0, api_response_1.sendError)(res, 403, "FEATURE_NOT_AVAILABLE", `Feature '${feature}' is not available in your pricing tier. Please upgrade to access this feature.`, {
                requiredTier: getRequiredTierForFeature(feature),
                currentTier: tier,
            });
            return;
        }
        next();
    };
}
/**
 * Check if tenant is within feature limit
 */
function checkFeatureLimit(feature) {
    return async (req, res, next) => {
        const tier = req.pricingTier || pricing_1.PricingTier.SAAS_ONLY;
        const limit = (0, pricing_1.getFeatureLimit)(tier, feature);
        if (limit === null) {
            // Unlimited
            return next();
        }
        const tenantId = req.tenantId;
        if (!tenantId) {
            return next();
        }
        try {
            let currentUsage;
            switch (feature) {
                case "edgeNodes":
                    const nodesResult = await (0, db_1.query)(`SELECT COUNT(*) as count FROM edge_nodes 
             WHERE tenant_id = $1 AND deleted_at IS NULL`, [tenantId]);
                    currentUsage = Number(nodesResult[0]?.count || 0);
                    break;
                case "modelOptimizations":
                    // Count optimizations this month
                    const optimizationsResult = await (0, db_1.query)(`SELECT COUNT(*) as count FROM model_versions 
             WHERE tenant_id = $1 
             AND created_at >= date_trunc('month', CURRENT_DATE)`, [tenantId]);
                    currentUsage = Number(optimizationsResult[0]?.count || 0);
                    break;
                case "monthlyReconciliations":
                    // Count reconciliations this month
                    const reconciliationsResult = await (0, db_1.query)(`SELECT COUNT(*) as count FROM executions 
             WHERE tenant_id = $1 
             AND created_at >= date_trunc('month', CURRENT_DATE)`, [tenantId]);
                    currentUsage = Number(reconciliationsResult[0]?.count || 0);
                    break;
                case "apiCalls":
                    // This would typically come from usage tracking
                    currentUsage = 0; // Placeholder
                    break;
                default:
                    return next();
            }
            if (currentUsage >= limit) {
                (0, api_response_1.sendError)(res, 403, "FEATURE_LIMIT_REACHED", `Feature limit reached for '${feature}'. Current usage: ${currentUsage}/${limit}. Please upgrade your plan.`, {
                    feature,
                    currentUsage,
                    limit,
                    tier,
                });
                return;
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
function getRequiredTierForFeature(feature) {
    // Determine minimum tier required for feature
    if (feature === "edgeNodes" || feature === "anomalyDetection") {
        return pricing_1.PricingTier.EDGE_STARTER;
    }
    if (feature === "onDeviceOCR" || feature === "customModels") {
        return pricing_1.PricingTier.EDGE_PRO;
    }
    if (feature === "onPremDeployment") {
        return pricing_1.PricingTier.ENTERPRISE_EDGE;
    }
    return pricing_1.PricingTier.SAAS_ONLY;
}
//# sourceMappingURL=pricing.js.map