/**
 * Usage Optimization AI
 *
 * Analyzes usage patterns and optimizes costs
 * Part of Phase VII: Platform Intelligence
 */
import { PrismaClient } from '@prisma/client';
export interface UsageOptimization {
    recommendation: string;
    estimatedSavings: number;
    confidence: number;
    action: 'switch_model' | 'adjust_quota' | 'optimize_schedule' | 'cache_results';
}
export declare class UsageOptimizer {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Analyze usage and generate optimizations
     */
    analyzeUsage(tenantId: string, startDate: Date, endDate: Date): Promise<UsageOptimization[]>;
    /**
     * Identify peak usage hours
     */
    private identifyPeakHours;
}
//# sourceMappingURL=usage-optimizer.d.ts.map