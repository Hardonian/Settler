import { Request, Response, Router } from "express";
import { rateLimiter } from "../../utils/rate-limiter";
import { logInfo } from "../../utils/logger";

const router: Router = Router();

/**
 * GET /api/v1/admin/kill-switch/status
 * Returns the current state of the global kill switch.
 */
router.get("/kill-switch/status", async (_req: Request, res: Response) => {
  try {
    const active = await rateLimiter.isKillSwitchActive();
    return res.json({ active });
  } catch {
    return res.status(500).json({ error: "Failed to fetch kill switch status" });
  }
});

/**
 * POST /api/v1/admin/kill-switch
 * Toggles the global kill switch to block/unblock all traffic.
 * Requires administrative privileges.
 */
router.post("/kill-switch", async (req: Request, res: Response) => {
  const { active } = req.body;

  if (typeof active !== "boolean") {
    return res.status(400).json({
      error: "INVALID_INPUT",
      message: "The 'active' field must be a boolean.",
    });
  }

  try {
    await rateLimiter.setGlobalKillSwitch(active);

    // Audit logging is essential for emergency actions
    logInfo("[OPERATOR_MODE] Global kill switch toggled", { active });

    return res.json({
      success: true,
      killSwitchActive: active,
    });
  } catch {
    return res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Failed to update the global kill switch.",
    });
  }
});

export default router as any;
