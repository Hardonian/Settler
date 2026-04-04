import { z } from "zod";

/**
 * Canonical support intake categories for operator/evidence-aligned triage.
 * Owned by @settler/types — consumed by API, web routes, and tests.
 */
export const SUPPORT_ISSUE_CATEGORY = {
  RUN_FAILURE: "run_failure",
  DATA_MISMATCH: "data_mismatch",
  IMPORT_EXPORT: "import_export",
  REPLAY_DIVERGENCE: "replay_divergence",
  AUTH_ACCESS: "auth_access",
  PERFORMANCE: "performance",
  BILLING_USAGE: "billing_usage",
  DOCS_OTHER: "docs_other",
} as const;

export type SupportIssueCategory =
  (typeof SUPPORT_ISSUE_CATEGORY)[keyof typeof SUPPORT_ISSUE_CATEGORY];

export const SUPPORT_ISSUE_CATEGORY_LABELS: Record<SupportIssueCategory, string> = {
  [SUPPORT_ISSUE_CATEGORY.RUN_FAILURE]: "Run failure / pipeline error",
  [SUPPORT_ISSUE_CATEGORY.DATA_MISMATCH]: "Data mismatch / reconciliation outcome",
  [SUPPORT_ISSUE_CATEGORY.IMPORT_EXPORT]: "Import / export / proof bundle",
  [SUPPORT_ISSUE_CATEGORY.REPLAY_DIVERGENCE]: "Replay divergence / determinism",
  [SUPPORT_ISSUE_CATEGORY.AUTH_ACCESS]: "Auth / access / tenant scope",
  [SUPPORT_ISSUE_CATEGORY.PERFORMANCE]: "Performance / latency",
  [SUPPORT_ISSUE_CATEGORY.BILLING_USAGE]: "Billing / usage / entitlements",
  [SUPPORT_ISSUE_CATEGORY.DOCS_OTHER]: "Docs / product question / other",
};

/**
 * Canonical support lifecycle statuses.
 * Owned by @settler/types — consumed by operator inbox, API, and admin surfaces.
 */
export const SUPPORT_STATUS = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  WAITING_ON_TENANT: "waiting_on_tenant",
  RESOLVED: "resolved",
  CLOSED: "closed",
} as const;

export type SupportStatus = (typeof SUPPORT_STATUS)[keyof typeof SUPPORT_STATUS];

export const SUPPORT_STATUS_LABELS: Record<SupportStatus, string> = {
  [SUPPORT_STATUS.OPEN]: "Open",
  [SUPPORT_STATUS.IN_PROGRESS]: "In progress",
  [SUPPORT_STATUS.WAITING_ON_TENANT]: "Waiting on tenant",
  [SUPPORT_STATUS.RESOLVED]: "Resolved",
  [SUPPORT_STATUS.CLOSED]: "Closed",
};

/**
 * Canonical support severity levels for operator triage.
 */
export const SUPPORT_SEVERITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
} as const;

export type SupportSeverity = (typeof SUPPORT_SEVERITY)[keyof typeof SUPPORT_SEVERITY];

export const SUPPORT_SEVERITY_LABELS: Record<SupportSeverity, string> = {
  [SUPPORT_SEVERITY.LOW]: "Low",
  [SUPPORT_SEVERITY.MEDIUM]: "Medium",
  [SUPPORT_SEVERITY.HIGH]: "High",
  [SUPPORT_SEVERITY.CRITICAL]: "Critical",
};

export const supportIntakeSubmissionSchema = z.object({
  tenant_id: z.string().min(1),
  run_id: z.string().min(1).optional(),
  category: z.enum([
    SUPPORT_ISSUE_CATEGORY.RUN_FAILURE,
    SUPPORT_ISSUE_CATEGORY.DATA_MISMATCH,
    SUPPORT_ISSUE_CATEGORY.IMPORT_EXPORT,
    SUPPORT_ISSUE_CATEGORY.REPLAY_DIVERGENCE,
    SUPPORT_ISSUE_CATEGORY.AUTH_ACCESS,
    SUPPORT_ISSUE_CATEGORY.PERFORMANCE,
    SUPPORT_ISSUE_CATEGORY.BILLING_USAGE,
    SUPPORT_ISSUE_CATEGORY.DOCS_OTHER,
  ]),
  severity: z
    .enum([
      SUPPORT_SEVERITY.LOW,
      SUPPORT_SEVERITY.MEDIUM,
      SUPPORT_SEVERITY.HIGH,
      SUPPORT_SEVERITY.CRITICAL,
    ])
    .optional()
    .default(SUPPORT_SEVERITY.MEDIUM),
  description: z.string().min(20).max(5000),
  route: z.string().min(1).optional(),
  module: z.string().min(1).optional(),
  contact: z
    .object({
      user_id: z.string().min(1).optional(),
      email: z.string().email().optional(),
      role: z.string().min(1).optional(),
    })
    .optional(),
});

export type SupportIntakeSubmission = z.infer<typeof supportIntakeSubmissionSchema>;

/**
 * Operator-facing support submission record shape.
 * Used by the admin support inbox to display canonical support data.
 */
export interface SupportSubmissionRecord {
  submissionId: string;
  tenantId: string;
  userId: string | null;
  category: SupportIssueCategory;
  severity: SupportSeverity;
  status: SupportStatus;
  description: string;
  runId: string | null;
  route: string | null;
  module: string | null;
  contact: { user_id?: string; email?: string; role?: string } | null;
  runContextState: string | null;
  operatorNotes: string | null;
  createdAt: string;
}
