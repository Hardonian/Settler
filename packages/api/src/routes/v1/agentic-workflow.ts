/**
 * Agentic Workflow Routes
 *
 * Provides endpoints for:
 * - Automation state management
 * - Exception triage suggestions
 * - Queue prioritization
 * - Stale exception escalation
 * - Evidence pack assembly
 * - Policy recommendations
 *
 * All endpoints are:
 * - Audit-logged
 * - Tenant-scoped
 * - Gracefully degraded when data is insufficient
 * - Explicit about what is automated vs suggested
 */

import { Router, Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../../middleware/auth";
import { requirePermission } from "../../middleware/authorization";
import { Permission } from "../../infrastructure/security/Permissions";
import { validateRequest } from "../../middleware/validation";
import { handleRouteError } from "../../utils/error-handler";
import { agenticWorkflowService } from "../../services/agentic-workflow/agentic-workflow-service";

const router = Router();

const tenantOr400 = (req: AuthRequest, res: Response): string | null => {
  if (!req.tenantId) {
    res.status(400).json({ error: "TENANT_REQUIRED", message: "Tenant context required" });
    return null;
  }
  return req.tenantId;
};

const triageRequestSchema = z.object({
  body: z.object({
    exceptionIds: z.array(z.string().uuid()).min(1).max(100),
  }),
});

const priorityRequestSchema = z.object({
  query: z.object({
    exceptionIds: z
      .string()
      .optional()
      .transform((val) => (val ? val.split(",").filter(Boolean) : undefined)),
  }),
});

const escalateRequestSchema = z.object({
  query: z.object({
    thresholdHours: z.coerce.number().int().min(1).max(720).optional(),
  }),
});

const evidencePackParamsSchema = z.object({
  params: z.object({
    exceptionId: z.string().uuid(),
  }),
});

const automationStateUpdateSchema = z.object({
  body: z.object({
    automationEnabled: z.boolean().optional(),
    staleEscalationEnabled: z.boolean().optional(),
    staleThresholdHours: z.number().int().min(1).max(720).optional(),
    autoAssignmentEnabled: z.boolean().optional(),
    policyProposalEnabled: z.boolean().optional(),
  }),
});

const policyRecsSchema = z.object({
  query: z.object({
    lookbackDays: z.coerce.number().int().min(7).max(365).default(30),
  }),
});

router.get(
  "/automation/state",
  requirePermission(Permission.ADMIN_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = tenantOr400(req, res);
      if (!tenantId) return;

      const state = await agenticWorkflowService.getAutomationState(tenantId);
      return res.status(200).json({ data: state });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to get automation state", 500, {
        userId: req.userId,
        tenantId: req.tenantId,
      });
    }
  }
);

router.patch(
  "/automation/state",
  requirePermission(Permission.ADMIN_WRITE),
  validateRequest(automationStateUpdateSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = tenantOr400(req, res);
      if (!tenantId) return;

      const state = await agenticWorkflowService.updateAutomationState(tenantId, req.body);
      return res.status(200).json({ data: state });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to update automation state", 500, {
        userId: req.userId,
        tenantId: req.tenantId,
      });
    }
  }
);

router.post(
  "/exceptions/triage-suggestions",
  requirePermission(Permission.ADMIN_READ),
  validateRequest(triageRequestSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = tenantOr400(req, res);
      if (!tenantId) return;

      const { exceptionIds } = req.body;
      const suggestions = await agenticWorkflowService.getTriageSuggestions(tenantId, exceptionIds);

      return res.status(200).json({
        data: suggestions,
        meta: {
          automated: false,
          suggested: true,
          humanControlled: ["final_resolution", "bulk_actions"],
          governance: "All suggestions require human approval before execution",
          degradedCount: suggestions.filter((s) => s.degraded).length,
        },
      });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to get triage suggestions", 500, {
        userId: req.userId,
        tenantId: req.tenantId,
      });
    }
  }
);

router.get(
  "/exceptions/priorities",
  requirePermission(Permission.ADMIN_READ),
  validateRequest(priorityRequestSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = tenantOr400(req, res);
      if (!tenantId) return;

      const exceptionIds = req.query.exceptionIds;
      const priorities = await agenticWorkflowService.calculateQueuePriorities(
        tenantId,
        exceptionIds as string[] | undefined
      );

      return res.status(200).json({
        data: priorities,
        meta: {
          automated: true,
          suggested: false,
          humanControlled: ["assignment", "resolution"],
          governance:
            "Priority scores are deterministic calculations; assignment remains human-controlled",
        },
      });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to calculate priorities", 500, {
        userId: req.userId,
        tenantId: req.tenantId,
      });
    }
  }
);

router.post(
  "/exceptions/escalate-stale",
  requirePermission(Permission.ADMIN_WRITE),
  validateRequest(escalateRequestSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = tenantOr400(req, res);
      if (!tenantId) return;

      const thresholdHours = req.query.thresholdHours;
      const result = await agenticWorkflowService.escalateStaleExceptions(
        tenantId,
        thresholdHours as number | undefined
      );

      return res.status(200).json({
        data: result,
        meta: {
          automated: true,
          suggested: false,
          humanControlled: [],
          governance:
            "Stale exceptions escalated automatically based on deterministic time threshold",
          note: result.degraded
            ? "Escalation disabled or no stale exceptions found"
            : `${result.escalatedCount} exceptions escalated`,
        },
      });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to escalate stale exceptions", 500, {
        userId: req.userId,
        tenantId: req.tenantId,
      });
    }
  }
);

router.get(
  "/exceptions/:exceptionId/evidence-pack",
  requirePermission(Permission.ADMIN_READ),
  validateRequest(evidencePackParamsSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = tenantOr400(req, res);
      if (!tenantId) return;

      const exceptionId = req.params["exceptionId"] as string;
      const pack = await agenticWorkflowService.assembleEvidencePack(tenantId, exceptionId);

      return res.status(200).json({
        data: pack,
        meta: {
          automated: true,
          suggested: false,
          humanControlled: ["resolution_decision"],
          governance: "Evidence pack assembled from deterministic provenance chain",
        },
      });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to assemble evidence pack", 500, {
        userId: req.userId,
        tenantId: req.tenantId,
      });
    }
  }
);

router.get(
  "/policy/recommendations",
  requirePermission(Permission.ADMIN_READ),
  validateRequest(policyRecsSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = tenantOr400(req, res);
      if (!tenantId) return;

      const lookbackDays = Number(req.query.lookbackDays ?? 30);
      const recommendations = await agenticWorkflowService.generatePolicyRecommendations(
        tenantId,
        lookbackDays
      );

      return res.status(200).json({
        data: recommendations,
        meta: {
          automated: true,
          suggested: true,
          humanControlled: ["policy_approval", "implementation"],
          governance: "Policy recommendations require human approval before implementation",
          note: "All recommendations are grounded in historical resolution patterns",
        },
      });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to generate policy recommendations", 500, {
        userId: req.userId,
        tenantId: req.tenantId,
      });
    }
  }
);

export default router;
