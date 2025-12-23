/**
 * Data Gravity Service
 *
 * PHASE 2: Data Gravity & Switching Friction
 *
 * Creates accumulated intelligence that improves over time:
 * - Canonical internal data models
 * - Derived artifacts users cannot easily recreate
 * - Longitudinal insights (patterns over time, deltas, drift)
 *
 * Goal: User value increases the longer they stay, exports are possible but lossy
 */
export interface LongitudinalInsight {
    id: string;
    tenantId: string;
    insightType: 'pattern' | 'anomaly' | 'trend' | 'correlation' | 'baseline';
    entityType: string;
    entityId?: string;
    metric: string;
    value: number;
    historicalValues: Array<{
        date: Date;
        value: number;
    }>;
    trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    confidence: number;
    firstObserved: Date;
    lastObserved: Date;
    metadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
export interface DerivedArtifact {
    id: string;
    tenantId: string;
    artifactType: 'reconciliation_pattern' | 'matching_rule' | 'validation_baseline' | 'drift_profile';
    sourceEntityType: string;
    sourceEntityIds: string[];
    derivedData: Record<string, unknown>;
    confidence: number;
    usageCount: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface DataGravityMetrics {
    tenantId: string;
    totalDataPoints: number;
    historicalDepth: number;
    derivedArtifacts: number;
    longitudinalInsights: number;
    switchingCost: number;
    dataValue: number;
}
export declare class DataGravityService {
    /**
     * Record a data point and update longitudinal insights
     */
    recordDataPoint(tenantId: string, entityType: string, entityId: string, metric: string, value: number, metadata?: Record<string, unknown>): Promise<void>;
    /**
     * Update longitudinal insight
     */
    private updateLongitudinalInsight;
    /**
     * Detect patterns from historical data
     */
    private detectPatterns;
    /**
     * Analyze patterns in historical data
     */
    private analyzePatterns;
    /**
     * Detect linear trend
     */
    private detectLinearTrend;
    /**
     * Calculate trend from historical values
     */
    private calculateTrend;
    /**
     * Calculate confidence based on data quality
     */
    private calculateConfidence;
    /**
     * Create derived artifact
     */
    private createDerivedArtifact;
    /**
     * Get data gravity metrics for a tenant
     */
    getDataGravityMetrics(tenantId: string): Promise<DataGravityMetrics>;
    /**
     * Estimate switching cost
     */
    private estimateSwitchingCost;
    /**
     * Estimate data value
     */
    private estimateDataValue;
    /**
     * Generate export (lossy - excludes derived artifacts and insights)
     */
    generateExport(tenantId: string, _format?: 'csv' | 'json'): Promise<{
        data: any[];
        metadata: {
            totalRecords: number;
            exportedAt: Date;
            lossy: boolean;
            excludedTypes: string[];
        };
    }>;
}
export declare const dataGravityService: DataGravityService;
//# sourceMappingURL=data-gravity.d.ts.map