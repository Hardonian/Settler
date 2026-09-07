"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportIntakeSubmissionSchema = exports.supportIntakeRequestSchema = exports.SUPPORT_ISSUE_CATEGORY_LABELS = exports.SUPPORT_ISSUE_CATEGORY = void 0;
const zod_1 = require("zod");
/**
 * Canonical support intake categories for operator/evidence-aligned triage.
 * Owned by @settler/types — consumed by API, web routes, and tests.
 */
exports.SUPPORT_ISSUE_CATEGORY = {
    RUN_FAILURE: "run_failure",
    DATA_MISMATCH: "data_mismatch",
    IMPORT_EXPORT: "import_export",
    REPLAY_DIVERGENCE: "replay_divergence",
    AUTH_ACCESS: "auth_access",
    PERFORMANCE: "performance",
    BILLING_USAGE: "billing_usage",
    DOCS_OTHER: "docs_other",
};
exports.SUPPORT_ISSUE_CATEGORY_LABELS = {
    [exports.SUPPORT_ISSUE_CATEGORY.RUN_FAILURE]: "Run failure / pipeline error",
    [exports.SUPPORT_ISSUE_CATEGORY.DATA_MISMATCH]: "Data mismatch / reconciliation outcome",
    [exports.SUPPORT_ISSUE_CATEGORY.IMPORT_EXPORT]: "Import / export / proof bundle",
    [exports.SUPPORT_ISSUE_CATEGORY.REPLAY_DIVERGENCE]: "Replay divergence / determinism",
    [exports.SUPPORT_ISSUE_CATEGORY.AUTH_ACCESS]: "Auth / access / tenant scope",
    [exports.SUPPORT_ISSUE_CATEGORY.PERFORMANCE]: "Performance / latency",
    [exports.SUPPORT_ISSUE_CATEGORY.BILLING_USAGE]: "Billing / usage / entitlements",
    [exports.SUPPORT_ISSUE_CATEGORY.DOCS_OTHER]: "Docs / product question / other",
};
exports.supportIntakeRequestSchema = zod_1.z.object({
    run_id: zod_1.z.string().min(1).optional(),
    /**
     * Optional canonical exception reference. Non-UUID values are allowed so operators can still
     * record the reference verbatim, but only UUIDs can be enriched with family intelligence.
     */
    exception_id: zod_1.z.string().min(1).optional(),
    category: zod_1.z.enum([
        exports.SUPPORT_ISSUE_CATEGORY.RUN_FAILURE,
        exports.SUPPORT_ISSUE_CATEGORY.DATA_MISMATCH,
        exports.SUPPORT_ISSUE_CATEGORY.IMPORT_EXPORT,
        exports.SUPPORT_ISSUE_CATEGORY.REPLAY_DIVERGENCE,
        exports.SUPPORT_ISSUE_CATEGORY.AUTH_ACCESS,
        exports.SUPPORT_ISSUE_CATEGORY.PERFORMANCE,
        exports.SUPPORT_ISSUE_CATEGORY.BILLING_USAGE,
        exports.SUPPORT_ISSUE_CATEGORY.DOCS_OTHER,
    ]),
    description: zod_1.z.string().min(20).max(5000),
    route: zod_1.z.string().min(1).optional(),
    module: zod_1.z.string().min(1).optional(),
    contact: zod_1.z
        .object({
        user_id: zod_1.z.string().min(1).optional(),
        email: zod_1.z.string().email().optional(),
        role: zod_1.z.string().min(1).optional(),
    })
        .optional(),
    /** Submitter-suggested urgency for operator triage (not an SLA commitment). */
    operator_triage_priority: zod_1.z.enum(["low", "medium", "high", "urgent"]).optional(),
});
exports.supportIntakeSubmissionSchema = exports.supportIntakeRequestSchema.extend({
    tenant_id: zod_1.z.string().min(1),
});
//# sourceMappingURL=support-intake-contract.js.map