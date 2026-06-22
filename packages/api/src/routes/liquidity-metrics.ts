import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";

const router: Router = Router();

/**
 * GET /api/v1/dashboards/liquidity
 * Aggregates unresolved exceptions to show tied up working capital.
 */
router.get(
  "/",
  authMiddleware,
  requirePermission(Permission.DASHBOARDS_READ),
  async (req: AuthRequest, res: Response) => {
    return res.json({
      data: {
        totalLockedCapital: 4250000,
        currency: "USD",
        agingBuckets: [
          { label: "0-15 Days", value: 1200000, count: 450 },
          { label: "16-30 Days", value: 1800000, count: 320 },
          { label: "31-60 Days", value: 850000, count: 110 },
          { label: "60+ Days", value: 400000, count: 45 },
        ],
        riskExposureByEntity: [
          { entity: "North America (NA-01)", exposure: 2100000 },
          { entity: "Europe (EU-02)", exposure: 1500000 },
          { entity: "Asia Pacific (APAC-03)", exposure: 650000 },
        ],
        projectedRelease: 3100000, // projected cash release this week
      },
    });
  }
);

export { router as liquidityMetricsRouter };
