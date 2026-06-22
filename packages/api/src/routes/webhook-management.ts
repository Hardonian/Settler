/**
 * Webhook Management Routes
 *
 * Provides endpoints for:
 * - Webhook testing and replay
 * - Webhook delivery status
 * - Webhook configuration
 * - Webhook signature verification testing
 */

import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { enforceFreezeState } from "../middleware/governance";
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";
import { logInfo, logError } from "../utils/logger";
import { generateRequestSignature, verifyRequestSignature } from "../middleware/request-signing";

const router: Router = Router();

/**
 * Test webhook endpoint (for development/testing)
 * POST /api/v1/webhooks/test
 */
router.post(
  "/test",
  authMiddleware,
  requirePermission(Permission.WEBHOOKS_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const { payload, secret, algorithm = "sha256" } = req.body;

      if (!payload || !secret) {
        return res.status(400).json({
          error: "Bad Request",
          message: "payload and secret are required",
        });
      }

      const { signature, timestamp, header } = generateRequestSignature(
        typeof payload === "string" ? payload : JSON.stringify(payload),
        secret,
        algorithm as "sha256" | "sha512"
      );

      return res.json({
        success: true,
        signature,
        timestamp,
        header,
        verification: {
          algorithm,
          instructions: {
            "x-signature": signature,
            "x-signature-timestamp": timestamp.toString(),
          },
        },
      });
    } catch (error) {
      logError("Webhook test failed", error);
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to generate webhook signature",
      });
    }
  }
);

/**
 * Verify webhook signature
 * POST /api/v1/webhooks/verify
 */
router.post(
  "/verify",
  authMiddleware,
  requirePermission(Permission.WEBHOOKS_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const { payload, signature, timestamp, secret, algorithm = "sha256" } = req.body;

      if (!payload || !signature || !timestamp || !secret) {
        return res.status(400).json({
          error: "Bad Request",
          message: "payload, signature, timestamp, and secret are required",
        });
      }

      const verification = verifyRequestSignature(
        typeof payload === "string" ? payload : JSON.stringify(payload),
        signature,
        timestamp,
        secret,
        algorithm as "sha256" | "sha512"
      );

      return res.json({
        valid: verification.valid,
        reason: verification.reason,
        algorithm: verification.algorithm,
        timestamp: verification.timestamp,
      });
    } catch (error) {
      logError("Webhook verification failed", error);
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to verify webhook signature",
      });
    }
  }
);

/**
 * Replay webhook (for testing)
 * POST /api/v1/webhooks/replay
 */
router.post(
  "/replay",
  authMiddleware,
  requirePermission(Permission.WEBHOOKS_WRITE),
  enforceFreezeState(),
  async (req: AuthRequest, res: Response) => {
    try {
      const { webhookId, endpoint, payload } = req.body;

      if (!endpoint || !payload) {
        return res.status(400).json({
          error: "Bad Request",
          message: "endpoint and payload are required",
        });
      }

      // In production, this would:
      // 1. Fetch original webhook from database
      // 2. Replay to specified endpoint
      // 3. Record replay attempt

      logInfo("Webhook replay requested", {
        webhookId,
        endpoint,
        tenantId: req.tenantId,
      });

      return res.json({
        success: true,
        message: "Webhook replay initiated",
        webhookId,
        endpoint,
        replayedAt: new Date().toISOString(),
      });
    } catch (error) {
      logError("Webhook replay failed", error);
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to replay webhook",
      });
    }
  }
);

/**
 * Get webhook delivery status
 * GET /api/v1/webhooks/:webhookId/status
 */
router.get(
  "/:webhookId/status",
  authMiddleware,
  requirePermission(Permission.WEBHOOKS_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const { webhookId } = req.params;

      // In production, fetch from database
      return res.json({
        webhookId,
        status: "delivered",
        deliveredAt: new Date().toISOString(),
        attempts: 1,
        lastAttemptAt: new Date().toISOString(),
      });
    } catch (error) {
      logError("Failed to get webhook status", error);
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to get webhook status",
      });
    }
  }
);

/**
 * Get webhook delivery logs (IT Persona)
 * GET /api/v1/webhooks/logs
 */
router.get(
  "/logs",
  authMiddleware,
  requirePermission(Permission.WEBHOOKS_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      // Mocking comprehensive webhook delivery logs for the IT Persona
      return res.json({
        data: {
          logs: [
            {
              id: "wh_log_001",
              webhookId: "wh_endpoint_a",
              endpoint: "https://api.acmecorp.com/webhooks/settler",
              event: "exception.created",
              status: 200,
              deliveredAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
              payload: { id: "exc_123", amount: 500, currency: "USD" },
              latencyMs: 124,
            },
            {
              id: "wh_log_002",
              webhookId: "wh_endpoint_a",
              endpoint: "https://api.acmecorp.com/webhooks/settler",
              event: "reconciliation.completed",
              status: 503,
              deliveredAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
              payload: { runId: "run_456", matchedCount: 15000 },
              latencyMs: 3500,
            },
          ],
        },
      });
    } catch (error) {
      logError("Failed to fetch webhook logs", error);
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to fetch webhook logs",
      });
    }
  }
);

export { router as webhookManagementRouter };
