/**
 * Licensing & Feature Flags
 * Manages OSS vs Commercial feature access
 */

import React from 'react';

export type LicenseTier = 'oss' | 'commercial' | 'enterprise';

export interface LicenseConfig {
  tier: LicenseTier;
  features: Set<string>;
  expiresAt?: string; // ISO 8601
}

let currentLicense: LicenseConfig = {
  tier: 'oss',
  features: new Set(['core', 'basic-components', 'validation', 'security-basic'])
};

/**
 * Feature Flags
 * Defines which features are available in each tier
 */
export const FEATURE_FLAGS = {
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
} as const;

/**
 * Set license configuration
 */
export function setLicense(config: LicenseConfig): void {
  currentLicense = config;
  
  // Validate license expiration
  if (config.expiresAt) {
    const expiresAt = new Date(config.expiresAt);
    if (expiresAt < new Date()) {
      console.warn('License has expired. Falling back to OSS tier.');
      currentLicense = {
        tier: 'oss',
        features: new Set([FEATURE_FLAGS.CORE_PROTOCOL, FEATURE_FLAGS.BASIC_COMPONENTS])
      };
    }
  }
}

/**
 * Get current license
 */
export function getLicense(): LicenseConfig {
  return currentLicense;
}

/**
 * Check if feature is available
 */
export function hasFeature(feature: string): boolean {
  return currentLicense.features.has(feature);
}

/**
 * Check if tier is at least the specified tier
 */
export function hasTier(minTier: LicenseTier): boolean {
  const tierOrder: Record<LicenseTier, number> = {
    'oss': 0,
    'commercial': 1,
    'enterprise': 2
  };
  
  return tierOrder[currentLicense.tier] >= tierOrder[minTier];
}

/**
 * Require feature (throws if not available)
 */
export function requireFeature(feature: string, featureName?: string): void {
  if (!hasFeature(feature)) {
    const name = featureName || feature;
    throw new Error(
      `${name} is a commercial feature. Upgrade to Settler Commercial to access this feature. ` +
      `Visit https://settler.dev/pricing to learn more.`
    );
  }
}

/**
 * Require tier (throws if tier not met)
 */
export function requireTier(minTier: LicenseTier): void {
  if (!hasTier(minTier)) {
    const tierNames: Record<LicenseTier, string> = {
      'oss': 'OSS',
      'commercial': 'Commercial',
      'enterprise': 'Enterprise'
    };
    
    throw new Error(
      `This feature requires ${tierNames[minTier]} tier. ` +
      `Visit https://settler.dev/pricing to upgrade.`
    );
  }
}

/**
 * Get upgrade message
 */
export function getUpgradeMessage(feature: string): string {
  return `Upgrade to Settler Commercial to unlock ${feature}. Visit https://settler.dev/pricing`;
}

/**
 * Hook to check feature availability
 */
export function useFeature(feature: string): boolean {
  return hasFeature(feature);
}

/**
 * Hook to require feature (shows upgrade UI if not available)
 */
export function useFeatureGate(feature: string, fallback?: React.ReactNode): {
  hasAccess: boolean;
  UpgradePrompt: React.ComponentType;
} {
  const hasAccess = hasFeature(feature);
  
  const UpgradePrompt = () => {
    if (hasAccess) {
      return null;
    }
    
    return (
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          border: '2px dashed #e5e7eb',
          borderRadius: '8px',
          backgroundColor: '#f9fafb'
        }}
      >
        <h3 style={{ marginTop: 0, color: '#111827' }}>
          Upgrade Required
        </h3>
        <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
          {getUpgradeMessage(feature)}
        </p>
        <a
          href="https://settler.dev/pricing"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontWeight: 600
          }}
        >
          View Pricing
        </a>
      </div>
    );
  };
  
  return {
    hasAccess,
    UpgradePrompt: fallback ? () => (hasAccess ? null : <>{fallback}</>) : UpgradePrompt
  };
}
