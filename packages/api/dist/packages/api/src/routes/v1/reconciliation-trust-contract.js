"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildWorkbenchItem = buildWorkbenchItem;
exports.compareWorkbenchRuns = compareWorkbenchRuns;
const DEFAULT_POLICY = {
    amountTolerance: 0.01,
    dateWindowDays: 7,
    fuzzyDescriptionThreshold: 0.8,
    requireExactAmount: false,
};
function parseMetadata(input) {
    if (!input)
        return {};
    if (typeof input === "string") {
        try {
            const parsed = JSON.parse(input);
            return parsed && typeof parsed === "object" ? parsed : {};
        }
        catch {
            return {};
        }
    }
    return input;
}
function toReasonCodes(value) {
    if (!Array.isArray(value))
        return [];
    return value.filter((item) => typeof item === "string").sort();
}
function deriveManualReviewReasons(row, metadata, tolerancePolicy) {
    const reasons = new Set();
    if (row.match_type === "unmatched")
        reasons.add("UNMATCHED_TRANSACTION");
    if (row.match_type === "manual")
        reasons.add("POLICY_OVERRIDE_REQUIRED");
    if (row.confidence < 0.75)
        reasons.add("LOW_CONFIDENCE_MATCH");
    if (typeof row.amount_diff === "number" && row.amount_diff > tolerancePolicy.amountTolerance) {
        reasons.add("AMOUNT_VARIANCE_EXCEEDED");
    }
    if (typeof row.date_diff === "number" &&
        Math.abs(row.date_diff) > tolerancePolicy.dateWindowDays) {
        reasons.add("DATE_WINDOW_EXCEEDED");
    }
    if (typeof metadata.group_id === "string")
        reasons.add("GROUP_REQUIRES_INSPECTION");
    if (metadata.status_conflict === true)
        reasons.add("STATUS_CONFLICT");
    if (!row.target_id)
        reasons.add("INSUFFICIENT_EVIDENCE");
    return Array.from(reasons).sort();
}
function deriveQueue(row, metadata, manualReviewReasons) {
    if (metadata.status_conflict === true)
        return "status_conflict";
    if (row.match_type === "unmatched")
        return "unmatched";
    if (typeof metadata.group_id === "string")
        return "grouped";
    if (manualReviewReasons.length > 0)
        return "manual_review";
    if ((row.amount_diff ?? 0) > 0 || (row.date_diff ?? 0) !== 0)
        return "variance";
    return "matched";
}
function buildWorkbenchItem(row, runMetadata) {
    const metadata = parseMetadata(row.metadata);
    const runConfig = (runMetadata.config ?? runMetadata ?? {});
    const tolerancePolicy = {
        amountTolerance: typeof runConfig.amountTolerance === "number"
            ? runConfig.amountTolerance
            : DEFAULT_POLICY.amountTolerance,
        dateWindowDays: typeof runConfig.dateWindowDays === "number"
            ? runConfig.dateWindowDays
            : DEFAULT_POLICY.dateWindowDays,
        fuzzyDescriptionThreshold: typeof runConfig.fuzzyDescriptionThreshold === "number"
            ? runConfig.fuzzyDescriptionThreshold
            : DEFAULT_POLICY.fuzzyDescriptionThreshold,
        requireExactAmount: typeof runConfig.requireExactAmount === "boolean"
            ? runConfig.requireExactAmount
            : DEFAULT_POLICY.requireExactAmount,
    };
    const manualReviewReasons = deriveManualReviewReasons(row, metadata, tolerancePolicy);
    const evidenceFieldsUsed = ["amount", "date", "currency", "description", "external_id"];
    const rationaleCodes = toReasonCodes(metadata.rationale_codes).length > 0
        ? toReasonCodes(metadata.rationale_codes)
        : manualReviewReasons;
    const reviewStateRaw = metadata.review_state;
    const reviewState = reviewStateRaw === "reviewed" ||
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
                    ? metadata.group_member_source_transaction_ids.slice().sort()
                    : [row.source_id],
                groupMemberTargetTransactionIds: Array.isArray(metadata.group_member_target_transaction_ids)
                    ? metadata.group_member_target_transaction_ids.slice().sort()
                    : row.target_id
                        ? [row.target_id]
                        : [],
            },
            evidenceFieldsUsed,
            amountComparison: {
                sourceAmount: row.source_amount,
                targetAmount: row.target_amount,
                amountDifference: row.amount_diff,
                withinTolerance: row.amount_diff === null ? null : row.amount_diff <= tolerancePolicy.amountTolerance,
            },
            dateComparison: {
                sourceDate: row.source_date.toISOString(),
                targetDate: row.target_date ? row.target_date.toISOString() : null,
                dateDifferenceDays: row.date_diff,
                withinWindow: row.date_diff === null ? null : Math.abs(row.date_diff) <= tolerancePolicy.dateWindowDays,
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
function compareWorkbenchRuns(fromItems, toItems, fromRunId, toRunId) {
    const fromMap = new Map(fromItems.map((item) => [item.source.externalId ?? item.source.id, item]));
    const toMap = new Map(toItems.map((item) => [item.source.externalId ?? item.source.id, item]));
    const keys = new Set([...fromMap.keys(), ...toMap.keys()]);
    const changes = [];
    let classificationChanges = 0;
    let groupMembershipChanges = 0;
    let varianceChanges = 0;
    let newlyManualReviewed = 0;
    let newlyMatched = 0;
    let newlyUnmatched = 0;
    for (const key of keys) {
        const from = fromMap.get(key) ?? null;
        const to = toMap.get(key) ?? null;
        const change = {
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
        const changed = change.classification.from !== change.classification.to ||
            change.groupMembership.from !== change.groupMembership.to ||
            change.variance.amountDiffFrom !== change.variance.amountDiffTo ||
            change.variance.dateDiffFrom !== change.variance.dateDiffTo ||
            change.queue.from !== change.queue.to;
        if (change.classification.from !== change.classification.to)
            classificationChanges++;
        if (change.groupMembership.from !== change.groupMembership.to)
            groupMembershipChanges++;
        if (change.variance.amountDiffFrom !== change.variance.amountDiffTo ||
            change.variance.dateDiffFrom !== change.variance.dateDiffTo) {
            varianceChanges++;
        }
        if (from?.queue !== "manual_review" && to?.queue === "manual_review")
            newlyManualReviewed++;
        if (from?.classification !== "exact" &&
            from?.classification !== "fuzzy" &&
            (to?.classification === "exact" || to?.classification === "fuzzy")) {
            newlyMatched++;
        }
        if (from?.classification !== "unmatched" && to?.classification === "unmatched")
            newlyUnmatched++;
        if (changed)
            changes.push(change);
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
//# sourceMappingURL=reconciliation-trust-contract.js.map