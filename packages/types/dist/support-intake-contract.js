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
};
export const SUPPORT_ISSUE_CATEGORY_LABELS = {
    [SUPPORT_ISSUE_CATEGORY.RUN_FAILURE]: "Run failure / pipeline error",
    [SUPPORT_ISSUE_CATEGORY.DATA_MISMATCH]: "Data mismatch / reconciliation outcome",
    [SUPPORT_ISSUE_CATEGORY.IMPORT_EXPORT]: "Import / export / proof bundle",
    [SUPPORT_ISSUE_CATEGORY.REPLAY_DIVERGENCE]: "Replay divergence / determinism",
    [SUPPORT_ISSUE_CATEGORY.AUTH_ACCESS]: "Auth / access / tenant scope",
    [SUPPORT_ISSUE_CATEGORY.PERFORMANCE]: "Performance / latency",
    [SUPPORT_ISSUE_CATEGORY.BILLING_USAGE]: "Billing / usage / entitlements",
    [SUPPORT_ISSUE_CATEGORY.DOCS_OTHER]: "Docs / product question / other",
};
export const supportIntakeRequestSchema = z.object({
    run_id: z.string().min(1).optional(),
    /**
     * Optional canonical exception reference. Non-UUID values are allowed so operators can still
     * record the reference verbatim, but only UUIDs can be enriched with family intelligence.
     */
    exception_id: z.string().min(1).optional(),
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
export const supportIntakeSubmissionSchema = supportIntakeRequestSchema.extend({
    tenant_id: z.string().min(1),
});
//# sourceMappingURL=support-intake-contract.js.map