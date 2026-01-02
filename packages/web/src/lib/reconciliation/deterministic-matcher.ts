/**
 * Deterministic Reconciliation Matcher
 * 
 * 10% SCOPE: Simple, deterministic matching with no AI required.
 * Rules:
 * - Amount tolerance: ±$0.01
 * - Date window: ±3 days
 * - Merchant/description: exact match (case-insensitive)
 */

import { prisma } from '@/shared/db/prismaClient';

export interface MatchResult {
  sourceTransactionId: string;
  targetTransactionId: string | null;
  matchType: 'exact' | 'fuzzy' | 'unmatched';
  confidence: number; // 0.0 to 1.0
  amountDiff?: number;
  dateDiff?: number; // days
  matchReason?: string;
}

export interface MatchingRule {
  amountTolerance?: number; // Default: 0.01
  dateWindowDays?: number; // Default: 3
  requireExactMerchant?: boolean; // Default: true
}

const DEFAULT_RULES: MatchingRule = {
  amountTolerance: 0.01,
  dateWindowDays: 3,
  requireExactMerchant: true,
};

/**
 * Normalize merchant/description for comparison
 */
function normalizeMerchant(text: string | null | undefined): string {
  if (!text) return '';
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Check if two amounts match within tolerance
 */
function amountsMatch(
  amount1: number,
  amount2: number,
  tolerance: number = 0.01
): boolean {
  return Math.abs(amount1 - amount2) <= tolerance;
}

/**
 * Check if two dates are within window
 */
function datesMatch(
  date1: Date,
  date2: Date,
  windowDays: number = 3
): boolean {
  const diffMs = Math.abs(date1.getTime() - date2.getTime());
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= windowDays;
}

/**
 * Calculate match confidence based on criteria
 */
function calculateConfidence(
  amountMatch: boolean,
  dateMatch: boolean,
  merchantMatch: boolean,
  amountDiff: number,
  dateDiff: number
): number {
  let confidence = 0.0;

  // Amount match is critical (40% weight)
  if (amountMatch) {
    confidence += 0.4;
    // Bonus for exact amount match
    if (amountDiff === 0) {
      confidence += 0.1;
    }
  }

  // Date match is important (30% weight)
  if (dateMatch) {
    confidence += 0.3;
    // Bonus for exact date match
    if (dateDiff === 0) {
      confidence += 0.1;
    }
  }

  // Merchant match is important (30% weight)
  if (merchantMatch) {
    confidence += 0.3;
  }

  return Math.min(1.0, confidence);
}

/**
 * Match transactions deterministically
 * 
 * @param sourceTransactions - Transactions to match (e.g., from bank feed)
 * @param targetTransactions - Transactions to match against (e.g., from receipts)
 * @param rules - Matching rules
 * @returns Array of match results
 */
export function matchTransactions(
  sourceTransactions: Array<{
    id: string;
    amount: number;
    date: Date;
    description: string | null;
    currency: string;
  }>,
  targetTransactions: Array<{
    id: string;
    amount: number;
    date: Date;
    description: string | null;
    currency: string;
  }>,
  rules: MatchingRule = DEFAULT_RULES
): MatchResult[] {
  const {
    amountTolerance = 0.01,
    dateWindowDays = 3,
    requireExactMerchant = true,
  } = rules;

  const matches: MatchResult[] = [];
  const usedTargetIds = new Set<string>();

  // Sort transactions by date for better matching
  const sortedSource = [...sourceTransactions].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
  const sortedTarget = [...targetTransactions].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  for (const source of sortedSource) {
    let bestMatch: {
      target: typeof targetTransactions[0];
      confidence: number;
      amountDiff: number;
      dateDiff: number;
      merchantMatch: boolean;
    } | null = null;

    // Find best match in target transactions
    for (const target of sortedTarget) {
      // Skip if already matched
      if (usedTargetIds.has(target.id)) {
        continue;
      }

      // Must match currency
      if (source.currency !== target.currency) {
        continue;
      }

      // Check amount match
      const amountDiff = Math.abs(source.amount - target.amount);
      const amountMatch = amountsMatch(source.amount, target.amount, amountTolerance);

      // Check date match
      const dateDiffMs = Math.abs(source.date.getTime() - target.date.getTime());
      const dateDiff = dateDiffMs / (1000 * 60 * 60 * 24);
      const dateMatch = datesMatch(source.date, target.date, dateWindowDays);

      // Check merchant match
      const sourceMerchant = normalizeMerchant(source.description);
      const targetMerchant = normalizeMerchant(target.description);
      const merchantMatch = sourceMerchant === targetMerchant && sourceMerchant.length > 0;

      // If exact merchant required, skip if no match
      if (requireExactMerchant && !merchantMatch) {
        continue;
      }

      // Calculate confidence
      const confidence = calculateConfidence(
        amountMatch,
        dateMatch,
        merchantMatch,
        amountDiff,
        dateDiff
      );

      // Only consider matches with minimum confidence
      if (confidence < 0.5) {
        continue;
      }

      // Track best match
      if (!bestMatch || confidence > bestMatch.confidence) {
        bestMatch = {
          target,
          confidence,
          amountDiff,
          dateDiff,
          merchantMatch,
        };
      }
    }

    // Create match result
    if (bestMatch && bestMatch.confidence >= 0.7) {
      // High confidence = exact match
      matches.push({
        sourceTransactionId: source.id,
        targetTransactionId: bestMatch.target.id,
        matchType: bestMatch.confidence >= 0.9 ? 'exact' : 'fuzzy',
        confidence: bestMatch.confidence,
        amountDiff: bestMatch.amountDiff,
        dateDiff: Math.round(bestMatch.dateDiff),
        matchReason: `Matched by amount (${bestMatch.amountDiff.toFixed(2)} diff), date (${Math.round(bestMatch.dateDiff)} days), ${bestMatch.merchantMatch ? 'merchant' : 'no merchant match'}`,
      });
      usedTargetIds.add(bestMatch.target.id);
    } else {
      // No match found
      matches.push({
        sourceTransactionId: source.id,
        targetTransactionId: null,
        matchType: 'unmatched',
        confidence: 0.0,
        matchReason: 'No matching transaction found within tolerance',
      });
    }
  }

  return matches;
}

/**
 * Run reconciliation matching and save results to database
 */
export async function runDeterministicMatching(
  tenantId: string,
  runId: string,
  sourceTransactions: Array<{
    id: string;
    amount: number;
    date: Date;
    description: string | null;
    currency: string;
  }>,
  targetTransactions: Array<{
    id: string;
    amount: number;
    date: Date;
    description: string | null;
    currency: string;
  }>,
  rules?: MatchingRule
): Promise<{
  matchedCount: number;
  unmatchedCount: number;
  matches: MatchResult[];
}> {
  // Run matching algorithm
  const matches = matchTransactions(sourceTransactions, targetTransactions, rules);

  // Save matches to database
  const matchedCount = matches.filter(m => m.matchType !== 'unmatched').length;
  const unmatchedCount = matches.length - matchedCount;

  // Insert matches in batch
  await prisma.reconciliationMatch.createMany({
    data: matches.map(match => ({
      runId,
      sourceTransactionId: match.sourceTransactionId,
      targetTransactionId: match.targetTransactionId || undefined,
      tenantId,
      matchType: match.matchType,
      confidence: match.confidence,
      matchReason: match.matchReason || undefined,
      amountDiff: match.amountDiff || undefined,
      dateDiff: match.dateDiff || undefined,
      reviewed: false,
    })),
  });

  return {
    matchedCount,
    unmatchedCount,
    matches,
  };
}
