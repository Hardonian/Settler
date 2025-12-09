/**
 * Health Optimization AI
 *
 * Detects recurrent failures and proposes improvements
 * Part of Phase VII: Platform Intelligence
 */
import { PrismaClient } from '@prisma/client';
export interface HealthRecommendation {
    type: 'template_suggestion' | 'workflow_improvement' | 'mapping_fix' | 'validation_rule';
    description: string;
    confidence: number;
    impact: 'low' | 'medium' | 'high';
    action: Record<string, unknown>;
}
export declare class HealthOptimizer {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Analyze health and generate recommendations
     */
    analyzeHealth(tenantId: string): Promise<HealthRecommendation[]>;
}
//# sourceMappingURL=health-optimizer.d.ts.map