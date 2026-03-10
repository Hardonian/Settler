export type MatchClassification = "exact" | "fuzzy" | "manual" | "unmatched";

export type ReviewState = "pending_review" | "reviewed" | "approved" | "dismissed" | "escalated";

export type ManualReviewReasonCode =
  | "UNMATCHED_TRANSACTION"
  | "LOW_CONFIDENCE_MATCH"
  | "AMOUNT_VARIANCE_EXCEEDED"
  | "DATE_WINDOW_EXCEEDED"
  | "STATUS_CONFLICT"
  | "GROUP_REQUIRES_INSPECTION"
  | "POLICY_OVERRIDE_REQUIRED"
  | "INSUFFICIENT_EVIDENCE";

export interface ReconciliationTolerancePolicy {
  amountTolerance: number;
  dateWindowDays: number;
  fuzzyDescriptionThreshold: number;
  requireExactAmount: boolean;
}

export interface DecisionExplanation {
  classification: MatchClassification;
  rationaleCodes: string[];
  matchedRecordIds: {
    sourceTransactionId: string;
    targetTransactionId: string | null;
  };
  groupedEvidence: {
    groupId: string | null;
    groupMemberSourceTransactionIds: string[];
    groupMemberTargetTransactionIds: string[];
  };
  evidenceFieldsUsed: string[];
  amountComparison: {
    sourceAmount: number;
    targetAmount: number | null;
    amountDifference: number | null;
    withinTolerance: boolean | null;
  };
  dateComparison: {
    sourceDate: string;
    targetDate: string | null;
    dateDifferenceDays: number | null;
    withinWindow: boolean | null;
  };
  tolerancePolicy: ReconciliationTolerancePolicy;
  varianceSummary: {
    hasAmountVariance: boolean;
    hasDateVariance: boolean;
  };
  policyPath: string[];
  unresolvedAmbiguity: {
    hasAmbiguity: boolean;
    markers: string[];
  };
  disputeRelevance: {
    isDisputeRelated: boolean;
    isReversalRelated: boolean;
  };
  manualReview: {
    required: boolean;
    reasonCodes: ManualReviewReasonCode[];
  };
}

export interface ReconciliationWorkbenchItem {
  id: string;
  runId: string;
  classification: MatchClassification;
  confidence: number;
  queue: "manual_review" | "unmatched" | "grouped" | "variance" | "status_conflict" | "matched";
  reviewState: ReviewState;
  reviewed: boolean;
  reviewedAt: string | null;
  reviewedBy: string | null;
  source: {
    id: string;
    externalId: string | null;
    amount: number;
    currency: string;
    date: string;
    description: string | null;
  };
  target: {
    id: string;
    externalId: string | null;
    amount: number;
    currency: string;
    date: string;
    description: string | null;
  } | null;
  explanation: DecisionExplanation;
}

interface DbMatchRow {
  id: string;
  run_id: string;
  match_type: MatchClassification;
  confidence: number;
  match_reason: string | null;
  amount_diff: number | null;
  date_diff: number | null;
  reviewed: boolean;
  reviewed_at: Date | null;
  reviewed_by: string | null;
  metadata: Record<string, unknown> | string | null;
  source_id: string;
  source_amount: number;
  source_currency: string;
  source_date: Date;
  source_description: string | null;
  source_external_id: string | null;
  target_id: string | null;
  target_amount: number | null;
  target_currency: string | null;
  target_date: Date | null;
  target_description: string | null;
  target_external_id: string | null;
}

const DEFAULT_POLICY: ReconciliationTolerancePolicy = {
  amountTolerance: 0.01,
  dateWindowDays: 7,
  fuzzyDescriptionThreshold: 0.8,
  requireExactAmount: false,
};

function parseMetadata(input: DbMatchRow["metadata"]): Record<string, unknown> {
  if (!input) return {};
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  return input;
}

function toReasonCodes(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string").sort();
}

function deriveManualReviewReasons(
  row: DbMatchRow,
  metadata: Record<string, unknown>,
  tolerancePolicy: ReconciliationTolerancePolicy
): ManualReviewReasonCode[] {
  const reasons = new Set<ManualReviewReasonCode>();

  if (row.match_type === "unmatched") reasons.add("UNMATCHED_TRANSACTION");
  if (row.match_type === "manual") reasons.add("POLICY_OVERRIDE_REQUIRED");
  if (row.confidence < 0.75) reasons.add("LOW_CONFIDENCE_MATCH");
  if (typeof row.amount_diff === "number" && row.amount_diff > tolerancePolicy.amountTolerance) {
    reasons.add("AMOUNT_VARIANCE_EXCEEDED");
  }
  if (
    typeof row.date_diff === "number" &&
    Math.abs(row.date_diff) > tolerancePolicy.dateWindowDays
  ) {
    reasons.add("DATE_WINDOW_EXCEEDED");
  }

  if (typeof metadata.group_id === "string") reasons.add("GROUP_REQUIRES_INSPECTION");
  if (metadata.status_conflict === true) reasons.add("STATUS_CONFLICT");
  if (!row.target_id) reasons.add("INSUFFICIENT_EVIDENCE");

  return Array.from(reasons).sort();
}

