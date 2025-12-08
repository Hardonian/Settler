/**
 * Adapter Connection Testing Routes
 * E1: Test adapter connections before creating jobs
 */

import { Router, Response } from "express";
import { z } from "zod";
import { validateRequest } from "../middleware/validation";
import { AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";
import { handleRouteError } from "../utils/error-handler";
import { testAdapterConnection } from "../services/adapter-connection-tester";

const router = Router();

const testConnectionSchema = z.object({
  body: z.object({
    adapter: z.string().min(1),
    config: z.record(z.unknown()),
  }),
});

// Test adapter connection
router.post(
  "/adapters/:adapter/test",
  requirePermission(Permission.WEBHOOKS_READ),
  validateRequest(testConnectionSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { adapter } = req.params;
      if (!adapter) {
        res.status(400).json({ error: "Adapter parameter required" });
        return;
      }
      const { config } = req.body;

      const result = await testAdapterConnection(adapter, config);

      if (result.success) {
        res.json({
          data: {
            success: true,
            latency: result.latency,
            adapter: result.adapter,
          },
          message: "Connection test successful",
        });
      } else {
        res.status(400).json({
          data: {
            success: false,
            error: result.error,
            latency: result.latency,
            adapter: result.adapter,
          },
          message: "Connection test failed",
        });
      }
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to test adapter connection", 500, { userId: req.userId });
    }
  }
);

export { router as adapterTestRouter };
