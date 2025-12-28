/**
 * Rule Optimization Service
 *
 * Analyzes reconciliation results to suggest rule improvements.
 * Enterprise-ready with:
 * - Type-safe Prisma queries
 * - Statistical analysis
 * - Confidence scoring
 * - Actionable suggestions
 */
import { PrismaClient } from '@prisma/client';
interface OptimizationSuggestion {
    type: 'amount_tolerance' | 'date_window' | 'fuzzy_threshold' | 'currency_conversion';
    currentValue: number | string;
    suggestedValue: number | string;
    confidence: number;
    reason: string;
    expectedImprovement: number;
}
/**
 * Analyze job results and suggest rule optimizations
 */
export declare function suggestRuleOptimizations(prisma: PrismaClient, jobId: string, tenantId: string): Promise<OptimizationSuggestion[]>;
export {};
//# sourceMappingURL=rule-optimizer.d.ts.map