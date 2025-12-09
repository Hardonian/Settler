/**
 * Usage Tracking Service
 * Tracks user usage for quota enforcement and upgrade nudges
 */
export interface UsageTracking {
    userId: string;
    tenantId: string;
    metricType: string;
    metricValue: number;
    periodStart: Date;
    periodEnd: Date;
}
/**
 * Track usage for a metric
 */
export declare function trackUsage(userId: string, tenantId: string, metricType: string, increment?: number): Promise<void>;
/**
 * Get current usage for a metric
 */
export declare function getCurrentUsage(userId: string, metricType: string, period?: {
    start: Date;
    end: Date;
}): Promise<number>;
/**
 * Check if user has exceeded quota
 */
export declare function checkQuotaExceeded(userId: string, metricType: string, limit: number): Promise<{
    exceeded: boolean;
    current: number;
    limit: number;
    percentage: number;
}>;
/**
 * Track reconciliation execution
 */
export declare function trackReconciliationExecution(userId: string, tenantId: string): Promise<void>;
/**
 * Track export creation
 */
export declare function trackExportCreation(userId: string, tenantId: string): Promise<void>;
/**
 * Track playground run
 */
export declare function trackPlaygroundRun(userId: string, tenantId: string): Promise<void>;
//# sourceMappingURL=tracker.d.ts.map