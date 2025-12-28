/**
 * Export Retention Policy Service
 *
 * Creates switching friction by limiting export availability after cancellation.
 * Exports are only available for a limited time after account cancellation.
 *
 * PHASE: Workflow Lock-In Reinforcement
 *
 * Based on narrative compression requirements:
 * - Export available for 30 days after cancellation (creates switching friction)
 * - After 30 days, exports are deleted (customers lose access to historical data)
 * - This makes switching more expensive (customers must export before canceling)
 */
export interface ExportRetentionPolicy {
    tier: string;
    activeAccountDays: number;
    cancelledAccountDays: number;
}
/**
 * Export Retention Policy Service
 *
 * Manages export availability and deletion based on account status
 */
export declare class ExportRetentionPolicyService {
    /**
     * Get retention policy for tier
     */
    getRetentionPolicy(tierId: string): ExportRetentionPolicy;
    /**
     * Check if export is still available
     *
     * Returns true if export is available, false if it should be deleted
     */
    isExportAvailable(exportId: string, tenantId: string): Promise<{
        available: boolean;
        expiresAt?: Date;
        reason?: string;
    }>;
    /**
     * Delete expired exports
     *
     * Should be run as a scheduled job (daily)
     */
    deleteExpiredExports(): Promise<{
        deleted: number;
        errors: number;
    }>;
    /**
     * Get export expiration warning for tenant
     *
     * Warns tenants about export expiration after cancellation
     */
    getExpirationWarning(tenantId: string): Promise<string | null>;
}
export declare const exportRetentionPolicyService: ExportRetentionPolicyService;
//# sourceMappingURL=export-retention-policy.d.ts.map