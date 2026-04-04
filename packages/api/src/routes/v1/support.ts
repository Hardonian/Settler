import { Router } from "express";
import { z } from "zod";
import { tenantMiddleware } from "../../middleware/tenant";
import { AuthRequest } from "../../middleware/auth";
import { sendError } from "../../utils/api-response";
import { handleRouteError } from "../../utils/error-handler";
import { submitSupportIntake } from "../../services/support/support-intake-service";

const router: Router = Router();

const supportIntakeRequestSchema = z.object({
  category: z.string().min(1),
  description: z.string().min(20),
  run_id: z.string().optional(),
  route: z.string().optional(),
  module: z.string().optional(),
  contact: z
    .object({
      user_id: z.string().optional(),
      email: z.string().email().optional(),
      role: z.string().optional(),
    })
    .optional(),
  operator_triage_priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
});

router.post("/intake", tenantMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return sendError(res, 401, "UNAUTHORIZED", "Authentication required");
    }

    if (!req.tenantId) {
      return sendError(res, 403, "TENANT_NOT_FOUND", "Tenant context required");
    }

    const parseResult = supportIntakeRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(
        res,
        400,
        "INVALID_SUPPORT_INTAKE",
        "Support intake request is invalid",
        parseResult.error.flatten()
      );
    }

    const stored = await submitSupportIntake({
      userId: req.userId,
      tenantId: req.tenantId,
      path: req.originalUrl,
      body: parseResult.data,
    });

    return res.status(202).json({
      accepted: true,
      submission_id: stored.submissionId,
      tenant_id: stored.tenantId,
      created_at: stored.createdAt,
    });
  } catch (error) {
    return handleRouteError(res, error, "Failed to submit support intake", 500, {
      module: "routes/v1/support",
      route: `${req.method} ${req.baseUrl}${req.path}`,
      tenant_id: req.tenantId,
      run_id: typeof req.body?.run_id === "string" ? req.body.run_id : undefined,
    });
  }
});

export default router;
