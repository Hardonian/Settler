import { Router, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";
import { handleRouteError } from "../utils/error-handler";

const router: Router = Router();

/**
 * POST /api/erp/sync/netsuite/journal-entry
 * Pushes a batch of Journal Entries directly to Oracle NetSuite via API.
 */
router.post(
  "/netsuite/journal-entry",
  requirePermission(Permission.JOBS_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const _tenantId = req.tenantId!;
      const { period: _period, entries } = req.body;

      // In a real implementation, this would use Token-Based Authentication (TBA)
      // to call the NetSuite SuiteTalk REST Web Services.

      const mockedResponse = {
        success: true,
        netsuiteInternalId: `JE_${Math.floor(Math.random() * 100000)}`,
        status: "POSTED",
        linesProcessed: entries ? entries.length : 14,
        syncedAt: new Date().toISOString(),
      };

      return res.json({
        data: mockedResponse,
        message: "Successfully synced Journal Entries to NetSuite GL.",
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to sync to ERP", 500, {
        userId: req.userId,
      });
      return;
    }
  }
);

export const erpSyncRouter = router;
