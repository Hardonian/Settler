/**
 * Ops Intelligence Insights Engine
 *
 * Deterministic insight generation from real metrics.
 * Generates insights for: cost, support, usage, stability
 *
 * Performance optimizations:
 * - Parallel queries where possible
 * - Query batching
 * - Error handling with fallbacks
 * - Timeout protection
 */
export type InsightType = 'cost' | 'support' | 'usage' | 'stability';
export type InsightSeverity = 'info' | 'warn' | 'critical';
export interface Insight {
    type: InsightType;
    title: string;
    summary: string;
    severity: InsightSeverity;
    confidence: number;
    timeWindow: {
        start: string;
        end: string;
    };
    evidence: {
        metrics: Record<string, any>;
        pivots?: Record<string, any>;
        deltas?: Record<string, any>;
    };
    relatedEntities: {
        orgIds?: string[];
        routes?: string[];
        features?: string[];
    };
    expiresAt?: Date;
}
export interface InsightGenerationResult {
    insights: Insight[];
    generatedAt: Date;
}
/**
 * Generate all insights for a given time window
 */
export declare function generateInsights(supabaseUrl: string, supabaseKey: string, timeWindow: {
    start: Date;
    end: Date;
}): Promise<InsightGenerationResult>;
//# sourceMappingURL=insights-engine.d.ts.map