/**
 * Export Retention Policy
 *
 * Creates switching friction by limiting export availability.
 * Exports expire after a set period, requiring users to stay on platform
 * to maintain access to their data.
 *
 * PHASE: Data Moat Reinforcement
 */
export interface ExportRetentionConfig {
    defaultRetentionDays: number;
    enterpriseRetentionDays: number;
    cancellationRetentionDays: number;
}
/**
 * Export Retention Policy Service
 */
export declare class ExportRetentionPolicy {
    private config;
    constructor(config?: ExportRetentionConfig);
    /**
     * Get retention period for tenant
     */
    getRetentionPeriod(tenantId: string): Promise<number>;
    /**
     * Get retention period after cancellation
     */
    getCancellationRetentionPeriod(): number;
    /**
     * Check if export has expired
     */
    isExportExpired(exportId: string): Promise<boolean>;
    /**
     * Set export expiration based on retention policy
     */
    setExportExpiration(exportId: string, tenantId: string, isCancellation?: boolean): Promise<void>;
    /**
     * Clean up expired exports
     */
    cleanupExpiredExports(): Promise<number>;
    /**
     * Extend export expiration (for enterprise customers)
     */
    extendExportExpiration(exportId: string, additionalDays: number): Promise<void>;
}
export declare const exportRetentionPolicy: ExportRetentionPolicy;
//# sourceMappingURL=export-retention-policy.d.ts.map