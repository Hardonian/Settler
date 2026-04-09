/**
 * Subscription Type Definitions
 *
 * Centralized type definitions for subscription and access control
 */

export type SubscriptionTier =
  | "unsubscribed"
  | "subscribed_unpaid"
  | "subscribed_paid"
  | "enterprise";

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  hasSubscription: boolean;
  isPaid: boolean;
  isEnterprise: boolean;
  planName?: string;
  subscriptionId?: string;
}

export interface AccessLevel {
  canViewTables: boolean;
  canEditTables: boolean;
  canTestAPI: boolean;
  canViewWebhooks: boolean;
  canViewFeatureFlags: boolean;
  canViewReconciliation: boolean;
  canViewReceipts: boolean;
  canViewUsage: boolean;
  canViewBilling: boolean;
  maxTablesPerRequest: number;
  maxAPIRequestsPerDay: number;
}

// Re-export from subscription-access for convenience
export type { SubscriptionTier as SubscriptionTierType } from "../subscription-access";
export type { SubscriptionStatus as SubscriptionStatusType } from "../subscription-access";
export type { AccessLevel as AccessLevelType } from "../subscription-access";
