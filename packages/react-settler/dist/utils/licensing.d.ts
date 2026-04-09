/**
 * Licensing & Feature Flags
 * Manages OSS vs Commercial feature access
 */
import React from "react";
export type LicenseTier = "oss" | "commercial" | "enterprise";
export interface LicenseConfig {
    tier: LicenseTier;
    features: Set<string>;
    expiresAt?: string;
}
/**
 * Feature Flags
 * Defines which features are available in each tier
 */
export declare const FEATURE_FLAGS: {
    readonly CORE_PROTOCOL: "core";
    readonly BASIC_COMPONENTS: "basic-components";
    readonly VALIDATION: "validation";
    readonly SECURITY_BASIC: "security-basic";
    readonly MOBILE_BASIC: "mobile-basic";
    readonly ACCESSIBILITY: "accessibility";
    readonly MCP_INTEGRATION: "mcp-integration";
    readonly SHOPIFY_INTEGRATION: "shopify-integration";
    readonly STRIPE_INTEGRATION: "stripe-integration";
    readonly WEBHOOK_MANAGER: "webhook-manager";
    readonly ADVANCED_SECURITY: "advanced-security";
    readonly AUDIT_LOGGING: "audit-logging";
    readonly TELEMETRY: "telemetry";
    readonly EXPORT_ADVANCED: "export-advanced";
    readonly VIRTUALIZATION: "virtualization";
    readonly PERFORMANCE_MONITORING: "performance-monitoring";
    readonly CUSTOM_THEMES: "custom-themes";
    readonly WHITE_LABEL: "white-label";
    readonly SSO: "sso";
    readonly RBAC: "rbac";
    readonly CUSTOM_INTEGRATIONS: "custom-integrations";
    readonly PRIORITY_SUPPORT: "priority-support";
    readonly SLA: "sla";
    readonly DEDICATED_INSTANCE: "dedicated-instance";
};
/**
 * Set license configuration
 */
export declare function setLicense(config: LicenseConfig): void;
/**
 * Get current license
 */
export declare function getLicense(): LicenseConfig;
/**
 * Check if feature is available
 */
export declare function hasFeature(feature: string): boolean;
/**
 * Check if tier is at least the specified tier
 */
export declare function hasTier(minTier: LicenseTier): boolean;
/**
 * Require feature (throws if not available)
 */
export declare function requireFeature(feature: string, featureName?: string): void;
/**
 * Require tier (throws if tier not met)
 */
export declare function requireTier(minTier: LicenseTier): void;
/**
 * Get upgrade message
 */
export declare function getUpgradeMessage(feature: string): string;
/**
 * Hook to check feature availability
 */
export declare function useFeature(feature: string): boolean;
/**
 * Hook to require feature (shows upgrade UI if not available)
 */
export declare function useFeatureGate(feature: string, fallback?: React.ReactNode): {
    hasAccess: boolean;
    UpgradePrompt: React.ComponentType;
};
//# sourceMappingURL=licensing.d.ts.map