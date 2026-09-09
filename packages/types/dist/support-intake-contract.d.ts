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
    /**
     * Optional canonical exception reference. Non-UUID values are allowed so operators can still
     * record the reference verbatim, but only UUIDs can be enriched with family intelligence.
     */
    exception_id: z.ZodOptional<z.ZodString>;
    category: z.ZodEnum<["run_failure", "data_mismatch", "import_export", "replay_divergence", "auth_access", "performance", "billing_usage", "docs_other"]>;
    description: z.ZodString;
    route: z.ZodOptional<z.ZodString>;
    module: z.ZodOptional<z.ZodString>;
    contact: z.ZodOptional<z.ZodObject<{
        user_id: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        email?: string | undefined;
        user_id?: string | undefined;
        role?: string | undefined;
    }, {
        email?: string | undefined;
        user_id?: string | undefined;
        role?: string | undefined;
    }>>;
    /** Submitter-suggested urgency for operator triage (not an SLA commitment). */
    operator_triage_priority: z.ZodOptional<z.ZodEnum<["low", "medium", "high", "urgent"]>>;
}, "strip", z.ZodTypeAny, {
    category: "run_failure" | "data_mismatch" | "import_export" | "replay_divergence" | "auth_access" | "performance" | "billing_usage" | "docs_other";
    description: string;
    run_id?: string | undefined;
    exception_id?: string | undefined;
    route?: string | undefined;
    module?: string | undefined;
    contact?: {
        email?: string | undefined;
        user_id?: string | undefined;
        role?: string | undefined;
    } | undefined;
    operator_triage_priority?: "low" | "medium" | "high" | "urgent" | undefined;
}, {
    category: "run_failure" | "data_mismatch" | "import_export" | "replay_divergence" | "auth_access" | "performance" | "billing_usage" | "docs_other";
    description: string;
    run_id?: string | undefined;
    exception_id?: string | undefined;
    route?: string | undefined;
    module?: string | undefined;
    contact?: {
        email?: string | undefined;
        user_id?: string | undefined;
        role?: string | undefined;
    } | undefined;
    operator_triage_priority?: "low" | "medium" | "high" | "urgent" | undefined;
}>;
export declare const supportIntakeSubmissionSchema: z.ZodObject<{
    run_id: z.ZodOptional<z.ZodString>;
    /**
     * Optional canonical exception reference. Non-UUID values are allowed so operators can still
     * record the reference verbatim, but only UUIDs can be enriched with family intelligence.
     */
    exception_id: z.ZodOptional<z.ZodString>;
    category: z.ZodEnum<["run_failure", "data_mismatch", "import_export", "replay_divergence", "auth_access", "performance", "billing_usage", "docs_other"]>;
    description: z.ZodString;
    route: z.ZodOptional<z.ZodString>;
    module: z.ZodOptional<z.ZodString>;
    contact: z.ZodOptional<z.ZodObject<{
        user_id: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        email?: string | undefined;
        user_id?: string | undefined;
        role?: string | undefined;
    }, {
        email?: string | undefined;
        user_id?: string | undefined;
        role?: string | undefined;
    }>>;
    /** Submitter-suggested urgency for operator triage (not an SLA commitment). */
    operator_triage_priority: z.ZodOptional<z.ZodEnum<["low", "medium", "high", "urgent"]>>;
} & {
    tenant_id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    category: "run_failure" | "data_mismatch" | "import_export" | "replay_divergence" | "auth_access" | "performance" | "billing_usage" | "docs_other";
    description: string;
    tenant_id: string;
    run_id?: string | undefined;
    exception_id?: string | undefined;
    route?: string | undefined;
    module?: string | undefined;
    contact?: {
        email?: string | undefined;
        user_id?: string | undefined;
        role?: string | undefined;
    } | undefined;
    operator_triage_priority?: "low" | "medium" | "high" | "urgent" | undefined;
}, {
    category: "run_failure" | "data_mismatch" | "import_export" | "replay_divergence" | "auth_access" | "performance" | "billing_usage" | "docs_other";
    description: string;
    tenant_id: string;
    run_id?: string | undefined;
    exception_id?: string | undefined;
    route?: string | undefined;
    module?: string | undefined;
    contact?: {
        email?: string | undefined;
        user_id?: string | undefined;
        role?: string | undefined;
    } | undefined;
    operator_triage_priority?: "low" | "medium" | "high" | "urgent" | undefined;
}>;
export type SupportIntakeRequest = z.infer<typeof supportIntakeRequestSchema>;
export type SupportIntakeSubmission = z.infer<typeof supportIntakeSubmissionSchema>;
//# sourceMappingURL=support-intake-contract.d.ts.map