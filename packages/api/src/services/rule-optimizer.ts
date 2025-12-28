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

import { PrismaClient, Prisma } from '@prisma/client';

interface OptimizationSuggestion {
  type: 'amount_tolerance' | 'date_window' | 'fuzzy_threshold' | 'currency_conversion';
  currentValue: number | string;
  suggestedValue: number | string;
  confidence: number;
  reason: string;
  expectedImprovement: number; // Percentage improvement in match rate
}

/**
 * Analyze job results and suggest rule optimizations
 */
export async function suggestRuleOptimizations(
  prisma: PrismaClient,
  jobId: string,
  tenantId: string
): Promise<OptimizationSuggestion[]> {
  const suggestions: OptimizationSuggestion[] = [];

  try {
    // Fetch recent job results
    const results = await prisma.reconResult.findMany({
      where: {
        reconJobId: jobId,
        tenantId: tenantId,
        status: 'completed',
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: 10, // Analyze last 10 runs
    });

    if (results.length === 0) {
      return suggestions;
    }

    // Fetch unmatched transactions to analyze
    const runs = results.map((r: { id: string }) => r.id);
    const unmatchedMatches = await prisma.reconciliationMatch.findMany({
      where: {
        runId: { in: runs },
        tenantId: tenantId,
        matchType: 'unmatched',
      },
      include: {
        sourceTransaction: true,
      },
      take: 1000, // Sample size
    });

    if (unmatchedMatches.length === 0) {
      return suggestions;
    }

    // Analyze amount differences
    const amountDiffs = unmatchedMatches
      .map((m) => m.amountDiff)
      .filter((d: Prisma.Decimal | null): d is Prisma.Decimal => d !== null && d !== undefined)
      .map((d: Prisma.Decimal) => Math.abs(Number(d)));

    if (amountDiffs.length > 0) {
      const avgAmountDiff = amountDiffs.reduce((a: number, b: number) => a + b, 0) / amountDiffs.length;
      const p95AmountDiff = amountDiffs.sort((a: number, b: number) => a - b)[Math.floor(amountDiffs.length * 0.95)] || 0;

      // Suggest tolerance increase if many small differences
      if (avgAmountDiff < 0.1 && p95AmountDiff < 0.5) {
        suggestions.push({
          type: 'amount_tolerance',
          currentValue: 0.01,
          suggestedValue: Math.max(0.01, p95AmountDiff * 1.2),
          confidence: 0.8,
          reason: `${Math.round((amountDiffs.filter((d: number) => d <= p95AmountDiff).length / amountDiffs.length) * 100)}% of unmatched transactions have amount differences within ${p95AmountDiff.toFixed(2)}`,
          expectedImprovement: Math.round((amountDiffs.filter((d: number) => d <= p95AmountDiff).length / unmatchedMatches.length) * 100),
        });
      }
    }

    // Analyze date differences
    const dateDiffs = unmatchedMatches
      .map((m: { dateDiff: number | null | undefined }) => m.dateDiff)
      .filter((d: number | null | undefined): d is number => d !== null && d !== undefined)
      .map((d: number) => Math.abs(d));

    if (dateDiffs.length > 0) {
      const avgDateDiff = dateDiffs.reduce((a: number, b: number) => a + b, 0) / dateDiffs.length;
      const p95DateDiff = dateDiffs.sort((a: number, b: number) => a - b)[Math.floor(dateDiffs.length * 0.95)] || 0;

      // Suggest window increase if many small differences
      if (avgDateDiff < 3 && p95DateDiff < 7) {
        suggestions.push({
          type: 'date_window',
          currentValue: 7,
          suggestedValue: Math.max(7, Math.ceil(p95DateDiff * 1.2)),
          confidence: 0.75,
          reason: `${Math.round((dateDiffs.filter((d: number) => d <= p95DateDiff).length / dateDiffs.length) * 100)}% of unmatched transactions have date differences within ${p95DateDiff} days`,
          expectedImprovement: Math.round((dateDiffs.filter((d: number) => d <= p95DateDiff).length / unmatchedMatches.length) * 100),
        });
      }
    }

    // Analyze currency mismatches
    const currencyMismatches = unmatchedMatches.filter((_m: unknown) => {
      // Check if source and target have different currencies
      // This would require fetching target transactions
      return false; // Placeholder
    });

    if (currencyMismatches.length > unmatchedMatches.length * 0.1) {
      suggestions.push({
        type: 'currency_conversion',
        currentValue: 'disabled',
        suggestedValue: 'enabled',
        confidence: 0.9,
        reason: `${currencyMismatches.length} unmatched transactions appear to be currency mismatches`,
        expectedImprovement: Math.round((currencyMismatches.length / unmatchedMatches.length) * 100),
      });
    }

    return suggestions.sort((a, b) => b.expectedImprovement - a.expectedImprovement);
  } catch (error) {
    console.error(`[RuleOptimizer] Failed to analyze job ${jobId}:`, error);
    return suggestions;
  }
}
