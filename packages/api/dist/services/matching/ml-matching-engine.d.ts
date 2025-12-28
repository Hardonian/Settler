/**
 * Proprietary ML Matching Engine
 *
 * Trains ML models on historical reconciliation matches to improve accuracy
 * beyond deterministic algorithms. This creates a proprietary data moat.
 *
 * PHASE: Data Moat Reinforcement
 */
export interface MLMatchFeatures {
    amountDiff: number;
    dateDiff: number;
    descriptionSimilarity: number;
    currencyMatch: boolean;
    externalIdMatch: boolean;
    sourceAdapter: string;
    targetAdapter: string;
    historicalMatchRate: number;
}
export interface MLMatchPrediction {
    confidence: number;
    matchType: "exact" | "fuzzy" | "manual" | "unmatched";
    reasoning: string;
    modelVersion: string;
}
/**
 * ML Matching Engine
 *
 * Uses historical match data to train models that improve matching accuracy.
 * Models are trained per tenant and aggregated across tenants (with opt-in).
 */
export declare class MLMatchingEngine {
    private modelVersion;
    private trainingDataCache;
    /**
     * Predict match using ML model
     * Falls back to deterministic algorithm if model not trained
     */
    predictMatch(sourceTransactionId: string, targetTransactionIds: string[], tenantId: string, sourceAdapter: string, targetAdapter: string): Promise<MLMatchPrediction | null>;
    /**
     * Score match using ML model
     * Uses weighted features trained on historical data
     */
    private scoreMatch;
    /**
     * Get model weights for tenant
     * Trained on historical matches, falls back to default weights
     */
    private getModelWeights;
    /**
     * Train model on historical matches
     * This creates the proprietary data moat
     */
    trainModel(tenantId: string): Promise<void>;
    /**
     * Get historical match rate from cross-customer intelligence
     * This is a proprietary feature that competitors cannot replicate
     */
    private getHistoricalMatchRate;
    /**
     * Calculate description similarity
     */
    private calculateDescriptionSimilarity;
    /**
     * Levenshtein distance
     */
    private levenshteinDistance;
}
export declare const mlMatchingEngine: MLMatchingEngine;
//# sourceMappingURL=ml-matching-engine.d.ts.map