"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FEATURE_FLAGS = void 0;
exports.setLicense = setLicense;
exports.getLicense = getLicense;
exports.hasFeature = hasFeature;
exports.hasTier = hasTier;
exports.requireFeature = requireFeature;
exports.requireTier = requireTier;
exports.getUpgradeMessage = getUpgradeMessage;
exports.useFeature = useFeature;
exports.useFeatureGate = useFeatureGate;
const jsx_runtime_1 = require("react/jsx-runtime");
let currentLicense = {
    tier: 'oss',
    features: new Set(['core', 'basic-components', 'validation', 'security-basic'])
};
/**
 * Feature Flags
 * Defines which features are available in each tier
 */
exports.FEATURE_FLAGS = {
    // OSS Features (always available)
    CORE_PROTOCOL: 'core',
    BASIC_COMPONENTS: 'basic-components',
    VALIDATION: 'validation',
    SECURITY_BASIC: 'security-basic',
    MOBILE_BASIC: 'mobile-basic',
    ACCESSIBILITY: 'accessibility',
    // Commercial Features (require subscription)
    MCP_INTEGRATION: 'mcp-integration',
    SHOPIFY_INTEGRATION: 'shopify-integration',
    STRIPE_INTEGRATION: 'stripe-integration',
    WEBHOOK_MANAGER: 'webhook-manager',
    ADVANCED_SECURITY: 'advanced-security',
    AUDIT_LOGGING: 'audit-logging',
    TELEMETRY: 'telemetry',
    EXPORT_ADVANCED: 'export-advanced',
    VIRTUALIZATION: 'virtualization',
    PERFORMANCE_MONITORING: 'performance-monitoring',
    CUSTOM_THEMES: 'custom-themes',
    WHITE_LABEL: 'white-label',
    // Enterprise Features (enterprise subscription)
    SSO: 'sso',
    RBAC: 'rbac',
    CUSTOM_INTEGRATIONS: 'custom-integrations',
    PRIORITY_SUPPORT: 'priority-support',
    SLA: 'sla',
    DEDICATED_INSTANCE: 'dedicated-instance'
};
/**
 * Set license configuration
 */
function setLicense(config) {
    currentLicense = config;
    // Validate license expiration
    if (config.expiresAt) {
        const expiresAt = new Date(config.expiresAt);
        if (expiresAt < new Date()) {
            console.warn('License has expired. Falling back to OSS tier.');
            currentLicense = {
                tier: 'oss',
                features: new Set([exports.FEATURE_FLAGS.CORE_PROTOCOL, exports.FEATURE_FLAGS.BASIC_COMPONENTS])
            };
        }
    }
}
/**
 * Get current license
 */
function getLicense() {
    return currentLicense;
}
/**
 * Check if feature is available
 */
function hasFeature(feature) {
    return currentLicense.features.has(feature);
}
/**
 * Check if tier is at least the specified tier
 */
function hasTier(minTier) {
    const tierOrder = {
        'oss': 0,
        'commercial': 1,
        'enterprise': 2
    };
    return tierOrder[currentLicense.tier] >= tierOrder[minTier];
}
/**
 * Require feature (throws if not available)
 */
function requireFeature(feature, featureName) {
    if (!hasFeature(feature)) {
        const name = featureName || feature;
        throw new Error(`${name} is a commercial feature. Upgrade to Settler Commercial to access this feature. ` +
            `Visit https://settler.dev/pricing to learn more.`);
    }
}
/**
 * Require tier (throws if tier not met)
 */
function requireTier(minTier) {
    if (!hasTier(minTier)) {
        const tierNames = {
            'oss': 'OSS',
            'commercial': 'Commercial',
            'enterprise': 'Enterprise'
        };
        throw new Error(`This feature requires ${tierNames[minTier]} tier. ` +
            `Visit https://settler.dev/pricing to upgrade.`);
    }
}
/**
 * Get upgrade message
 */
function getUpgradeMessage(feature) {
    return `Upgrade to Settler Commercial to unlock ${feature}. Visit https://settler.dev/pricing`;
}
/**
 * Hook to check feature availability
 */
function useFeature(feature) {
    return hasFeature(feature);
}
/**
 * Hook to require feature (shows upgrade UI if not available)
 */
function useFeatureGate(feature, fallback) {
    const hasAccess = hasFeature(feature);
    const UpgradePrompt = () => {
        if (hasAccess) {
            return null;
        }
        return ((0, jsx_runtime_1.jsxs)("div", { style: {
                padding: '2rem',
                textAlign: 'center',
                border: '2px dashed #e5e7eb',
                borderRadius: '8px',
                backgroundColor: '#f9fafb'
            }, children: [(0, jsx_runtime_1.jsx)("h3", { style: { marginTop: 0, color: '#111827' }, children: "Upgrade Required" }), (0, jsx_runtime_1.jsx)("p", { style: { color: '#6b7280', marginBottom: '1rem' }, children: getUpgradeMessage(feature) }), (0, jsx_runtime_1.jsx)("a", { href: "https://settler.dev/pricing", target: "_blank", rel: "noopener noreferrer", style: {
                        display: 'inline-block',
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '6px',
                        fontWeight: 600
                    }, children: "View Pricing" })] }));
    };
    return {
        hasAccess,
        UpgradePrompt: fallback ? () => (hasAccess ? null : (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: fallback })) : UpgradePrompt
    };
}
//# sourceMappingURL=licensing.js.map