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
  const { amountTolerance = 0.01, requireExactMerchant = true } = rules;
  const usedTargetIds = new Set<string>();
  const sortedSource = [...sourceTransactions].sort((a, b) => a.date.getTime() - b.date.getTime());
  const matches: MatchResult[] = [];

  const targetsByCurrency = new Map<string, typeof targetTransactions>();
  const targetsByCurrencyAndMerchant = new Map<string, Map<string, typeof targetTransactions>>();

  for (const target of targetTransactions) {
    const byCurrency = targetsByCurrency.get(target.currency) ?? [];
    byCurrency.push(target);
    targetsByCurrency.set(target.currency, byCurrency);

    const merchant = normalizeMerchant(target.description);
    const merchantMap = targetsByCurrencyAndMerchant.get(target.currency) ?? new Map();
    const byMerchant = merchantMap.get(merchant) ?? [];
    byMerchant.push(target);
    merchantMap.set(merchant, byMerchant);
    targetsByCurrencyAndMerchant.set(target.currency, merchantMap);
  }

  for (const source of sortedSource) {
    let best: {
      target: (typeof targetTransactions)[number];
      confidence: number;
      amountDiff: number;
      dateDiff: number;
    } | null = null;

    const sourceMerchant = normalizeMerchant(source.description);
    const merchantCandidates =
      targetsByCurrencyAndMerchant.get(source.currency)?.get(sourceMerchant) ?? [];
    const fallbackCandidates = targetsByCurrency.get(source.currency) ?? [];
    const candidates = requireExactMerchant ? merchantCandidates : fallbackCandidates;

    for (const target of candidates) {
      if (usedTargetIds.has(target.id)) continue;

      const amountDiff = Math.abs(source.amount - target.amount);
      const amountMatch = amountsMatch(source.amount, target.amount, amountTolerance);
      const dateDiff =
        Math.abs(source.date.getTime() - target.date.getTime()) / (1000 * 60 * 60 * 24);
      const dateMatch = dateDiff <= (rules.dateWindowDays ?? 3);
      const merchantMatch =
        sourceMerchant === normalizeMerchant(target.description) && sourceMerchant.length > 0;

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
        best = { target, confidence, amountDiff, dateDiff };
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
