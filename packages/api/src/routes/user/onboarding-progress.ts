/**
 * User Onboarding Progress API
 * Returns onboarding progress for authenticated user
 */

import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../../middleware/auth";
import { getOnboardingProgress, getNextOnboardingStep } from "../../services/onboarding/tracker";
import { sendSuccess, sendError } from "../../utils/api-response";

const router = Router();

/**
 * GET /api/user/onboarding-progress
 * Get onboarding progress for current user
 */
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    if (!userId) {
      return sendError(res, 401, "UNAUTHORIZED", "User ID required");
    }

    const progress = await getOnboardingProgress(userId);
    const nextStep = await getNextOnboardingStep(userId);

    return sendSuccess(res, {
      progress,
      nextStep,
    });
  } catch (error) {
    return sendError(res, 500, "INTERNAL_ERROR", "Failed to get onboarding progress", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
