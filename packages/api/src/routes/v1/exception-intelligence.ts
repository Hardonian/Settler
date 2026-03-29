import { Router, Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../../middleware/auth";
import { requirePermission } from "../../middleware/authorization";
import { Permission } from "../../infrastructure/security/Permissions";
import { validateRequest } from "../../middleware/validation";
import { handleRouteError } from "../../utils/error-handler";
import { ExceptionIntelligenceService } from "../../services/operator-mode/exception-intelligence-service";

const router: Router = Router();
const service = new ExceptionIntelligenceService();

const snapshotSchema = z.object({
  query: z.object({
    lookbackDays: z.coerce.number().int().min(1).max(365).default(30),
  }),
});

const runSchema = z.object({
  params: z.object({
    runId: z.string().uuid(),
  }),
});

const policySandboxSchema = z.object({
  body: z.object({
    runId: z.string().uuid(),
    candidatePolicy: z.object({
      amountTolerance: z.number().min(0).max(100000),
      dateWindowDays: z.number().int().min(0).max(365),
      fuzzyDescriptionThreshold: z.number().min(0).max(1),
      requireExactAmount: z.boolean(),
    }),
  }),
});

router.get(
  "/operator/intelligence/exceptions/snapshot",
  requirePermission(Permission.ADMIN_READ),
  validateRequest(snapshotSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) {
        return res.status(400).json({
          error: "TENANT_CONTEXT_REQUIRED",
          message: "Tenant context is required",
        });
      }

      const lookbackDays = Number(req.query.lookbackDays ?? 30);
      const data = await service.getSnapshot(tenantId, lookbackDays);
      return res.status(200).json({ data });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to load exception intelligence snapshot", 500, {
        userId: req.userId,
        tenantId: req.tenantId,
      });
    }
  }
);

router.get(
  "/operator/intelligence/runs/:runId/proof-graph",
  requirePermission(Permission.ADMIN_READ),
  validateRequest(runSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) {
        return res.status(400).json({
          error: "TENANT_CONTEXT_REQUIRED",
          message: "Tenant context is required",
        });
      }

      const runIdParam = req.params["runId"];
      const runId = Array.isArray(runIdParam) ? (runIdParam[0] ?? "") : (runIdParam ?? "");
      const data = await service.getProofGraph(tenantId, runId);
      return res.status(data.degraded && data.nodes.length === 0 ? 404 : 200).json({ data });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to load proof graph", 500, {
        userId: req.userId,
        tenantId: req.tenantId,
      });
    }
  }
);

router.get(
  "/operator/intelligence/runs/:runId/evidence-pack",
  requirePermission(Permission.REPORTS_EXPORT),
  validateRequest(runSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) {
        return res.status(400).json({
          error: "TENANT_CONTEXT_REQUIRED",
          message: "Tenant context is required",
        });
      }

      const runIdParam = req.params["runId"];
      const runId = Array.isArray(runIdParam) ? (runIdParam[0] ?? "") : (runIdParam ?? "");
      const data = await service.buildEvidencePack(tenantId, runId);
      return res.status(200).json({ data });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to build evidence pack", 500, {
        userId: req.userId,
        tenantId: req.tenantId,
      });
    }
  }
);

router.post(
  "/operator/intelligence/policy/sandbox",
  requirePermission(Permission.ADMIN_WRITE),
  validateRequest(policySandboxSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) {
        return res.status(400).json({
          error: "TENANT_CONTEXT_REQUIRED",
          message: "Tenant context is required",
        });
      }

      const data = await service.simulatePolicy(tenantId, req.body);
      return res.status(200).json({ data });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to run policy sandbox", 500, {
        userId: req.userId,
        tenantId: req.tenantId,
      });
    }
  }
);

export default router;
