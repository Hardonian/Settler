/**
 * Product Evolution AI
 *
 * Proposes new features, modules, and improvements
 * Part of Phase VII: Platform Intelligence
 */
import { PrismaClient } from '@prisma/client';
export interface ProductProposal {
    type: 'vertical_module' | 'workflow_recipe' | 'mapping_template' | 'api_enhancement';
    title: string;
    description: string;
    rationale: string;
    estimatedImpact: 'low' | 'medium' | 'high';
    priority: number;
}
export declare class ProductEvolutionAI {
    private _prisma;
    constructor(prisma: PrismaClient);
    /**
     * Generate product evolution proposals
     */
    generateProposals(tenantId?: string): Promise<ProductProposal[]>;
    /**
     * Analyze usage patterns
     */
    private analyzeUsagePatterns;
}
//# sourceMappingURL=product-evolution.d.ts.map