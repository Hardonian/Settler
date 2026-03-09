/**
 * Deterministic Reconciliation Matcher
 *
 * 10% SCOPE: Simple, deterministic matching with no AI required.
 * Rules:
 * - Amount tolerance: ±$0.01
 * - Date window: ±3 days
 * - Merchant/description: exact match (case-insensitive)
 */

import { prisma } from "@/shared/db/prismaClient";

import { matchTransactions, type MatchResult, type MatchingRule } from "./match-engine";

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
  const matchedCount = matches.filter((m) => m.matchType !== "unmatched").length;
  const unmatchedCount = matches.length - matchedCount;

  // Insert matches in batch
  await prisma.reconciliationMatch.createMany({
    data: matches.map((match) => ({
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
