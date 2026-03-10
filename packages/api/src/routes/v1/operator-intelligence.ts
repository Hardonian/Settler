import { Router, Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../../middleware/auth";
import { requirePermission } from "../../middleware/authorization";
import { Permission } from "../../infrastructure/security/Permissions";
import { validateRequest } from "../../middleware/validation";
import { handleRouteError } from "../../utils/error-handler";
import {
  getRunExplorer,
  getSystemHealthSnapshot,
} from "../../services/ops-intelligence/runtime-events";

const router: Router = Router();

router.get(
  "/operator/intelligence/system-health",
  requirePermission(Permission.ADMIN_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: "Missing tenant context" });
      }
      const days = Number(req.query.days ?? 7);
      const data = await getSystemHealthSnapshot(tenantId, Number.isFinite(days) ? days : 7);
      return res.json({ data });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to load system health snapshot", 500, {
        userId: req.userId,
      });
    }
  }
);

const runExplorerSchema = z.object({
  query: z.object({
    status: z.string().optional(),
    runId: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
  }),
});

router.get(
  "/operator/intelligence/run-explorer",
  requirePermission(Permission.ADMIN_READ),
  validateRequest(runExplorerSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: "Missing tenant context" });
      }
      const runs = await getRunExplorer(tenantId, {
        status: typeof req.query.status === "string" ? req.query.status : undefined,
        runId: typeof req.query.runId === "string" ? req.query.runId : undefined,
        limit: typeof req.query.limit === "string" ? Number(req.query.limit) : undefined,
      });
      return res.json({ data: runs });
    } catch (error: unknown) {
      return handleRouteError(res, error, "Failed to load run explorer", 500, {
        userId: req.userId,
      });
    }
  }
);

export default router;
