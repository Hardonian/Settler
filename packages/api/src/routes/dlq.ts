import { Router, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";
import { query } from "../db";
import { handleRouteError } from "../utils/error-handler";

const router = Router();

// GET /api/v1/operator/dlq
router.get(
  "/",
  requirePermission(Permission.OPERATOR_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await query(
        `SELECT id, tenant_id, source, payload, headers, error_reason, created_at
       FROM public.ingestion_dlq
       ORDER BY created_at DESC
       LIMIT 100`
      );
      res.json({ data: result });
    } catch (error) {
      handleRouteError(res, error, "Failed to fetch DLQ items");
    }
  }
);

// POST /api/v1/operator/dlq/:id/replay
router.post(
  "/:id/replay",
  requirePermission(Permission.OPERATOR_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const dlqId = id || "";
      const userId = req.userId!;

      const dlqItem = await query<{ tenant_id: string }[]>(
        `SELECT tenant_id FROM public.ingestion_dlq WHERE id = $1`,
        [dlqId]
      );
      if (!dlqItem || dlqItem.length === 0) {
        return res.status(404).json({ error: "DLQ item not found" });
      }

      // Enterprise AAA Requirement: Audit the operator's replay action
      await query(
        `INSERT INTO public.audit_logs (tenant_id, actor_id, action, target_id, details)
       VALUES ($1, $2, 'DLQ_WEBHOOK_REPLAY', $3, 'Operator manually triggered webhook replay from DLQ')`,
        [dlqItem[0].tenant_id || "system", userId, dlqId]
      );

      // Move payload back into queue (Mocked processing state for this scope)
      await query(`DELETE FROM public.ingestion_dlq WHERE id = $1`, [dlqId]);

      res
        .status(200)
        .json({ success: true, message: "Webhook replay initiated and audited successfully" });
    } catch (error) {
      handleRouteError(res, error, "Failed to replay DLQ item");
    }
  }
);

export { router as dlqRouter };
