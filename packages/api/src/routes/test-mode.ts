/**
 * Test Mode Routes
 * UX-004: Test mode toggle for safe testing without production API keys
 */

import { Router, Response } from "express";
import { z } from "zod";
import { validateRequest } from "../middleware/validation";
import { AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";
import { query } from "../db";
import { handleRouteError } from "../utils/error-handler";
import { trackEventAsync } from "../utils/event-tracker";

const router: Router = Router();

const toggleTestModeSchema = z.object({
  body: z.object({
    enabled: z.boolean(),
  }),
});

// Get test mode status
router.get(
  "/test-mode",
  requirePermission(Permission.USERS_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;

      const tenantId = req.tenantId!;
      const users = await query<{ test_mode_enabled: boolean }>(
        `SELECT COALESCE(test_mode_enabled, false) as test_mode_enabled
         FROM users
         WHERE id = $1 AND tenant_id = $2`,
        [userId, tenantId]
      );

      if (users.length === 0 || !users[0]) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        data: {
          enabled: users[0].test_mode_enabled,
        },
      });
      return;
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get test mode status", 500, { userId: req.userId });
      return;
    }
  }
);

// Toggle test mode
router.post(
  "/test-mode",
  requirePermission(Permission.USERS_WRITE),
  validateRequest(toggleTestModeSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { enabled } = req.body;
      const userId = req.userId!;

      // Update user test mode setting
      // Add test_mode_enabled column if it doesn't exist (migration handles this)
      const tenantId = req.tenantId!;
      await query(
        `UPDATE users
         SET test_mode_enabled = $1, updated_at = NOW()
         WHERE id = $2 AND tenant_id = $3`,
        [enabled, userId, tenantId]
      );

      // Track event
      trackEventAsync(userId, "TestModeToggled", {
        enabled,
      });

      res.json({
        data: {
          enabled,
        },
        message: `Test mode ${enabled ? "enabled" : "disabled"}`,
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to toggle test mode", 500, { userId: req.userId });
    }
  }
);

export { router as testModeRouter };
