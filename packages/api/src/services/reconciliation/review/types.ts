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

// Resolution rules for exception handling
export const RESOLUTION_RULES = {
  AMOUNT_MISMATCH_THRESHOLD: 1.0, // Auto-resolve amount differences <$1.00
  DATE_MISMATCH_THRESHOLD_DAYS: 3, // Auto-resolve date differences <3 days
  ROUNDING_TOLERANCE: 0.01, // Standard rounding tolerance
} as const;

export const SYSTEM_USER_ID = "system:automated_review";
