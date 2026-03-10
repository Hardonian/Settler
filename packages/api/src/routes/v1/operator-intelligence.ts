import { Router, Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../../middleware/auth";
import { requirePermission } from "../../middleware/authorization";
import { Permission } from "../../infrastructure/security/Permissions";
import { validateRequest } from "../../middleware/validation";
import { handleRouteError } from "../../utils/error-handler";
import {
  getOperatorIntelligenceProvider,
  getUnavailableOperatorIntelligenceProvider,
} from "../../services/capabilities/registry";
import { isMissingOptionalCapabilityDependency } from "../../services/capabilities/errors";
import { observeCapabilityStatus } from "../../services/capabilities/telemetry";

const router: Router = Router();

router.get(
  "/operator/intelligence/system-health",
  requirePermission(Permission.ADMIN_READ),
  async (req: AuthRequest, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: "Missing tenant context" });
    }

    try {
      const days = Number(req.query.days ?? 7);
      const provider = await getOperatorIntelligenceProvider();
      const data = await provider.getSystemHealthSnapshot(
        tenantId,
        Number.isFinite(days) ? days : 7
      );
      const capability = provider.status();
      observeCapabilityStatus(capability, "/api/v1/operator/intelligence/system-health");
      return res.json({ data, capability });
    } catch (error: unknown) {
      if (isMissingOptionalCapabilityDependency(error)) {
        const provider = getUnavailableOperatorIntelligenceProvider(
          "Operator intelligence storage tables are not present in OSS mode"
        );
        const capability = provider.status();
        observeCapabilityStatus(capability, "/api/v1/operator/intelligence/system-health");
        return res.status(200).json({
          data: await provider.getSystemHealthSnapshot(tenantId, 7),
          capability,
        });
      }

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
    const tenantId = req.tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: "Missing tenant context" });
    }

    try {
      const provider = await getOperatorIntelligenceProvider();
      const runs = await provider.getRunExplorer(tenantId, {
        status: typeof req.query.status === "string" ? req.query.status : undefined,
        runId: typeof req.query.runId === "string" ? req.query.runId : undefined,
        limit: typeof req.query.limit === "string" ? Number(req.query.limit) : undefined,
      });
      const capability = provider.status();
      observeCapabilityStatus(capability, "/api/v1/operator/intelligence/run-explorer");
      return res.json({ data: runs, capability });
    } catch (error: unknown) {
      if (isMissingOptionalCapabilityDependency(error)) {
        const provider = getUnavailableOperatorIntelligenceProvider(
          "Operator intelligence storage tables are not present in OSS mode"
        );
        const capability = provider.status();
        observeCapabilityStatus(capability, "/api/v1/operator/intelligence/run-explorer");
        return res.status(200).json({
          data: await provider.getRunExplorer(tenantId, {}),
          capability,
        });
      }

      return handleRouteError(res, error, "Failed to load run explorer", 500, {
        userId: req.userId,
      });
    }
  }
);

export default router;
