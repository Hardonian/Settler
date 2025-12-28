/**
 * Billing Ops Hardening
 *
 * Implements dunning state, usage-based gating, and entitlement checks.
 */
export type BillingStatus = 'active' | 'past_due' | 'unpaid' | 'canceled' | 'trialing' | 'free';
export interface EntitlementCheck {
    canRunRecon: boolean;
    canCreateRecon: boolean;
    canExport: boolean;
    canViewReports: boolean;
    canUseAPI: boolean;
    message?: string;
    upgradeUrl?: string;
}
/**
 * Derive billing status from subscription and billing account
 */
export declare function getBillingStatus(billingAccountId: string): Promise<BillingStatus>;
/**
 * Check entitlements based on billing status and usage
 */
export declare function checkEntitlements(billingAccountId: string, options?: {
    requestedUsage?: {
        service: string;
        quantity: number;
    };
}): Promise<EntitlementCheck>;
/**
 * Get Stripe customer portal URL for billing management
 */
export declare function getBillingPortalUrl(billingAccountId: string): Promise<string | null>;
//# sourceMappingURL=billing-hardening.d.ts.map