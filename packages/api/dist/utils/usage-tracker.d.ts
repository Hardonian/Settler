/**
 * Usage Tracking Utility
 *
 * Helper functions for logging usage events for billing
 */
export interface UsageEventParams {
    billingAccountId: string;
    eventType: string;
    quantity?: number;
    projectId?: string;
    userId?: string;
    tenantId?: string;
    integrationId?: string;
    addOnId?: string;
    unit?: string;
    metadata?: Record<string, unknown>;
}
/**
 * Log a single usage event
 */
export declare function logUsageEvent(params: UsageEventParams): Promise<string | null>;
/**
 * Log multiple usage events in batch
 */
export declare function logUsageEventsBatch(events: UsageEventParams[]): Promise<string[]>;
/**
 * Get current usage for a billing account
 */
export declare function getCurrentUsage(billingAccountId: string, eventType: string, startDate?: Date, endDate?: Date): Promise<number>;
/**
 * Get usage breakdown by integration
 */
export declare function getUsageByIntegration(billingAccountId: string, startDate?: Date, endDate?: Date): Promise<Record<string, number>>;
//# sourceMappingURL=usage-tracker.d.ts.map