"use strict";
/**
 * Test Mode Routes
 * UX-004: Test mode toggle for safe testing without production API keys
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.testModeRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const validation_1 = require("../middleware/validation");
const authorization_1 = require("../middleware/authorization");
const Permissions_1 = require("../infrastructure/security/Permissions");
const db_1 = require("../db");
const error_handler_1 = require("../utils/error-handler");
const event_tracker_1 = require("../utils/event-tracker");
const router = (0, express_1.Router)();
exports.testModeRouter = router;
const toggleTestModeSchema = zod_1.z.object({
    body: zod_1.z.object({
        enabled: zod_1.z.boolean(),
    }),
});
// Get test mode status
router.get("/test-mode", (0, authorization_1.requirePermission)(Permissions_1.Permission.USERS_READ), async (req, res) => {
    try {
        const userId = req.userId;
        const users = await (0, db_1.query)(`SELECT COALESCE(test_mode_enabled, false) as test_mode_enabled
         FROM users
         WHERE id = $1`, [userId]);
        if (users.length === 0 || !users[0]) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json({
            data: {
                enabled: users[0].test_mode_enabled,
            },
        });
        return;
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to get test mode status", 500, { userId: req.userId });
        return;
    }
});
// Toggle test mode
router.post("/test-mode", (0, authorization_1.requirePermission)(Permissions_1.Permission.USERS_WRITE), (0, validation_1.validateRequest)(toggleTestModeSchema), async (req, res) => {
    try {
        const { enabled } = req.body;
        const userId = req.userId;
        // Update user test mode setting
        // Add test_mode_enabled column if it doesn't exist (migration handles this)
        await (0, db_1.query)(`UPDATE users
         SET test_mode_enabled = $1, updated_at = NOW()
         WHERE id = $2`, [enabled, userId]);
        // Track event
        (0, event_tracker_1.trackEventAsync)(userId, 'TestModeToggled', {
            enabled,
        });
        res.json({
            data: {
                enabled,
            },
            message: `Test mode ${enabled ? 'enabled' : 'disabled'}`,
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to toggle test mode", 500, { userId: req.userId });
    }
});
//# sourceMappingURL=test-mode.js.map