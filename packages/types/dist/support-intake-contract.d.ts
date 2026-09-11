import { z } from "zod";
/**
 * Canonical support intake categories for operator/evidence-aligned triage.
 * Owned by @settler/types — consumed by API, web routes, and tests.
 */
export declare const SUPPORT_ISSUE_CATEGORY: {
    readonly RUN_FAILURE: "run_failure";
    readonly DATA_MISMATCH: "data_mismatch";
    readonly IMPORT_EXPORT: "import_export";
    readonly REPLAY_DIVERGENCE: "replay_divergence";
    readonly AUTH_ACCESS: "auth_access";
    readonly PERFORMANCE: "performance";
    readonly BILLING_USAGE: "billing_usage";
    readonly DOCS_OTHER: "docs_other";
};
export type SupportIssueCategory = (typeof SUPPORT_ISSUE_CATEGORY)[keyof typeof SUPPORT_ISSUE_CATEGORY];
export declare const SUPPORT_ISSUE_CATEGORY_LABELS: Record<SupportIssueCategory, string>;
export declare const supportIntakeRequestSchema: z.ZodObject<{
    run_id: z.ZodOptional<z.ZodString>;
    exception_id: z.ZodOptional<z.ZodString>;
    category: z.ZodEnum<{
        run_failure: "run_failure";
        data_mismatch: "data_mismatch";
        import_export: "import_export";
        replay_divergence: "replay_divergence";
        auth_access: "auth_access";
        performance: "performance";
        billing_usage: "billing_usage";
        docs_other: "docs_other";
    }>;
    description: z.ZodString;
    route: z.ZodOptional<z.ZodString>;
    module: z.ZodOptional<z.ZodString>;
    contact: z.ZodOptional<z.ZodObject<{
        user_id: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    operator_triage_priority: z.ZodOptional<z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
        urgent: "urgent";
    }>>;
}, z.core.$strip>;
export declare const supportIntakeSubmissionSchema: z.ZodObject<{
    run_id: z.ZodOptional<z.ZodString>;
    exception_id: z.ZodOptional<z.ZodString>;
    category: z.ZodEnum<{
        run_failure: "run_failure";
        data_mismatch: "data_mismatch";
        import_export: "import_export";
        replay_divergence: "replay_divergence";
        auth_access: "auth_access";
        performance: "performance";
        billing_usage: "billing_usage";
        docs_other: "docs_other";
    }>;
    description: z.ZodString;
    route: z.ZodOptional<z.ZodString>;
    module: z.ZodOptional<z.ZodString>;
    contact: z.ZodOptional<z.ZodObject<{
        user_id: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    operator_triage_priority: z.ZodOptional<z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
        urgent: "urgent";
    }>>;
    tenant_id: z.ZodString;
}, z.core.$strip>;
export type SupportIntakeRequest = z.infer<typeof supportIntakeRequestSchema>;
export type SupportIntakeSubmission = z.infer<typeof supportIntakeSubmissionSchema>;
//# sourceMappingURL=support-intake-contract.d.ts.map