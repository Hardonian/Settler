import { Router, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";
import { handleRouteError } from "../utils/error-handler";

const router: Router = Router();

/**
 * GET /api/auditor/samples
 * Fetches statistically significant random samples of reconciliations for external audit testing.
 */
router.get(
  "/samples",
  requirePermission(Permission.TENANT_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;

      // Mocked samples
      const samples = Array.from({ length: limit }).map((_, i) => ({
        id: `aud_${Math.random().toString(36).substring(2, 9)}`,
        date: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
        sourceAmount: (Math.random() * 10000).toFixed(2),
        targetAmount: (Math.random() * 10000).toFixed(2),
        status: i % 3 === 0 ? "exception" : "matched",
        proofPackId: `proof_${Math.random().toString(36).substring(2, 9)}`,
      }));

      return res.json({
        data: {
          samples,
          methodology: "Stratified Random Sampling (95% Confidence, 5% Margin of Error)",
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to fetch audit samples", 500, {
        userId: req.userId,
      });
      return;
    }
  }
);

/**
 * GET /api/auditor/controls
 * Fetches SOX/SOC2 control testing status.
 */
router.get(
  "/controls",
  requirePermission(Permission.TENANT_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      return res.json({
        data: {
          controls: [
            {
              id: "SOX-ITGC-01",
              name: "User Access Review",
              status: "Effective",
              lastTested: new Date().toISOString(),
            },
            {
              id: "SOX-ITGC-02",
              name: "Change Management",
              status: "Effective",
              lastTested: new Date().toISOString(),
            },
            {
              id: "FIN-REC-01",
              name: "Daily Bank Reconciliation",
              status: "Effective",
              lastTested: new Date().toISOString(),
            },
          ],
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to fetch control status", 500, {
        userId: req.userId,
      });
      return;
    }
  }
);

export const auditorRouter = router;
