"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeReconResult = serializeReconResult;
function toObject(value) {
    return value && typeof value === "object" ? value : {};
}
function toArray(value) {
    return Array.isArray(value) ? value : [];
}
function normalizeRuntimeMatch(raw) {
    const input = toObject(raw);
    if (typeof input.transaction_id !== "string" || typeof input.source_record_id !== "string") {
        return null;
    }
    const classification = String(input.classification || "MANUAL_REVIEW");
    const disputePhase = typeof input.dispute_phase === "string" ? input.dispute_phase : undefined;
    const reversalPhase = typeof input.reversal_phase === "string" ? input.reversal_phase : undefined;
    return {
        transaction_id: input.transaction_id,
        source_record_id: input.source_record_id,
        target_record_id: typeof input.target_record_id === "string" ? input.target_record_id : null,
        classification,
        legacy_match_class: typeof input.legacy_match_class === "string" ? input.legacy_match_class : undefined,
        confidence: typeof input.confidence === "number" ? input.confidence : 0,
        amount_difference_minor: typeof input.amount_difference_minor === "number" ? input.amount_difference_minor : 0,
        date_difference_days: typeof input.date_difference_days === "number" ? input.date_difference_days : 0,
        group_id: typeof input.group_id === "string" ? input.group_id : undefined,
        group_member_transaction_ids: toArray(input.group_member_transaction_ids)
            .filter((v) => typeof v === "string")
            .sort(),
        source_member_record_ids: toArray(input.source_member_record_ids)
            .filter((v) => typeof v === "string")
            .sort(),
        target_member_record_ids: toArray(input.target_member_record_ids)
            .filter((v) => typeof v === "string")
            .sort(),
        grouped_total: typeof input.grouped_total === "number" ? input.grouped_total : undefined,
        manual_review_rationale_codes: toArray(input.manual_review_rationale_codes)
            .filter((v) => typeof v === "string")
            .sort(),
        is_dispute_related: Boolean(input.is_dispute_related),
        is_reversal_related: Boolean(input.is_reversal_related),
        dispute_phase: disputePhase,
        reversal_phase: reversalPhase,
        linked_dispute_id: typeof input.linked_dispute_id === "string" ? input.linked_dispute_id : undefined,
        linked_refund_id: typeof input.linked_refund_id === "string" ? input.linked_refund_id : undefined,
    };
}
function serializeReconResult(result) {
    const metadata = toObject(result.metadata);
    const summary = toObject(result.summary);
    const rawRuntimeMatches = metadata.runtime_matches ?? metadata.runtimeMatches ?? summary.runtime_matches ?? [];
    const runtimeMatches = toArray(rawRuntimeMatches)
        .map((match) => normalizeRuntimeMatch(match))
        .filter((match) => Boolean(match));
    return {
        ...result,
        runtime_matches: runtimeMatches,
    };
}
//# sourceMappingURL=serializers.js.map