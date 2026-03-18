/**
 * System Health API Route
 * Exposes real health check data from HealthCheckService
 */

import { Router, Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { requirePermission } from "../../middleware/authorization";
import { Permission } from "../../infrastructure/security/Permissions";
import { handleRouteError } from "../../utils/error-handler";
import { HealthCheckService } from "../../infrastructure/observability/health";

const router: Router = Router();
const healthCheckService = new HealthCheckService();

/**
 * GET /api/v1/system-health
 * Returns comprehensive health status for all system dependencies
 */
router.get(
  "/system-health",
  requirePermission(Permission.ADMIN_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const health = await healthCheckService.checkAll();

      res.json({
        data: health,
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to retrieve system health", 500, {
        userId: req.userId,
      });
    }
  }
);

export { router as systemHealthRouter };
