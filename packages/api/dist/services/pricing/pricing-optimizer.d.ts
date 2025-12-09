/**
 * Pricing Optimizer
 *
 * Generates pricing recommendations
 * Part of Section 9: Pricing Intelligence
 */
import { PrismaClient } from '@prisma/client';
export interface PricingRecommendation {
    type: 'tier_adjustment' | 'usage_threshold' | 'overage_pricing' | 'enterprise_deal';
    recommendation: string;
    rationale: string;
    impact: 'low' | 'medium' | 'high';
    estimatedRevenueChange: number;
}
export declare class PricingOptimizer {
    private _prisma;
    constructor(prisma: PrismaClient);
    /**
     * Generate pricing recommendations
     */
    generateRecommendations(): Promise<PricingRecommendation[]>;
    /**
     * Analyze customer segments
     */
    private analyzeSegments;
    /**
     * Analyze tier pricing
     */
    private analyzeTiers;
    /**
     * Analyze usage thresholds
     */
    private analyzeThresholds;
    /**
     * Analyze overage pricing
     */
    private analyzeOverage;
    /**
     * Generate enterprise deal recommendations
     */
    generateEnterpriseRecommendations(_customerId: string): Promise<PricingRecommendation[]>;
}
//# sourceMappingURL=pricing-optimizer.d.ts.map