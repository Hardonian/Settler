/**
 * Automated Reconciliation Review Service
 *
 * Implements industry-standard automated review process for reconciliation matches.
 * Eliminates all manual intervention requirements while maintaining compliance.
 *
 * Industry Standards Implemented:
 * - SOC 2: Complete audit trail
 * - PCI-DSS: Secure automated processing
 * - GAAP/IFRS: Multi-field matching with tolerances
 */
export interface ReconciliationMatch {
    id: string;
    runId: string;
    sourceTransactionId: string;
    targetTransactionId: string | null;
    tenantId: string;
    matchType: "exact" | "fuzzy" | "manual" | "unmatched";
    confidence: number;
    matchReason: string | null;
    amountDiff: number | null;
    dateDiff: number | null;
    reviewed: boolean;
    reviewedBy: string | null;
    reviewedAt: Date | null;
    metadata: Record<string, unknown>;
}
export interface ReviewResult {
    matchId: string;
    action: "auto_approved" | "rule_resolved" | "exception_handled" | "system_flagged";
    resolutionRule?: string;
    confidence: number;
    auditEntryId: string;
}
/**
 * Automatically review a single reconciliation match
 */
export declare function autoReviewMatch(matchId: string, tenantId: string): Promise<ReviewResult>;
/**
 * Automatically review all matches in a reconciliation run
 */
export declare function autoReviewRun(runId: string, tenantId: string): Promise<{
    reviewed: number;
    autoApproved: number;
    ruleResolved: number;
    exceptionHandled: number;
    systemFlagged: number;
    errors: number;
}>;
/**
 * Get review statistics for a reconciliation run
 */
export declare function getReviewStatistics(runId: string, tenantId: string): Promise<{
    total: number;
    reviewed: number;
    autoApproved: number;
    ruleResolved: number;
    exceptionHandled: number;
    systemFlagged: number;
    averageConfidence: number;
}>;
//# sourceMappingURL=automated-review.d.ts.map