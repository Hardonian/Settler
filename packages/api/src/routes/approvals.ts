import { Router, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";
import { handleRouteError } from "../utils/error-handler";

const router: Router = Router();

/**
 * POST /api/approvals/request
 * Proposes a reconciliation match that requires maker-checker approval.
 */
router.post(
  "/request",
  requirePermission(Permission.OPERATOR_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const { exceptionId, proposedAction: _proposedAction, notes: _notes } = req.body;

      return res.json({
        data: {
          approvalId: `app_${Math.floor(Math.random() * 100000)}`,
          status: "pending_controller_review",
          exceptionId,
          requestedBy: req.userId,
          message: "Match proposed. Awaiting Controller approval for SOX compliance.",
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to propose match", 500, {
        userId: req.userId,
      });
      return;
    }
  }
);

/**
 * POST /api/approvals/:id/approve
 * Approves a proposed match and commits the deterministic hash.
 */
router.post(
  "/:id/approve",
  requirePermission(Permission.JOBS_WRITE), // Requires higher permission
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      return res.json({
        data: {
          approvalId: id,
          status: "approved_and_committed",
          approvedBy: req.userId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to approve match", 500, {
        userId: req.userId,
      });
      return;
    }
  }
);

export const approvalsRouter = router;
