/**
 * Deterministic Matching Engine
 *
 * Matches transactions using deterministic rules.
 * Same inputs always produce same outputs.
 */

import {
  type Transaction,
  type MatchResult,
  type MatchConfidence,
  type MatchRuleType,
} from "../data/types";
import {
  deterministicId,
  deterministicAuditTrailId,
  hashTransaction,
  deterministicTimestamp,
} from "../data/deterministic";

/**
 * Matching rule configuration
 */
export interface MatchingRule {
  id: string;
  type: MatchRuleType;
  name: string;
  description: string;
  tolerance?: number; // For amount tolerance rules
  dateWindowDays?: number; // For date window rules
}

/**
 * Default matching rules
 */
export const DEFAULT_MATCHING_RULES: MatchingRule[] = [
  {
    id: "rule_amount_exact",
    type: "amount_exact",
    name: "Exact Amount Match",
    description: "Matches transactions with identical amounts",
  },
  {
    id: "rule_amount_tolerance",
    type: "amount_tolerance",
    name: "Amount Tolerance Match",
    description: "Matches transactions within $0.01 tolerance (fees/tax rounding)",
    tolerance: 0.01,
  },
  {
    id: "rule_amount_date_window",
    type: "amount_date_window",
    name: "Amount + Date Window Match",
    description: "Matches transactions with similar amounts within 3 days",
    tolerance: 0.01,
    dateWindowDays: 3,
  },
  {
    id: "rule_reference_id",
    type: "reference_id",
    name: "Reference ID Match",
    description: "Matches transactions with matching reference IDs in metadata",
  },
];

/**
 * Calculate match confidence based on evidence
 */
function calculateConfidence(
  ruleType: MatchRuleType,
  evidenceCount: number,
  amountDiff?: number
): MatchConfidence {
  if (ruleType === "amount_exact" && evidenceCount >= 1) {
    return "exact";
  }
  if (
    ruleType === "amount_tolerance" &&
    evidenceCount >= 1 &&
    amountDiff !== undefined &&
    amountDiff <= 0.01
  ) {
    return "high";
  }
  if (ruleType === "amount_date_window" && evidenceCount >= 2) {
    return "high";
  }
  if (ruleType === "reference_id" && evidenceCount >= 1) {
    return "exact";
  }
  if (evidenceCount >= 2) {
    return "medium";
  }
  if (evidenceCount >= 1) {
    return "low";
  }
  return "none";
}

/**
 * Check if two amounts match within tolerance
 */
function amountsMatch(amount1: number, amount2: number, tolerance = 0): boolean {
  return Math.abs(amount1 - amount2) <= tolerance;
}

/**
 * Check if two dates are within window
 */
