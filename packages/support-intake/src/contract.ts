import { z } from "zod";

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
  /** Submitter-suggested urgency for operator triage (not an SLA commitment). */
  operator_triage_priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
});

export type SupportIntakeSubmission = z.infer<typeof supportIntakeSubmissionSchema>;

/** Human-readable labels for UI (tenant console, docs). */
export const SUPPORT_CATEGORY_LABELS: Record<SupportIssueCategory, string> = {
  [SUPPORT_ISSUE_CATEGORY.RUN_FAILURE]: "Run / job failure",
  [SUPPORT_ISSUE_CATEGORY.DATA_MISMATCH]: "Data mismatch / exception",
  [SUPPORT_ISSUE_CATEGORY.IMPORT_EXPORT]: "Import / export",
  [SUPPORT_ISSUE_CATEGORY.REPLAY_DIVERGENCE]: "Replay / determinism",
  [SUPPORT_ISSUE_CATEGORY.AUTH_ACCESS]: "Auth / access",
  [SUPPORT_ISSUE_CATEGORY.PERFORMANCE]: "Performance / latency",
  [SUPPORT_ISSUE_CATEGORY.BILLING_USAGE]: "Billing / usage",
  [SUPPORT_ISSUE_CATEGORY.DOCS_OTHER]: "Docs / other",
};
