"use strict";
/**
 * Feature Flags Middleware
 *
 * Implements feature flag system for gradual rollouts, A/B testing, and feature toggles
 * Supports:
 * - Per-tenant feature flags
 * - Percentage-based rollouts
 * - A/B testing variants
 * - Environment-based flags
 * - Time-based flags (scheduled releases)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setFeatureFlagService = setFeatureFlagService;
exports.getFeatureFlagService = getFeatureFlagService;
exports.featureFlagsMiddleware = featureFlagsMiddleware;
exports.isFeatureEnabled = isFeatureEnabled;
exports.getFeatureVariant = getFeatureVariant;
exports.requireFeatureFlag = requireFeatureFlag;
const logger_1 = require("../utils/logger");
/**
 * In-memory feature flag service (for development/testing)
 */
class InMemoryFeatureFlagService {
    flags = new Map();
    setFlag(flag) {
        this.flags.set(flag.key, flag);
    }
    async getFlag(key, context) {
        const flag = this.flags.get(key);
        if (!flag) {
            return null;
        }
        // Check expiration
        if (flag.expiresAt && flag.expiresAt < new Date()) {
            return false;
        }
        // Check environment
        if (flag.environments && context.environment) {
            if (!flag.environments.includes(context.environment)) {
                return false;
            }
        }
        // Check tenant whitelist
        if (flag.tenants && context.tenantId) {
            if (!flag.tenants.includes(context.tenantId)) {
                return false;
            }
        }
        // Check rollout percentage
        if (flag.rolloutPercentage !== undefined) {
            const hash = this.hashContext(key, context);
            const percentage = (hash % 100);
            if (percentage >= flag.rolloutPercentage) {
                return false;
            }
        }
        // Check variants (A/B testing)
        if (flag.variants && Object.keys(flag.variants).length > 0) {
            const hash = this.hashContext(key, context);
            const percentage = hash % 100;
            let cumulative = 0;
            for (const [variant, variantPercentage] of Object.entries(flag.variants)) {
                cumulative += variantPercentage;
                if (percentage < cumulative) {
                    return variant;
                }
            }
        }
        return flag.enabled;
    }
    async getFlags(context) {
        const result = {};
        for (const [key] of this.flags) {
            const value = await this.getFlag(key, context);
            if (value !== null) {
                result[key] = value;
            }
        }
        return result;
    }
    hashContext(key, context) {
        const str = `${key}:${context.tenantId || ''}:${context.userId || ''}`;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
}
// Default service instance
let featureFlagService = new InMemoryFeatureFlagService();
/**
 * Set feature flag service (for dependency injection)
 */
function setFeatureFlagService(service) {
    featureFlagService = service;
}
/**
 * Get feature flag service
 */
function getFeatureFlagService() {
    return featureFlagService;
}
/**
 * Feature flag middleware
 */
function featureFlagsMiddleware() {
    return async (req, _res, next) => {
        try {
            const context = {
                tenantId: req.tenantId || req.user?.tenantId,
                userId: req.userId || req.user?.id,
                environment: process.env.NODE_ENV || 'development',
            };
            req.featureFlagContext = context;
            req.featureFlags = await featureFlagService.getFlags(context);
            // Log feature flag access for analytics
            (0, logger_1.logInfo)('Feature flags loaded', {
                tenantId: context.tenantId,
                flagsCount: Object.keys(req.featureFlags).length,
            });
            next();
        }
        catch (error) {
            // Don't fail request if feature flags fail
            (0, logger_1.logInfo)('Feature flags error (non-blocking)', { error });
            req.featureFlags = {};
            next();
        }
    };
}
/**
 * Check if feature is enabled
 */
function isFeatureEnabled(req, key) {
    const value = req.featureFlags?.[key];
    return value === true || value === 'enabled';
}
/**
 * Get feature variant (for A/B testing)
 */
function getFeatureVariant(req, key) {
    const value = req.featureFlags?.[key];
    if (typeof value === 'string' && value !== 'enabled' && value !== 'disabled') {
        return value;
    }
    return null;
}
/**
 * Require feature flag middleware (fails request if flag not enabled)
 */
function requireFeatureFlag(key) {
    return (req, res, next) => {
        if (!isFeatureEnabled(req, key)) {
            res.status(403).json({
                error: 'Feature Not Available',
                message: `Feature flag '${key}' is not enabled for your account`,
            });
        }
        next();
    };
}
//# sourceMappingURL=feature-flags.js.map