function deriveQueue(
  row: DbMatchRow,
  metadata: Record<string, unknown>,
  manualReviewReasons: ManualReviewReasonCode[]
): ReconciliationWorkbenchItem["queue"] {
  if (metadata.status_conflict === true) return "status_conflict";
  if (row.match_type === "unmatched") return "unmatched";
  if (typeof metadata.group_id === "string") return "grouped";
  if (manualReviewReasons.length > 0) return "manual_review";
  if ((row.amount_diff ?? 0) > 0 || (row.date_diff ?? 0) !== 0) return "variance";
  return "matched";
}

export function buildWorkbenchItem(
  row: DbMatchRow,
  runMetadata: Record<string, unknown>
): ReconciliationWorkbenchItem {
  const metadata = parseMetadata(row.metadata);
  const runConfig = (runMetadata.config ?? runMetadata ?? {}) as Record<string, unknown>;
  const tolerancePolicy: ReconciliationTolerancePolicy = {
    amountTolerance:
      typeof runConfig.amountTolerance === "number"
        ? runConfig.amountTolerance
        : DEFAULT_POLICY.amountTolerance,
    dateWindowDays:
      typeof runConfig.dateWindowDays === "number"
        ? runConfig.dateWindowDays
        : DEFAULT_POLICY.dateWindowDays,
    fuzzyDescriptionThreshold:
      typeof runConfig.fuzzyDescriptionThreshold === "number"
        ? runConfig.fuzzyDescriptionThreshold
        : DEFAULT_POLICY.fuzzyDescriptionThreshold,
    requireExactAmount:
      typeof runConfig.requireExactAmount === "boolean"
        ? runConfig.requireExactAmount
        : DEFAULT_POLICY.requireExactAmount,
  };

  const manualReviewReasons = deriveManualReviewReasons(row, metadata, tolerancePolicy);
  const evidenceFieldsUsed = ["amount", "date", "currency", "description", "external_id"];
  const rationaleCodes =
    toReasonCodes(metadata.rationale_codes).length > 0
      ? toReasonCodes(metadata.rationale_codes)
      : manualReviewReasons;

  const reviewStateRaw = metadata.review_state;
  const reviewState: ReviewState =
    reviewStateRaw === "reviewed" ||
    reviewStateRaw === "approved" ||
    reviewStateRaw === "dismissed" ||
    reviewStateRaw === "escalated"
      ? reviewStateRaw
      : "pending_review";

  const queue = deriveQueue(row, metadata, manualReviewReasons);

  return {
    id: row.id,
    runId: row.run_id,
    classification: row.match_type,
    confidence: row.confidence,
    queue,
    reviewState,
    reviewed: row.reviewed,
    reviewedAt: row.reviewed_at ? row.reviewed_at.toISOString() : null,
    reviewedBy: row.reviewed_by,
    source: {
      id: row.source_id,
      externalId: row.source_external_id,
      amount: row.source_amount,
      currency: row.source_currency,
      date: row.source_date.toISOString(),
      description: row.source_description,
    },
    target: row.target_id
      ? {
          id: row.target_id,
          externalId: row.target_external_id,
          amount: row.target_amount ?? 0,
          currency: row.target_currency ?? row.source_currency,
          date: row.target_date ? row.target_date.toISOString() : row.source_date.toISOString(),
          description: row.target_description,
        }
      : null,
    explanation: {
      classification: row.match_type,
      rationaleCodes,
      matchedRecordIds: {
        sourceTransactionId: row.source_id,
        targetTransactionId: row.target_id,
      },
      groupedEvidence: {
        groupId: typeof metadata.group_id === "string" ? metadata.group_id : null,
        groupMemberSourceTransactionIds: Array.isArray(metadata.group_member_source_transaction_ids)
          ? (metadata.group_member_source_transaction_ids as string[]).slice().sort()
          : [row.source_id],
        groupMemberTargetTransactionIds: Array.isArray(metadata.group_member_target_transaction_ids)
          ? (metadata.group_member_target_transaction_ids as string[]).slice().sort()
          : row.target_id
            ? [row.target_id]
            : [],
      },
      evidenceFieldsUsed,
      amountComparison: {
        sourceAmount: row.source_amount,
        targetAmount: row.target_amount,
        amountDifference: row.amount_diff,
        withinTolerance:
          row.amount_diff === null ? null : row.amount_diff <= tolerancePolicy.amountTolerance,
      },
      dateComparison: {
        sourceDate: row.source_date.toISOString(),
        targetDate: row.target_date ? row.target_date.toISOString() : null,
        dateDifferenceDays: row.date_diff,
        withinWindow:
          row.date_diff === null ? null : Math.abs(row.date_diff) <= tolerancePolicy.dateWindowDays,
      },
      tolerancePolicy,
      varianceSummary: {
        hasAmountVariance: (row.amount_diff ?? 0) > 0,
        hasDateVariance: (row.date_diff ?? 0) !== 0,
      },
      policyPath: [
        "currency-filter",
        "date-window-filter",
        "amount-tolerance-filter",
        "description-similarity-scoring",
      ],
      unresolvedAmbiguity: {
        hasAmbiguity: manualReviewReasons.length > 0,
        markers: manualReviewReasons,
      },
      disputeRelevance: {
        isDisputeRelated: metadata.is_dispute_related === true,
        isReversalRelated: metadata.is_reversal_related === true,
      },
      manualReview: {
        required: queue === "manual_review" || queue === "unmatched" || queue === "status_conflict",
        reasonCodes: manualReviewReasons,
      },
    },
  };
}

