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

function amountBucket(amount: number, tolerance: number): number {
  const divisor = tolerance > 0 ? tolerance : 0.01;
  return Math.round(amount / divisor);
}

type TransactionCandidate = {
  id: string;
  amount: number;
  date: Date;
  description: string | null;
  currency: string;
};

function collectAmountBucketCandidates(
  index: Map<number, TransactionCandidate[]>,
  amount: number,
  tolerance: number
): TransactionCandidate[] {
  const center = amountBucket(amount, tolerance);
  const out: TransactionCandidate[] = [];
  for (const bucket of [center - 1, center, center + 1]) {
    const entries = index.get(bucket);
    if (entries) {
      out.push(...entries);
    }
  }
  return out;
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

  const targetsByCurrencyAndAmount = new Map<string, Map<number, typeof targetTransactions>>();
  const targetsByCurrencyMerchantAndAmount = new Map<
    string,
    Map<string, Map<number, typeof targetTransactions>>
  >();

  for (const target of targetTransactions) {
    const currencyIndex = targetsByCurrencyAndAmount.get(target.currency) ?? new Map();
    const bucket = amountBucket(target.amount, amountTolerance);
    const currencyBucket = currencyIndex.get(bucket) ?? [];
    currencyBucket.push(target);
    currencyIndex.set(bucket, currencyBucket);
    targetsByCurrencyAndAmount.set(target.currency, currencyIndex);

    const merchant = normalizeMerchant(target.description);
    const merchantMap = targetsByCurrencyMerchantAndAmount.get(target.currency) ?? new Map();
    const amountIndex = merchantMap.get(merchant) ?? new Map();
    const merchantBucket = amountIndex.get(bucket) ?? [];
    merchantBucket.push(target);
    amountIndex.set(bucket, merchantBucket);
    merchantMap.set(merchant, amountIndex);
    targetsByCurrencyMerchantAndAmount.set(target.currency, merchantMap);
  }

  for (const source of sortedSource) {
    let best: {
      target: (typeof targetTransactions)[number];
      confidence: number;
      amountDiff: number;
      dateDiff: number;
    } | null = null;

    const sourceMerchant = normalizeMerchant(source.description);
    const merchantAmountIndex =
      targetsByCurrencyMerchantAndAmount.get(source.currency)?.get(sourceMerchant) ?? new Map();
    const currencyAmountIndex = targetsByCurrencyAndAmount.get(source.currency) ?? new Map();

    const candidates = requireExactMerchant
      ? collectAmountBucketCandidates(merchantAmountIndex, source.amount, amountTolerance)
      : collectAmountBucketCandidates(currencyAmountIndex, source.amount, amountTolerance);

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
      if (
        !best ||
        confidence > best.confidence ||
        (confidence === best.confidence && target.id.localeCompare(best.target.id) < 0)
      ) {
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
