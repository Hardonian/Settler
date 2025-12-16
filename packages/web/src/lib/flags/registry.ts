/**
 * Feature Flags Registry
 * 
 * Typed registry of all feature flags as business policy controls.
 * Flags map to business controls (alert thresholds, sensitivity, etc.), not UI toggles.
 */

import type { FlagDefinition, FlagKey } from '@/lib/domain/types';

export const FLAG_REGISTRY: Record<FlagKey, FlagDefinition> = {
  // Alert Thresholds
  'alert.threshold.critical_delta': {
    key: 'alert.threshold.critical_delta',
    description: 'Critical alert threshold for reconciliation deltas (in cents)',
    type: 'number',
    default: 500000, // $5,000
    scope: 'tenant',
    validation: {
      min: 0,
      max: 100000000, // $1M max
    },
    rolloutNotes: 'Controls when reconciliation deltas trigger critical alerts',
  },
  
  'alert.threshold.high_delta': {
    key: 'alert.threshold.high_delta',
    description: 'High alert threshold for reconciliation deltas (in cents)',
    type: 'number',
    default: 100000, // $1,000
    scope: 'tenant',
    validation: {
      min: 0,
      max: 10000000, // $100K max
    },
  },
  
  'alert.threshold.drift_count': {
    key: 'alert.threshold.drift_count',
    description: 'Number of drift events before alerting',
    type: 'number',
    default: 3,
    scope: 'tenant',
    validation: {
      min: 1,
      max: 100,
    },
  },
  
  // Sensitivity Levels
  'reconciliation.sensitivity': {
    key: 'reconciliation.sensitivity',
    description: 'Reconciliation sensitivity level (low, medium, high)',
    type: 'string',
    default: 'medium',
    scope: 'tenant',
    validation: {
      enum: ['low', 'medium', 'high'],
    },
  },
  
  'explanation.depth': {
    key: 'explanation.depth',
    description: 'Explanation detail level (basic, detailed, verbose)',
    type: 'string',
    default: 'detailed',
    scope: 'tenant',
    validation: {
      enum: ['basic', 'detailed', 'verbose'],
    },
  },
  
  // Export Permissions
  'export.enabled': {
    key: 'export.enabled',
    description: 'Enable data exports',
    type: 'boolean',
    default: true,
    scope: 'tenant',
  },
  
  'export.format.json': {
    key: 'export.format.json',
    description: 'Allow JSON export format',
    type: 'boolean',
    default: true,
    scope: 'tenant',
  },
  
  'export.format.csv': {
    key: 'export.format.csv',
    description: 'Allow CSV export format',
    type: 'boolean',
    default: true,
    scope: 'tenant',
  },
  
  // Connector Enablement
  'connector.stripe.enabled': {
    key: 'connector.stripe.enabled',
    description: 'Enable Stripe connector',
    type: 'boolean',
    default: true,
    scope: 'tenant',
  },
  
  'connector.shopify.enabled': {
    key: 'connector.shopify.enabled',
    description: 'Enable Shopify connector',
    type: 'boolean',
    default: true,
    scope: 'tenant',
  },
  
  'connector.paypal.enabled': {
    key: 'connector.paypal.enabled',
    description: 'Enable PayPal connector',
    type: 'boolean',
    default: true,
    scope: 'tenant',
  },
  
  // Receipt Integrity
  'receipt.hash_chain.enabled': {
    key: 'receipt.hash_chain.enabled',
    description: 'Enable receipt hash chain for tamper detection',
    type: 'boolean',
    default: true,
    scope: 'tenant',
  },
  
  'receipt.evidence.required': {
    key: 'receipt.evidence.required',
    description: 'Require evidence references for receipts',
    type: 'boolean',
    default: false,
    scope: 'tenant',
  },
  
  // Reconciliation Features
  'reconciliation.auto_resolve': {
    key: 'reconciliation.auto_resolve',
    description: 'Automatically resolve low-risk reconciliation items',
    type: 'boolean',
    default: false,
    scope: 'tenant',
  },
  
  'reconciliation.notify_on_completion': {
    key: 'reconciliation.notify_on_completion',
    description: 'Send notification when reconciliation completes',
    type: 'boolean',
    default: true,
    scope: 'tenant',
  },
  
  // Global Flags (not tenant-specific)
  'system.maintenance_mode': {
    key: 'system.maintenance_mode',
    description: 'Enable system-wide maintenance mode',
    type: 'boolean',
    default: false,
    scope: 'global',
  },
} as const;

/**
 * Get flag definition by key
 */
export function getFlagDefinition(key: FlagKey): FlagDefinition | undefined {
  return FLAG_REGISTRY[key];
}

/**
 * Get all flag definitions
 */
export function getAllFlagDefinitions(): FlagDefinition[] {
  return Object.values(FLAG_REGISTRY);
}

/**
 * Get flags by scope
 */
export function getFlagsByScope(scope: 'tenant' | 'global'): FlagDefinition[] {
  return Object.values(FLAG_REGISTRY).filter((flag) => flag.scope === scope);
}
