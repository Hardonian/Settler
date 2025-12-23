/**
 * Learning Loops Service
 *
 * PHASE 5: Internal Learning & Feedback Loops
 *
 * Makes the system smarter over time:
 * - Pattern detection from past reconciliations
 * - Anomaly baselines per tenant
 * - Auto-suggestions derived from historical outcomes
 *
 * Rules: Learning is tenant-isolated, explainable improvements only
 */
export interface Pattern {
    id: string;
    tenantId: string;
    patternType: 'matching' | 'validation' | 'transformation' | 'anomaly';
    patternKey: string;
    patternValue: Record<string, unknown>;
    confidence: number;
    occurrenceCount: number;
    firstObserved: Date;
    lastObserved: Date;
    explanation: string;
}
export interface AnomalyBaseline {
    id: string;
    tenantId: string;
    metric: string;
    baselineValue: number;
    standardDeviation: number;
    sampleSize: number;
    lastUpdated: Date;
}
export interface AutoSuggestion {
    id: string;
    tenantId: string;
    suggestionType: 'matching_rule' | 'validation_rule' | 'transformation' | 'optimization';
    suggestion: string;
    rationale: string;
    confidence: number;
    estimatedImpact: 'high' | 'medium' | 'low';
    createdAt: Date;
}
export declare class LearningLoopsService {
    /**
     * Learn from reconciliation outcome
     */
    learnFromReconciliation(tenantId: string, reconciliationId: string, outcome: {
        matchedCount: number;
        unmatchedCount: number;
        confidenceAvg: number;
        matchingRules: string[];
        validationResults: Array<{
            rule: string;
            passed: boolean;
            reason?: string;
        }>;
    }): Promise<void>;
    /**
     * Learn matching patterns
     */
    private learnMatchingPatterns;
    /**
     * Learn validation patterns
     */
    private learnValidationPatterns;
    /**
     * Store pattern
     */
    private storePattern;
    /**
     * Calculate pattern confidence
     */
    private calculatePatternConfidence;
    /**
     * Update anomaly baselines
     */
    private updateAnomalyBaselines;
    /**
     * Update baseline for a metric
     */
    private updateBaseline;
    /**
     * Detect anomaly
     */
    detectAnomaly(tenantId: string, metric: string, value: number): Promise<{
        isAnomaly: boolean;
        deviation: number;
        explanation: string;
    }>;
    /**
     * Generate auto-suggestions
     */
    generateAutoSuggestions(tenantId: string): Promise<AutoSuggestion[]>;
    /**
     * Map pattern type to suggestion type
     */
    private mapPatternTypeToSuggestionType;
    /**
     * Get learning metrics
     */
    getLearningMetrics(tenantId: string): Promise<{
        patterns: number;
        baselines: number;
        suggestions: number;
        learningEfficiency: number;
    }>;
}
export declare const learningLoopsService: LearningLoopsService;
//# sourceMappingURL=learning-loops.d.ts.map