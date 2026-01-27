"use strict";
/**
 * User Onboarding Progress API
 * Returns onboarding progress for authenticated user
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const tracker_1 = require("../../services/onboarding/tracker");
const api_response_1 = require("../../utils/api-response");
const router = (0, express_1.Router)();
/**
 * GET /api/user/onboarding-progress
 * Get onboarding progress for current user
 */
router.get("/", auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return (0, api_response_1.sendError)(res, 401, "UNAUTHORIZED", "User ID required");
        }
        const progress = await (0, tracker_1.getOnboardingProgress)(userId);
        const nextStep = await (0, tracker_1.getNextOnboardingStep)(userId);
        return (0, api_response_1.sendSuccess)(res, {
            progress,
            nextStep,
        });
    }
    catch (error) {
        return (0, api_response_1.sendError)(res, 500, "INTERNAL_ERROR", "Failed to get onboarding progress", {
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.default = router;
//# sourceMappingURL=onboarding-progress.js.map