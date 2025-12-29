/**
 * Reconciliation Quality Monitor
 *
 * Monitors reconciliation quality metrics and triggers alerts when thresholds are exceeded.
 * Implements industry-standard quality monitoring practices.
 */
export interface QualityMetrics {
    matchRate: number;
    autoResolutionRate: number;
    exceptionRate: number;
    averageConfidence: number;
    resolutionTimeMinutes: number;
    totalMatches: number;
    reviewedMatches: number;
    autoApprovedMatches: number;
    ruleResolvedMatches: number;
    exceptionHandledMatches: number;
    systemFlaggedMatches: number;
}
export interface QualityAlert {
    runId: string;
    tenantId: string;
    alertType: "match_rate_low" | "auto_resolution_rate_low" | "exception_rate_high" | "confidence_low" | "resolution_time_high";
    severity: "warning" | "critical";
    message: string;
    currentValue: number;
    threshold: number;
    metrics: QualityMetrics;
}
/**
 * Calculate quality metrics for a reconciliation run
 */
export declare function calculateQualityMetrics(runId: string, tenantId: string): Promise<QualityMetrics>;
/**
 * Check quality metrics against thresholds and generate alerts
 */
export declare function checkQualityThresholds(runId: string, tenantId: string): Promise<QualityAlert[]>;
/**
 * Generate quality report for a reconciliation run
 */
export declare function generateQualityReport(runId: string, tenantId: string): Promise<{
    runId: string;
    tenantId: string;
    metrics: QualityMetrics;
    alerts: QualityAlert[];
    status: "pass" | "warning" | "critical";
    timestamp: Date;
}>;
//# sourceMappingURL=quality-monitor.d.ts.map