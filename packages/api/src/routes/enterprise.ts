/**
 * Enterprise Surface - Explicit Capability Gating
 *
 * These endpoints are intentionally unavailable until enterprise backend
 * integrations are configured and implemented.
 */

import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { sendProblemJson } from "../utils/problem-json";

// For backwards compatibility
export const requireAuth = authMiddleware;

const router: Router = Router();

const enterpriseSetupSteps = [
  "Configure RBAC role matrix and permission storage.",
  "Back enterprise audit export with persisted audit records.",
  "Enable multi-org tenant model and isolation policy surfaces.",
  "Wire enterprise webhook registration and delivery history persistence.",
  "Back enterprise metrics with production analytics aggregates.",
];

router.use((req, res) => {
  sendProblemJson(req as any, res, {
    status: 503,
    title: "Enterprise surface not configured",
    detail:
      "This enterprise API surface is intentionally disabled until enterprise backend integrations are configured.",
    code: "ENTERPRISE_SETUP_REQUIRED",
    type: "https://settler.dev/problems/enterprise-setup-required",
    extra: {
      setupRequired: true,
      retryable: false,
      setupSteps: enterpriseSetupSteps,
    },
  });
});

export default router;
