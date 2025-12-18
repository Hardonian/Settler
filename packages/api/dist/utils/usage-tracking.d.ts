/**
 * Usage Tracking Utility
 *
 * Tracks usage events for billing and entitlement enforcement.
 * Works with Supabase client used in API routes.
 */
/**
 * Track a usage event
 */
export declare function trackUsageEvent(params: {
    billingAccountId: string;
    eventType: string;
    quantity?: number;
    userId?: string;
    tenantId?: string;
    projectId?: string;
    integrationId?: string;
    metadata?: Record<string, unknown>;
}): Promise<void>;
/**
 * Track ingestion usage
 */
export declare function trackIngestionUsage(params: {
    billingAccountId: string;
    userId: string;
    tenantId: string;
    ingestionId?: string;
}): Promise<void>;
/**
 * Track export usage
 */
export declare function trackExportUsage(params: {
    billingAccountId: string;
    userId: string;
    tenantId: string;
    exportId?: string;
}): Promise<void>;
//# sourceMappingURL=usage-tracking.d.ts.map