/**
 * Enhanced Cross-Customer Intelligence
 *
 * Aggregates anonymized reconciliation patterns across all customers.
 * This creates a proprietary data moat that competitors cannot replicate.
 *
 * PHASE: Data Moat Reinforcement
 */
export interface ReconciliationPattern {
    sourceAdapter: string;
    targetAdapter: string;
    matchType: "exact" | "fuzzy" | "manual";
    averageConfidence: number;
    averageAmountDiff: number;
    averageDateDiff: number;
    frequency: number;
    firstSeen: Date;
    lastSeen: Date;
}
export interface PatternInsight {
    patternId: string;
    insight: string;
    confidence: number;
    recommendedAction: string;
}
/**
 * Enhanced Cross-Customer Intelligence Service
 *
 * Stores patterns in database and provides insights that improve matching
 */
export declare class EnhancedCrossCustomerIntelligence {
    /**
     * Record a reconciliation pattern (anonymized)
     */
    recordPattern(tenantId: string, pattern: {
        sourceAdapter: string;
        targetAdapter: string;
        matchType: "exact" | "fuzzy" | "manual";
        confidence: number;
        amountDiff: number;
        dateDiff: number;
    }): Promise<void>;
    /**
     * Get reconciliation pattern insights
     * Returns aggregated patterns across all customers (anonymized)
     */
    getPatternInsights(sourceAdapter: string, targetAdapter: string): Promise<PatternInsight[]>;
    /**
     * Get historical match rate for adapter pair
     * This is a proprietary feature that competitors cannot replicate
     */
    getHistoricalMatchRate(sourceAdapter: string, targetAdapter: string): Promise<number>;
    /**
     * Opt in tenant to pattern sharing
     */
    optIn(tenantId: string): Promise<void>;
    /**
     * Opt out tenant from pattern sharing
     */
    optOut(tenantId: string): Promise<void>;
    /**
     * Check if tenant has opted in
     */
    private isOptedIn;
    /**
     * Hash pattern for anonymization
     */
    private hashPattern;
    /**
     * Generate insight from pattern
     */
    private generateInsight;
}
export declare const enhancedCrossCustomerIntelligence: EnhancedCrossCustomerIntelligence;
//# sourceMappingURL=enhanced-cross-customer-intelligence.d.ts.map