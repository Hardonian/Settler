/**
 * Data Retention Enforcement Service
 *
 * Automatically enforces data retention policies per tier.
 * Deletes data older than retention period for each billing tier.
 */
interface RetentionPolicy {
    tier: string;
    reconciliation_data_days: number;
    receipt_data_days: number;
    usage_data_days: number;
    audit_log_days: number;
}
/**
 * Get retention policy for tier
 */
export declare function getRetentionPolicy(tierId: string): RetentionPolicy;
/**
 * Enforce retention policy for a billing account
 */
export declare function enforceRetentionPolicy(billingAccountId: string, tierId: string): Promise<{
    deleted: number;
    errors: number;
}>;
/**
 * Enforce retention for all billing accounts
 * Should be run as a scheduled job (daily)
 */
export declare function enforceAllRetentionPolicies(): Promise<{
    accountsProcessed: number;
    totalDeleted: number;
    totalErrors: number;
}>;
export {};
//# sourceMappingURL=enforcer.d.ts.map