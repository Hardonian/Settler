/**
 * Marketplace Intelligence
 *
 * Evaluates marketplace items and automatically promotes/deprecates
 * Part 12: Economic & Marketplace Intelligence Engine
 */
import { PrismaClient } from '@prisma/client';
export interface MarketplaceItem {
    id: string;
    type: 'template' | 'workflow' | 'transform' | 'mapping' | 'validation';
    name: string;
    popularity: number;
    driftRate: number;
    reliability: number;
    revenuePotential: number;
}
export interface MarketplaceRecommendation {
    action: 'promote' | 'deprecate' | 'update' | 'feature';
    itemId: string;
    reason: string;
    priority: 'low' | 'medium' | 'high';
}
export declare class MarketplaceIntelligence {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Evaluate marketplace items
     */
    evaluateItems(): Promise<MarketplaceItem[]>;
    /**
     * Generate recommendations
     */
    generateRecommendations(): Promise<MarketplaceRecommendation[]>;
    /**
     * Evaluate templates
     */
    private evaluateTemplates;
    /**
     * Evaluate workflows
     */
    private evaluateWorkflows;
    /**
     * Evaluate transforms
     */
    private evaluateTransforms;
    /**
     * Evaluate mappings
     */
    private evaluateMappings;
    /**
     * Evaluate validations
     */
    private evaluateValidations;
    /**
     * Surface trending transforms
     */
    surfaceTrendingTransforms(): Promise<MarketplaceItem[]>;
}
//# sourceMappingURL=marketplace-intelligence.d.ts.map