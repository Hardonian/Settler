/**
 * Webhook Management Routes
 * 
 * Provides endpoints for:
 * - Webhook testing and replay
 * - Webhook delivery status
 * - Webhook configuration
 * - Webhook signature verification testing
 */

import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { logInfo, logError } from '../utils/logger';
import { generateRequestSignature, verifyRequestSignature } from '../middleware/request-signing';

const router = Router();

/**
 * Test webhook endpoint (for development/testing)
 * POST /api/v1/webhooks/test
 */
router.post('/test', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { payload, secret, algorithm = 'sha256' } = req.body;

    if (!payload || !secret) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'payload and secret are required',
      });
    }

    const { signature, timestamp, header } = generateRequestSignature(
      typeof payload === 'string' ? payload : JSON.stringify(payload),
      secret,
      algorithm as 'sha256' | 'sha512'
    );

    return res.json({
      success: true,
      signature,
      timestamp,
      header,
      verification: {
        algorithm,
        instructions: {
          'x-signature': signature,
          'x-signature-timestamp': timestamp.toString(),
        },
      },
    });
  } catch (error) {
    logError('Webhook test failed', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate webhook signature',
    });
  }
});

/**
 * Verify webhook signature
 * POST /api/v1/webhooks/verify
 */
router.post('/verify', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { payload, signature, timestamp, secret, algorithm = 'sha256' } = req.body;

    if (!payload || !signature || !timestamp || !secret) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'payload, signature, timestamp, and secret are required',
      });
    }

    const verification = verifyRequestSignature(
      typeof payload === 'string' ? payload : JSON.stringify(payload),
      signature,
      timestamp,
      secret,
      algorithm as 'sha256' | 'sha512'
    );

    return res.json({
      valid: verification.valid,
      reason: verification.reason,
      algorithm: verification.algorithm,
      timestamp: verification.timestamp,
    });
  } catch (error) {
    logError('Webhook verification failed', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to verify webhook signature',
    });
  }
});

/**
 * Replay webhook (for testing)
 * POST /api/v1/webhooks/replay
 */
router.post('/replay', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { webhookId, endpoint, payload } = req.body;

    if (!endpoint || !payload) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'endpoint and payload are required',
      });
    }

    // In production, this would:
    // 1. Fetch original webhook from database
    // 2. Replay to specified endpoint
    // 3. Record replay attempt

    logInfo('Webhook replay requested', {
      webhookId,
      endpoint,
      tenantId: req.tenantId,
    });

    return res.json({
      success: true,
      message: 'Webhook replay initiated',
      webhookId,
      endpoint,
      replayedAt: new Date().toISOString(),
    });
  } catch (error) {
    logError('Webhook replay failed', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to replay webhook',
    });
  }
});

/**
 * Get webhook delivery status
 * GET /api/v1/webhooks/:webhookId/status
 */
router.get('/:webhookId/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { webhookId } = req.params;

    // In production, fetch from database
    return res.json({
      webhookId,
      status: 'delivered',
      deliveredAt: new Date().toISOString(),
      attempts: 1,
      lastAttemptAt: new Date().toISOString(),
    });
  } catch (error) {
    logError('Failed to get webhook status', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get webhook status',
    });
  }
});

export { router as webhookManagementRouter };
