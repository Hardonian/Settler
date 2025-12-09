/**
 * Pattern Extraction Engine
 *
 * Analyzes usage patterns and extracts reusable templates
 * Part of Section 6: Multi-Agent Evolution Layer
 */
import { PrismaClient } from '@prisma/client';
export interface ExtractedPattern {
    type: 'workflow' | 'template' | 'validation_rule' | 'transform_recipe' | 'mapping_template';
    pattern: Record<string, unknown>;
    frequency: number;
    confidence: number;
    recommendation: string;
}
export declare class PatternExtractor {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Extract patterns from usage data
     */
    extractPatterns(tenantId?: string): Promise<ExtractedPattern[]>;
    /**
     * Analyze recurring build failures
     */
    private analyzeFailures;
    /**
     * Analyze recon mismatch patterns
     */
    private analyzeMismatches;
    /**
     * Analyze schema drift patterns
     */
    private analyzeDrift;
    /**
     * Analyze most-used mapping templates
     */
    private analyzeMappings;
    /**
     * Analyze high-usage transforms
     */
    private analyzeTransforms;
    /**
     * Analyze common user workflows
     */
    private analyzeWorkflows;
    /**
     * Generate recommendations from patterns
     */
    generateRecommendations(tenantId?: string): Promise<Array<{
        type: string;
        recommendation: string;
        priority: 'low' | 'medium' | 'high';
        action: Record<string, unknown>;
    }>>;
}
//# sourceMappingURL=pattern-extractor.d.ts.map