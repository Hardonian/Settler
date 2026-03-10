import type { ReconResult } from "@prisma/client";

export type RuntimeClassification =
  | "EXACT_MATCH"
  | "FUZZY_MATCH"
  | "GROUPED_MATCH"
  | "UNMATCHED_SOURCE_ONLY"
  | "UNMATCHED_TARGET_ONLY"
  | "DUPLICATE_DETECTED"
  | "TIMING_VARIANCE"
  | "FEE_VARIANCE"
  | "FX_VARIANCE"
  | "STATUS_CONFLICT"
  | "DISPUTE_RELATED"
  | "REVERSAL_RELATED"
  | "MANUAL_REVIEW";

export type ManualReviewRationaleCode =
  | "AMBIGUOUS_REFERENCE"
  | "MULTIPLE_PLAUSIBLE_MATCHES"
  | "AMOUNT_CLOSE_DATE_CLOSE"
  | "MISSING_EXTERNAL_REFERENCE"
  | "PARTIAL_GROUP_MATCH"
  | "STATUS_MISMATCH_REQUIRES_REVIEW"
  | "FX_VARIANCE_REQUIRES_REVIEW"
  | "DUPLICATE_SUSPECTED"
  | "DISPUTE_CHAIN_INCOMPLETE"
  | "INSUFFICIENT_EVIDENCE";

export interface RuntimeMatchContract {
  transaction_id: string;
  source_record_id: string;
  target_record_id: string | null;
  classification: RuntimeClassification;
  legacy_match_class?: string;
  confidence: number;
  amount_difference_minor: number;
  date_difference_days: number;
  group_id?: string;
  group_member_transaction_ids?: string[];
  source_member_record_ids?: string[];
  target_member_record_ids?: string[];
  grouped_total?: number;
  manual_review_rationale_codes: ManualReviewRationaleCode[];
  is_dispute_related: boolean;
  is_reversal_related: boolean;
  dispute_phase?: string;
  reversal_phase?: string;
  linked_dispute_id?: string;
  linked_refund_id?: string;
}

function toObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function normalizeRuntimeMatch(raw: unknown): RuntimeMatchContract | null {
  const input = toObject(raw);
  if (typeof input.transaction_id !== "string" || typeof input.source_record_id !== "string") {
    return null;
  }

  const classification = String(input.classification || "MANUAL_REVIEW") as RuntimeClassification;
  const disputePhase = typeof input.dispute_phase === "string" ? input.dispute_phase : undefined;
  const reversalPhase = typeof input.reversal_phase === "string" ? input.reversal_phase : undefined;

  return {
    transaction_id: input.transaction_id,
    source_record_id: input.source_record_id,
    target_record_id: typeof input.target_record_id === "string" ? input.target_record_id : null,
    classification,
    legacy_match_class:
      typeof input.legacy_match_class === "string" ? input.legacy_match_class : undefined,
    confidence: typeof input.confidence === "number" ? input.confidence : 0,
    amount_difference_minor:
      typeof input.amount_difference_minor === "number" ? input.amount_difference_minor : 0,
    date_difference_days:
      typeof input.date_difference_days === "number" ? input.date_difference_days : 0,
    group_id: typeof input.group_id === "string" ? input.group_id : undefined,
    group_member_transaction_ids: toArray(input.group_member_transaction_ids)
      .filter((v): v is string => typeof v === "string")
      .sort(),
    source_member_record_ids: toArray(input.source_member_record_ids)
      .filter((v): v is string => typeof v === "string")
      .sort(),
    target_member_record_ids: toArray(input.target_member_record_ids)
      .filter((v): v is string => typeof v === "string")
      .sort(),
    grouped_total: typeof input.grouped_total === "number" ? input.grouped_total : undefined,
    manual_review_rationale_codes: toArray(input.manual_review_rationale_codes)
      .filter((v): v is ManualReviewRationaleCode => typeof v === "string")
      .sort(),
    is_dispute_related: Boolean(input.is_dispute_related),
    is_reversal_related: Boolean(input.is_reversal_related),
    dispute_phase: disputePhase,
    reversal_phase: reversalPhase,
    linked_dispute_id:
      typeof input.linked_dispute_id === "string" ? input.linked_dispute_id : undefined,
    linked_refund_id:
      typeof input.linked_refund_id === "string" ? input.linked_refund_id : undefined,
  };
}

export interface SerializedReconResult extends ReconResult {
  runtime_matches: RuntimeMatchContract[];
}

export function serializeReconResult(result: ReconResult): SerializedReconResult {
  const metadata = toObject(result.metadata);
  const summary = toObject(result.summary);
  const rawRuntimeMatches =
    metadata.runtime_matches ?? metadata.runtimeMatches ?? summary.runtime_matches ?? [];

  const runtimeMatches = toArray(rawRuntimeMatches)
    .map((match) => normalizeRuntimeMatch(match))
    .filter((match): match is RuntimeMatchContract => Boolean(match));

  return {
    ...result,
    runtime_matches: runtimeMatches,
  };
}
