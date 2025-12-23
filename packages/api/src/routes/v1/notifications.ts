/**
 * Notifications API Routes
 * Handles notification preferences and logs
 */

import { Router, Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { logError, logInfo } from "../../utils/logger";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  getNotificationLogs,
  type NotificationPreferences,
} from "../../services/notifications";

const router = Router();

/**
 * GET /api/v1/notifications/preferences
 * Get notification preferences
 */
router.get("/preferences", async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.userId;

    const preferences = await getNotificationPreferences(tenantId, userId);

    return res.json({
      data: preferences,
      traceId: req.traceId,
    });
  } catch (error) {
    logError("Failed to get notification preferences", error, { traceId: req.traceId });
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
router.put("/preferences", async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.userId;
    const { preferences } = req.body;

    if (!preferences || !Array.isArray(preferences)) {
      return res.status(400).json({
        error: "Bad Request",
        message: "preferences array is required",
        traceId: req.traceId,
      });
    }

    await updateNotificationPreferences(tenantId, preferences as NotificationPreferences[], userId);

    logInfo("Notification preferences updated", { tenantId, userId, traceId: req.traceId });

    return res.status(200).json({
      message: "Preferences updated",
      traceId: req.traceId,
    });
  } catch (error) {
    logError("Failed to update notification preferences", error, { traceId: req.traceId });
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
router.get("/logs", async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.userId;
    const {
      eventType,
      channel,
      limit = 100,
      offset = 0,
    } = req.query;

    const logs = await getNotificationLogs(tenantId, {
      userId,
      eventType: eventType as any,
      channel: channel as any,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    return res.json({
      data: logs,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: logs.length,
      },
      traceId: req.traceId,
    });
  } catch (error) {
    logError("Failed to get notification logs", error, { traceId: req.traceId });
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to get notification logs",
      traceId: req.traceId,
    });
  }
});

export default router;
