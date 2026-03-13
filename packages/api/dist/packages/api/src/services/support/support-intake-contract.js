"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportIntakeSubmissionSchema = exports.SUPPORT_ISSUE_CATEGORY = void 0;
const zod_1 = require("zod");
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
exports.supportIntakeSubmissionSchema = zod_1.z.object({
    tenant_id: zod_1.z.string().min(1),
    run_id: zod_1.z.string().min(1).optional(),
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
});
//# sourceMappingURL=support-intake-contract.js.map