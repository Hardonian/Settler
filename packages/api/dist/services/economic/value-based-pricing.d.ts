/**
 * Value-Based Pricing Engine
 *
 * Analyzes workflow complexity, recon difficulty, LLM cost, customer ROI
 * Part 12: Economic & Marketplace Intelligence Engine
 */
import { PrismaClient } from '@prisma/client';
export interface PricingAnalysis {
    workflowComplexity: 'low' | 'medium' | 'high' | 'very_high';
    reconDifficulty: number;
    llmCostExposure: number;
    customerROI: number;
    marketWillingness: number;
    recommendedPrice: number;
    pricingTier: 'starter' | 'professional' | 'enterprise' | 'custom';
}
export interface PricingRecommendation {
    personalizedPrice: number;
    usageTier: string;
    enterpriseDealSimulation?: {
        basePrice: number;
        volumeDiscount: number;
        customTerms: string[];
    };
}
export declare class ValueBasedPricing {
    private prisma;
    private metaModels;
    constructor(prisma: PrismaClient);
    /**
     * Analyze pricing for tenant
     */
    analyzePricing(tenantId: string): Promise<PricingAnalysis>;
    /**
     * Generate pricing recommendation
     */
    generateRecommendation(tenantId: string): Promise<PricingRecommendation>;
    /**
     * Get tenant usage
     */
    private getTenantUsage;
    /**
     * Analyze workflow complexity
     */
    private analyzeWorkflowComplexity;
    /**
     * Analyze recon difficulty
     */
    private analyzeReconDifficulty;
    /**
     * Calculate LLM cost exposure
     */
    private calculateLLMCostExposure;
    /**
     * Estimate customer ROI
     */
    private estimateCustomerROI;
    /**
     * Estimate market willingness
     */
    private estimateMarketWillingness;
    /**
     * Calculate recommended price
     */
    private calculateRecommendedPrice;
    /**
     * Determine pricing tier
     */
    private determinePricingTier;
    /**
     * Suggest usage tier
     */
    private suggestUsageTier;
}
//# sourceMappingURL=value-based-pricing.d.ts.map