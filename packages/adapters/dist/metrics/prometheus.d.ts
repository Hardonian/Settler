/**
 * Prometheus Metrics
 *
 * Exports metrics for monitoring connector performance
 */
export interface MetricLabels {
    connector_id?: string;
    tenant_id?: string;
    status?: string;
    error_type?: string;
    event_type?: string;
}
export declare class PrometheusMetrics {
    private metrics;
    private histograms;
    /**
     * Increment counter metric
     */
    incrementCounter(name: string, labels?: MetricLabels, value?: number): void;
    /**
     * Set gauge metric
     */
    setGauge(name: string, value: number, labels?: MetricLabels): void;
    /**
     * Record histogram value
     */
    recordHistogram(name: string, value: number, labels?: MetricLabels): void;
    /**
     * Build metric key with labels
     */
    private buildKey;
    /**
     * Export metrics in Prometheus format
     */
    export(): string;
    /**
     * Calculate histogram buckets
     */
    private calculateBuckets;
    /**
     * Reset all metrics
     */
    reset(): void;
}
/**
 * Global metrics instance
 */
export declare const metrics: PrometheusMetrics;
/**
 * Track sync start
 */
export declare function trackSyncStart(connectorId: string, tenantId: string): void;
/**
 * Track sync completion
 */
export declare function trackSyncComplete(connectorId: string, tenantId: string, duration: number, counts: {
    transactions?: number;
    accounts?: number;
    errors?: number;
}): void;
/**
 * Track sync failure
 */
export declare function trackSyncFailure(connectorId: string, tenantId: string, duration: number, errorType: string): void;
/**
 * Track API call
 */
export declare function trackApiCall(connectorId: string, statusCode: number, duration: number): void;
/**
 * Track rate limit hit
 */
export declare function trackRateLimit(connectorId: string, tenantId: string): void;
/**
 * Track webhook received
 */
export declare function trackWebhook(connectorId: string, eventType: string, processed: boolean): void;
/**
 * Track token refresh
 */
export declare function trackTokenRefresh(connectorId: string, success: boolean): void;
//# sourceMappingURL=prometheus.d.ts.map