import { Router, Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";
import { buildReconciliationExport } from "../services/reconciliation/export-contract";
import { handleRouteError } from "../utils/error-handler";

const router: Router = Router();

const querySchema = z.object({
  runId: z.string().uuid(),
  limit: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .refine((n) => n > 0 && n <= 10000, "limit must be between 1 and 10000")
    .optional()
    .default("1000"),
  offset: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .refine((n) => n >= 0, "offset must be >= 0")
    .optional()
    .default("0"),
});

router.get("/", requirePermission(Permission.REPORTS_EXPORT), async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      return res.status(401).json({
        code: "UNAUTHORIZED",
        message: "Tenant context is required",
        traceId: req.traceId,
        retryable: false,
      });
    }

    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        code: "BAD_REQUEST",
        message: "runId (uuid) query parameter is required",
        traceId: req.traceId,
        retryable: false,
      });
    }

    const exportDocument = await buildReconciliationExport(tenantId, parsed.data.runId, {
      limit: parsed.data.limit,
      offset: parsed.data.offset,
    });
    if (!exportDocument) {
      return res.status(404).json({
        code: "NOT_FOUND",
        message: "Reconciliation run not found",
        traceId: req.traceId,
        retryable: false,
      });
    }

    res.setHeader("Content-Type", "application/json");
    return res.status(200).json(exportDocument);
  } catch (error: unknown) {
    return handleRouteError(res, error, "Failed to export reconciliation data", 500, {
      userId: req.userId,
    });
  }
});

export { router as exportRouter };