export interface RunComparisonSummary {
  fromRunId: string;
  toRunId: string;
  counts: {
    classificationChanges: number;
    groupMembershipChanges: number;
    varianceChanges: number;
    newlyManualReviewed: number;
    newlyMatched: number;
    newlyUnmatched: number;
  };
}

export interface RunComparisonChange {
  sourceTransactionId: string;
  classification: { from: MatchClassification | null; to: MatchClassification | null };
  variance: {
    amountDiffFrom: number | null;
    amountDiffTo: number | null;
    dateDiffFrom: number | null;
    dateDiffTo: number | null;
  };
  groupMembership: { from: string | null; to: string | null };
  queue: {
    from: ReconciliationWorkbenchItem["queue"] | null;
    to: ReconciliationWorkbenchItem["queue"] | null;
  };
}

export function compareWorkbenchRuns(
  fromItems: ReconciliationWorkbenchItem[],
  toItems: ReconciliationWorkbenchItem[],
  fromRunId: string,
  toRunId: string
): { summary: RunComparisonSummary; changes: RunComparisonChange[] } {
  const fromMap = new Map(
    fromItems.map((item) => [item.source.externalId ?? item.source.id, item])
  );
  const toMap = new Map(toItems.map((item) => [item.source.externalId ?? item.source.id, item]));

  const keys = new Set([...fromMap.keys(), ...toMap.keys()]);
  const changes: RunComparisonChange[] = [];

  let classificationChanges = 0;
  let groupMembershipChanges = 0;
  let varianceChanges = 0;
  let newlyManualReviewed = 0;
  let newlyMatched = 0;
  let newlyUnmatched = 0;

  for (const key of keys) {
    const from = fromMap.get(key) ?? null;
    const to = toMap.get(key) ?? null;
    const change: RunComparisonChange = {
      sourceTransactionId: from?.source.id ?? to?.source.id ?? key,
      classification: { from: from?.classification ?? null, to: to?.classification ?? null },
      variance: {
        amountDiffFrom: from?.explanation.amountComparison.amountDifference ?? null,
        amountDiffTo: to?.explanation.amountComparison.amountDifference ?? null,
        dateDiffFrom: from?.explanation.dateComparison.dateDifferenceDays ?? null,
        dateDiffTo: to?.explanation.dateComparison.dateDifferenceDays ?? null,
      },
      groupMembership: {
        from: from?.explanation.groupedEvidence.groupId ?? null,
        to: to?.explanation.groupedEvidence.groupId ?? null,
      },
      queue: { from: from?.queue ?? null, to: to?.queue ?? null },
    };

    const changed =
      change.classification.from !== change.classification.to ||
      change.groupMembership.from !== change.groupMembership.to ||
      change.variance.amountDiffFrom !== change.variance.amountDiffTo ||
      change.variance.dateDiffFrom !== change.variance.dateDiffTo ||
      change.queue.from !== change.queue.to;

    if (change.classification.from !== change.classification.to) classificationChanges++;
    if (change.groupMembership.from !== change.groupMembership.to) groupMembershipChanges++;
    if (
      change.variance.amountDiffFrom !== change.variance.amountDiffTo ||
      change.variance.dateDiffFrom !== change.variance.dateDiffTo
    ) {
      varianceChanges++;
    }
    if (from?.queue !== "manual_review" && to?.queue === "manual_review") newlyManualReviewed++;
    if (
      from?.classification !== "exact" &&
      from?.classification !== "fuzzy" &&
      (to?.classification === "exact" || to?.classification === "fuzzy")
    ) {
      newlyMatched++;
    }
    if (from?.classification !== "unmatched" && to?.classification === "unmatched")
      newlyUnmatched++;

    if (changed) changes.push(change);
  }

  return {
    summary: {
      fromRunId,
      toRunId,
      counts: {
        classificationChanges,
        groupMembershipChanges,
        varianceChanges,
        newlyManualReviewed,
        newlyMatched,
        newlyUnmatched,
      },
    },
    changes,
  };
}
