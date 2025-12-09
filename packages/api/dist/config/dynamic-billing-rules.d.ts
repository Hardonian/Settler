/**
 * Dynamic Billing Rules Configuration
 *
 * Allows billing tiers and rules to be configured dynamically
 * without code changes.
 */
export interface BillingTier {
    id: string;
    name: string;
    base_price_monthly: number;
    limits: {
        reconciliation_jobs: number;
        api_requests: number;
        webhook_events: number;
        db_queries: number;
        ai_requests: number;
        auth_users: number;
        storage_gb: number;
    };
    features: string[];
    metadata?: Record<string, unknown>;
}
export interface UsagePricingRule {
    event_type: string;
    base_limit: number;
    overage_price_per_unit: number;
    unit: string;
    tier_multipliers?: Record<string, number>;
}
/**
 * Default billing tiers
 */
export declare const BILLING_TIERS: Record<string, BillingTier>;
/**
 * Usage pricing rules
 */
export declare const USAGE_PRICING_RULES: Record<string, UsagePricingRule>;
/**
 * Get billing tier configuration
 */
export declare function getBillingTier(tierId: string): BillingTier | null;
/**
 * Get usage pricing rule
 */
export declare function getUsagePricingRule(eventType: string): UsagePricingRule | null;
/**
 * Calculate overage cost
 */
export declare function calculateOverageCost(eventType: string, usage: number, limit: number, tierId?: string): number;
/**
 * Get plan limit for event type
 */
export declare function getPlanLimit(tierId: string, eventType: string): number;
/**
 * Get all billing tiers
 */
export declare function getAllBillingTiers(): Record<string, BillingTier>;
/**
 * Update billing tier dynamically
 */
export declare function updateBillingTier(tierId: string, updates: Partial<BillingTier>, _supabase: unknown): Promise<boolean>;
//# sourceMappingURL=dynamic-billing-rules.d.ts.map