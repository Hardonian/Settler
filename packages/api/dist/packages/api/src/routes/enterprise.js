"use strict";
/**
 * Enterprise Surface - Explicit Capability Gating
 *
 * These endpoints are intentionally unavailable until enterprise backend
 * integrations are configured and implemented.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const problem_json_1 = require("../utils/problem-json");
// For backwards compatibility
exports.requireAuth = auth_1.authMiddleware;
const router = (0, express_1.Router)();
const enterpriseSetupSteps = [
    "Configure RBAC role matrix and permission storage.",
    "Back enterprise audit export with persisted audit records.",
    "Enable multi-org tenant model and isolation policy surfaces.",
    "Wire enterprise webhook registration and delivery history persistence.",
    "Back enterprise metrics with production analytics aggregates.",
];
router.use((req, res) => {
    (0, problem_json_1.sendProblemJson)(req, res, {
        status: 503,
        title: "Enterprise surface not configured",
        detail: "This enterprise API surface is intentionally disabled until enterprise backend integrations are configured.",
        code: "ENTERPRISE_SETUP_REQUIRED",
        type: "https://settler.dev/problems/enterprise-setup-required",
        extra: {
            setupRequired: true,
            retryable: false,
            setupSteps: enterpriseSetupSteps,
        },
    });
});
exports.default = router;
//# sourceMappingURL=enterprise.js.map