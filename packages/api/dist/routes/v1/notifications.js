"use strict";
/**
 * Notifications API Routes
 * Handles notification preferences and logs
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logger_1 = require("../../utils/logger");
const notifications_1 = require("../../services/notifications");
const router = (0, express_1.Router)();
/**
 * GET /api/v1/notifications/preferences
 * Get notification preferences
 */
router.get("/preferences", async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const userId = req.userId;
        const preferences = await (0, notifications_1.getNotificationPreferences)(tenantId, userId);
        return res.json({
            data: preferences,
            traceId: req.traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get notification preferences", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to get notification preferences",
            traceId: req.traceId,
        });
    }
});
/**
 * PUT /api/v1/notifications/preferences
 * Update notification preferences
 */
router.put("/preferences", async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const userId = req.userId;
        const { preferences } = req.body;
        if (!preferences || !Array.isArray(preferences)) {
            return res.status(400).json({
                error: "Bad Request",
                message: "preferences array is required",
                traceId: req.traceId,
            });
        }
        await (0, notifications_1.updateNotificationPreferences)(tenantId, preferences, userId);
        (0, logger_1.logInfo)("Notification preferences updated", { tenantId, userId, traceId: req.traceId });
        return res.status(200).json({
            message: "Preferences updated",
            traceId: req.traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to update notification preferences", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to update notification preferences",
            traceId: req.traceId,
        });
    }
});
/**
 * GET /api/v1/notifications/logs
 * Get notification logs
 */
router.get("/logs", async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const userId = req.userId;
        const { eventType, channel, limit = 100, offset = 0, } = req.query;
        const logs = await (0, notifications_1.getNotificationLogs)(tenantId, {
            userId,
            eventType: eventType,
            channel: channel,
            limit: parseInt(limit),
            offset: parseInt(offset),
        });
        return res.json({
            data: logs,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                total: logs.length,
            },
            traceId: req.traceId,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get notification logs", error, { traceId: req.traceId });
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to get notification logs",
            traceId: req.traceId,
        });
    }
});
exports.default = router;
//# sourceMappingURL=notifications.js.map