/**
 * Query Optimization Layer
 * Uses materialized views and optimized queries for performant data access
 */
export interface QueryOptions {
    /** Use materialized view if available */
    useMaterializedView?: boolean;
    /** Force refresh materialized view before query */
    refreshView?: boolean;
    /** Cache result */
    cache?: boolean;
    /** Cache TTL in seconds */
    cacheTtl?: number;
}
/**
 * Get reconciliation summary using materialized view
 * Much faster than querying raw reconciliation data
 */
export declare function getReconciliationSummary(jobId: string, dateRange?: {
    start: Date;
    end: Date;
}, options?: QueryOptions): Promise<any>;
/**
 * Get job performance metrics using materialized view
 */
export declare function getJobPerformance(jobId: string, options?: QueryOptions): Promise<any>;
/**
 * Get tenant usage metrics using materialized view
 */
export declare function getTenantUsage(tenantId: string, timeRange?: 'hour' | 'day' | 'week', options?: QueryOptions): Promise<any>;
/**
 * Get match accuracy by job using materialized view
 */
export declare function getMatchAccuracy(jobId?: string, options?: QueryOptions): Promise<any>;
/**
 * Refresh a materialized view
 */
export declare function refreshMaterializedView(viewName: string): Promise<void>;
/**
 * Refresh all materialized views
 */
export declare function refreshAllMaterializedViews(): Promise<void>;
//# sourceMappingURL=query-optimization.d.ts.map