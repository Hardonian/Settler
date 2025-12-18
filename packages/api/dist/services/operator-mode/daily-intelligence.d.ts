/**
 * Daily Intelligence Service
 * Aggregates key operational metrics for operator visibility
 */
export interface DailyIntelligence {
    date: string;
    errorRate: {
        overall: number;
        byEndpoint: Array<{
            method: string;
            route: string;
            errorRate: number;
            errorCount: number;
            totalRequests: number;
        }>;
    };
    slowEndpoints: Array<{
        method: string;
        route: string;
        p50: number;
        p95: number;
        p99: number;
        requestCount: number;
    }>;
    failedIngestions: Array<{
        ingestionId: string;
        sourceId: string;
        tenantId: string;
        errorMessage: string;
        failedAt: string;
        traceId?: string;
    }>;
    billingAnomalies: Array<{
        tenantId: string;
        billingAccountId: string;
        anomalyType: 'usage_spike' | 'cost_spike' | 'unexpected_charge';
        currentValue: number;
        expectedValue: number;
        percentageChange: number;
        detectedAt: string;
    }>;
}
/**
 * Get error rate summary for the last 24 hours
 */
export declare function getErrorRateSummary(date?: Date): Promise<DailyIntelligence['errorRate']>;
/**
 * Get slow endpoints (P50, P95, P99 latencies)
 */
export declare function getSlowEndpoints(date?: Date): Promise<DailyIntelligence['slowEndpoints']>;
/**
 * Get failed ingestions for the last 24 hours
 */
export declare function getFailedIngestions(date?: Date): Promise<DailyIntelligence['failedIngestions']>;
/**
 * Detect billing anomalies
 */
export declare function getBillingAnomalies(date?: Date): Promise<DailyIntelligence['billingAnomalies']>;
/**
 * Generate daily intelligence report
 */
export declare function generateDailyIntelligence(date?: Date): Promise<DailyIntelligence>;
//# sourceMappingURL=daily-intelligence.d.ts.map