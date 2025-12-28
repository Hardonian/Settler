"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.suggestRuleOptimizations = suggestRuleOptimizations;
/**
 * Analyze job results and suggest rule optimizations
 */
async function suggestRuleOptimizations(prisma, jobId, tenantId) {
    const suggestions = [];
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
        const runs = results.map((r) => r.id);
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
            .filter((d) => d !== null && d !== undefined)
            .map((d) => Math.abs(Number(d)));
        if (amountDiffs.length > 0) {
            const avgAmountDiff = amountDiffs.reduce((a, b) => a + b, 0) / amountDiffs.length;
            const p95AmountDiff = amountDiffs.sort((a, b) => a - b)[Math.floor(amountDiffs.length * 0.95)] || 0;
            // Suggest tolerance increase if many small differences
            if (avgAmountDiff < 0.1 && p95AmountDiff < 0.5) {
                suggestions.push({
                    type: 'amount_tolerance',
                    currentValue: 0.01,
                    suggestedValue: Math.max(0.01, p95AmountDiff * 1.2),
                    confidence: 0.8,
                    reason: `${Math.round((amountDiffs.filter((d) => d <= p95AmountDiff).length / amountDiffs.length) * 100)}% of unmatched transactions have amount differences within ${p95AmountDiff.toFixed(2)}`,
                    expectedImprovement: Math.round((amountDiffs.filter((d) => d <= p95AmountDiff).length / unmatchedMatches.length) * 100),
                });
            }
        }
        // Analyze date differences
        const dateDiffs = unmatchedMatches
            .map((m) => m.dateDiff)
            .filter((d) => d !== null && d !== undefined)
            .map((d) => Math.abs(d));
        if (dateDiffs.length > 0) {
            const avgDateDiff = dateDiffs.reduce((a, b) => a + b, 0) / dateDiffs.length;
            const p95DateDiff = dateDiffs.sort((a, b) => a - b)[Math.floor(dateDiffs.length * 0.95)] || 0;
            // Suggest window increase if many small differences
            if (avgDateDiff < 3 && p95DateDiff < 7) {
                suggestions.push({
                    type: 'date_window',
                    currentValue: 7,
                    suggestedValue: Math.max(7, Math.ceil(p95DateDiff * 1.2)),
                    confidence: 0.75,
                    reason: `${Math.round((dateDiffs.filter((d) => d <= p95DateDiff).length / dateDiffs.length) * 100)}% of unmatched transactions have date differences within ${p95DateDiff} days`,
                    expectedImprovement: Math.round((dateDiffs.filter((d) => d <= p95DateDiff).length / unmatchedMatches.length) * 100),
                });
            }
        }
        // Analyze currency mismatches
        const currencyMismatches = unmatchedMatches.filter((_m) => {
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
    }
    catch (error) {
        console.error(`[RuleOptimizer] Failed to analyze job ${jobId}:`, error);
        return suggestions;
    }
}
//# sourceMappingURL=rule-optimizer.js.map