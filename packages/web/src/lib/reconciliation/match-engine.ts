/**
 * Pure deterministic reconciliation matcher used by runtime and synthetic harness tests.
 */

export interface MatchResult {
  sourceTransactionId: string;
  targetTransactionId: string | null;
  matchType: "exact" | "fuzzy" | "unmatched";
  confidence: number;
  amountDiff?: number;
  dateDiff?: number;
  matchReason?: string;
}

export interface MatchingRule {
  amountTolerance?: number;
  dateWindowDays?: number;
  requireExactMerchant?: boolean;
}

export const DEFAULT_RULES: MatchingRule = {
  amountTolerance: 0.01,
  dateWindowDays: 3,
  requireExactMerchant: true,
};

function normalizeMerchant(text: string | null | undefined): string {
  if (!text) return "";
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

function amountsMatch(amount1: number, amount2: number, tolerance = 0.01): boolean {
  return Math.abs(amount1 - amount2) <= tolerance;
}

function datesMatch(date1: Date, date2: Date, windowDays = 3): boolean {
  const diffMs = Math.abs(date1.getTime() - date2.getTime());
  return diffMs / (1000 * 60 * 60 * 24) <= windowDays;
}

function calculateConfidence(
  amountMatch: boolean,
  dateMatch: boolean,
  merchantMatch: boolean,
  amountDiff: number,
  dateDiff: number
): number {
  let confidence = 0;
  if (amountMatch) confidence += amountDiff === 0 ? 0.5 : 0.4;
  if (dateMatch) confidence += dateDiff === 0 ? 0.4 : 0.3;
  if (merchantMatch) confidence += 0.3;
  return Math.min(1, confidence);
}

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
  const { amountTolerance = 0.01, dateWindowDays = 3, requireExactMerchant = true } = rules;
  const usedTargetIds = new Set<string>();
  const sortedSource = [...sourceTransactions].sort((a, b) => a.date.getTime() - b.date.getTime());
  const sortedTarget = [...targetTransactions].sort((a, b) => a.date.getTime() - b.date.getTime());
  const matches: MatchResult[] = [];

  for (const source of sortedSource) {
    let best: {
      target: (typeof targetTransactions)[number];
      confidence: number;
      amountDiff: number;
      dateDiff: number;
      merchantMatch: boolean;
    } | null = null;

    for (const target of sortedTarget) {
      if (usedTargetIds.has(target.id)) continue;
      if (source.currency !== target.currency) continue;

      const amountDiff = Math.abs(source.amount - target.amount);
      const amountMatch = amountsMatch(source.amount, target.amount, amountTolerance);
      const dateDiff =
        Math.abs(source.date.getTime() - target.date.getTime()) / (1000 * 60 * 60 * 24);
      const dateMatch = datesMatch(source.date, target.date, dateWindowDays);
      const merchantMatch =
        normalizeMerchant(source.description) === normalizeMerchant(target.description) &&
        normalizeMerchant(source.description).length > 0;

      if (requireExactMerchant && !merchantMatch) continue;
      const confidence = calculateConfidence(
        amountMatch,
        dateMatch,
        merchantMatch,
        amountDiff,
        dateDiff
      );
      if (confidence < 0.5) continue;
      if (!best || confidence > best.confidence) {
        best = { target, confidence, amountDiff, dateDiff, merchantMatch };
      }
    }

    if (best && best.confidence >= 0.7) {
      usedTargetIds.add(best.target.id);
      matches.push({
        sourceTransactionId: source.id,
        targetTransactionId: best.target.id,
        matchType: best.confidence >= 0.9 ? "exact" : "fuzzy",
        confidence: best.confidence,
        amountDiff: best.amountDiff,
        dateDiff: Math.round(best.dateDiff),
      });
    } else {
      matches.push({
        sourceTransactionId: source.id,
        targetTransactionId: null,
        matchType: "unmatched",
        confidence: 0,
      });
    }
  }

  return matches;
}
