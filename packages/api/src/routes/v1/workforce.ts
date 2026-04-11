import { Router, Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../../middleware/auth";
import { requirePermission } from "../../middleware/authorization";
import { Permission } from "../../infrastructure/security/Permissions";
import { validateRequest } from "../../middleware/validation";
import { handleRouteError } from "../../utils/error-handler";
import { prisma } from "../../infrastructure/db/prisma";
import {
  PriorRunDeltaAnalystService,
  PRIOR_RUN_DELTA_ANALYST_KEY,
} from "../../services/intelligence/prior-run-delta-analyst";
import { RunDeltaService } from "../../services/intelligence/run-delta";

const router: Router = Router();
const analyst = new PriorRunDeltaAnalystService(prisma);
const runDeltaService = new RunDeltaService(prisma);

const registrySchema = z.object({
  query: z.object({}),
});

const runDeltaParamsSchema = z.object({
  params: z.object({
    runDeltaId: z.string().uuid(),
  }),
});

const listSchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

function tenantOr400(req: AuthRequest, res: Response): string | null {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(400).json({ error: "Missing tenant context" });
    return null;
  }
  return tenantId;
}

router.get(
  "/operator/workforce/registry",
  requirePermission(Permission.ADMIN_READ),
  validateRequest(registrySchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = tenantOr400(req, res);
      if (!tenantId) return;

      return res.status(200).json({
        data: {
          workers: [
            {
              key: PRIOR_RUN_DELTA_ANALYST_KEY,
              version: "1",
              displayName: "Prior Run Delta Analyst",
              description:
                "Deterministic briefing from canonical RunDelta rows. No external inference; cites run and delta ids only.",
              inputs: ["run_delta row (tenant-scoped)", "recon result pair"],
              outputs: ["headline", "posture", "bullets", "recommended next steps", "contentHash"],
              riskLevel: "low",
              requiresApproval: false,
              degradedWhen: [
                "no prior run on delta",
                "config drift flagged on delta",
                "worker_runs table unavailable",
              ],
            },
          ],
        },
      });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to load workforce registry", 500, {
        userId: req.userId,
      });
    }
  }
);

router.get(
  "/operator/workforce/runs",
  requirePermission(Permission.ADMIN_READ),
  validateRequest(listSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = tenantOr400(req, res);
      if (!tenantId) return;
      const limit = Number(req.query.limit ?? 20);
      const runs = await analyst.listRecent(tenantId, limit);
      return res.status(200).json({ data: runs });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to list worker runs", 500, {
        userId: req.userId,
        tenantId: req.tenantId,
      });
    }
  }
);

router.get(
  "/operator/workforce/run-deltas/:runDeltaId/analysis",
  requirePermission(Permission.ADMIN_READ),
  validateRequest(runDeltaParamsSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = tenantOr400(req, res);
      if (!tenantId) return;
      const runDeltaId = req.params["runDeltaId"] as string;

      const deltaRow = await prisma.runDelta.findFirst({
        where: { id: runDeltaId, tenantId },
      });
      if (!deltaRow) {
        return res.status(404).json({ error: "RUN_DELTA_NOT_FOUND", message: "Run delta not found" });
      }

      let record = await analyst.getLatestForRunDelta(tenantId, runDeltaId);
      if (!record) {
        const enriched = await runDeltaService.getDeltaHistory(tenantId, deltaRow.jobId, 50);
        const match = enriched.find((d) => d.id === runDeltaId);
        if (match) {
          await analyst.recordAnalysis({
            tenantId,
            runDeltaId,
            delta: match,
            trigger: "api_refresh",
          });
          record = await analyst.getLatestForRunDelta(tenantId, runDeltaId);
        }
      }

      if (!record) {
        return res.status(503).json({
          error: "WORKER_UNAVAILABLE",
          message: "Analysis could not be produced for this delta.",
        });
      }

      return res.status(200).json({ data: record });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to load delta analysis", 500, {
        userId: req.userId,
        tenantId: req.tenantId,
      });
    }
  }
);

export default router;