function datesWithinWindow(date1: string, date2: string, windowDays: number): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffDays = Math.abs((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= windowDays;
}

/**
 * Extract reference ID from metadata
 */
function extractReferenceId(transaction: Transaction): string | null {
  if ("metadata" in transaction && transaction.metadata) {
    const metadata = transaction.metadata as Record<string, unknown>;
    // Check common reference fields
    if (typeof metadata.reference === "string") {
      return metadata.reference;
    }
    if (typeof metadata.stripe_charge_id === "string") {
      return metadata.stripe_charge_id;
    }
    if (typeof metadata.shopify_order_id === "string") {
      return metadata.shopify_order_id;
    }
  }
  return null;
}

/**
 * Match transactions using a specific rule
 */
function matchWithRule(
  source: Transaction,
  target: Transaction,
  rule: MatchingRule
): MatchResult | null {
  const evidence: Array<{
    field: string;
    source_value: unknown;
    target_value: unknown;
    match_type: string;
  }> = [];

  let matched = false;

  switch (rule.type) {
    case "amount_exact": {
      if (amountsMatch(source.amount, target.amount, 0)) {
        evidence.push({
          field: "amount",
          source_value: source.amount,
          target_value: target.amount,
          match_type: "exact",
        });
        matched = true;
      }
      break;
    }

    case "amount_tolerance": {
      const tolerance = rule.tolerance ?? 0.01;
      const diff = Math.abs(source.amount - target.amount);
      if (amountsMatch(source.amount, target.amount, tolerance)) {
        evidence.push({
          field: "amount",
          source_value: source.amount,
          target_value: target.amount,
          match_type: diff === 0 ? "exact" : "tolerance",
        });
        matched = true;
      }
      break;
    }

    case "amount_date_window": {
      const tolerance = rule.tolerance ?? 0.01;
      const windowDays = rule.dateWindowDays ?? 3;
      if (
        amountsMatch(source.amount, target.amount, tolerance) &&
        datesWithinWindow(source.timestamp, target.timestamp, windowDays)
      ) {
        evidence.push({
          field: "amount",
          source_value: source.amount,
          target_value: target.amount,
          match_type: "tolerance",
        });
        evidence.push({
          field: "timestamp",
          source_value: source.timestamp,
          target_value: target.timestamp,
          match_type: "date_window",
        });
        matched = true;
      }
      break;
    }

    case "reference_id": {
      const sourceRef = extractReferenceId(source);
      const targetRef = extractReferenceId(target);
      if (sourceRef && targetRef && sourceRef === targetRef) {
        evidence.push({
          field: "reference_id",
          source_value: sourceRef,
          target_value: targetRef,
          match_type: "exact",
        });
        matched = true;
      }
      break;
    }

    default:
      return null;
  }

  if (!matched) {
    return null;
  }

  const confidence = calculateConfidence(
    rule.type,
    evidence.length,
    Math.abs(source.amount - target.amount)
  );

  const matchId = deterministicId(`${source.id}_${target.id}_${rule.id}`, "match");
  const auditTrailId = deterministicAuditTrailId(matchId, "match_created");

  // Create normalized record for hash
  const normalizedRecord = {
    source_id: source.id,
    target_id: target.id,
    rule_id: rule.id,
    evidence,
  };
  const deterministicHash = hashTransaction(normalizedRecord);

  return {
    id: matchId,
    source_transaction_id: source.id,
    target_transaction_id: target.id,
    confidence,
    rule_used: rule.type,
    rule_id: rule.id,
    matched_at: deterministicTimestamp(0),
    evidence,
    audit_trail_id: auditTrailId,
    deterministic_hash: deterministicHash,
  };
}

/**
 * Match source transactions to target transactions
 */
export function matchTransactions(
  sources: Transaction[],
  targets: Transaction[],
  rules: MatchingRule[] = DEFAULT_MATCHING_RULES
): MatchResult[] {
  const matches: MatchResult[] = [];
  const matchedTargetIds = new Set<string>();

  // Try each rule in order
  for (const rule of rules) {
    for (const source of sources) {
      // Skip if source already matched
      if (matches.some((m) => m.source_transaction_id === source.id)) {
        continue;
      }

      for (const target of targets) {
        // Skip if target already matched
        if (matchedTargetIds.has(target.id)) {
          continue;
        }

        const match = matchWithRule(source, target, rule);
        if (match) {
          matches.push(match);
          matchedTargetIds.add(target.id);
          break; // One match per source
        }
      }
    }
  }

  return matches;
}

/**
 * Match receipts to transactions
 */
export function matchReceiptToTransaction(
  receipt: { amount: number; date: string; vendor_name: string },
  transactions: Transaction[]
): MatchResult | null {
  // Use amount + date window rule
  const rule: MatchingRule = {
    id: "rule_receipt_match",
    type: "amount_date_window",
    name: "Receipt Match",
    description: "Matches receipts to transactions by amount and date",
    tolerance: 0.01,
    dateWindowDays: 7, // Receipts can be dated up to 7 days before transaction
  };

  for (const transaction of transactions) {
    // Create a transaction-like object from receipt for matching
    // Use stripe as base type since receipt is not in Transaction union
    const receiptTransaction: Transaction = {
      id: receipt.vendor_name,
      source: "stripe" as const,
      stripe_charge_id: receipt.vendor_name,
      amount: receipt.amount,
      currency: "USD",
      timestamp: receipt.date,
      status: "completed" as const,
    };

    const match = matchWithRule(receiptTransaction, transaction, rule);

    if (match) {
      return match;
    }
  }

  return null;
}
