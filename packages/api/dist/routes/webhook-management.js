"use strict";
/**
 * Webhook Management Routes
 *
 * Provides endpoints for:
 * - Webhook testing and replay
 * - Webhook delivery status
 * - Webhook configuration
 * - Webhook signature verification testing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookManagementRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../utils/logger");
const request_signing_1 = require("../middleware/request-signing");
const router = (0, express_1.Router)();
exports.webhookManagementRouter = router;
/**
 * Test webhook endpoint (for development/testing)
 * POST /api/v1/webhooks/test
 */
router.post('/test', auth_1.authMiddleware, async (req, res) => {
    try {
        const { payload, secret, algorithm = 'sha256' } = req.body;
        if (!payload || !secret) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'payload and secret are required',
            });
        }
        const { signature, timestamp, header } = (0, request_signing_1.generateRequestSignature)(typeof payload === 'string' ? payload : JSON.stringify(payload), secret, algorithm);
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
    }
    catch (error) {
        (0, logger_1.logError)('Webhook test failed', error);
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
router.post('/verify', auth_1.authMiddleware, async (req, res) => {
    try {
        const { payload, signature, timestamp, secret, algorithm = 'sha256' } = req.body;
        if (!payload || !signature || !timestamp || !secret) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'payload, signature, timestamp, and secret are required',
            });
        }
        const verification = (0, request_signing_1.verifyRequestSignature)(typeof payload === 'string' ? payload : JSON.stringify(payload), signature, timestamp, secret, algorithm);
        return res.json({
            valid: verification.valid,
            reason: verification.reason,
            algorithm: verification.algorithm,
            timestamp: verification.timestamp,
        });
    }
    catch (error) {
        (0, logger_1.logError)('Webhook verification failed', error);
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
router.post('/replay', auth_1.authMiddleware, async (req, res) => {
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
        (0, logger_1.logInfo)('Webhook replay requested', {
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
    }
    catch (error) {
        (0, logger_1.logError)('Webhook replay failed', error);
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
router.get('/:webhookId/status', auth_1.authMiddleware, async (req, res) => {
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
    }
    catch (error) {
        (0, logger_1.logError)('Failed to get webhook status', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to get webhook status',
        });
    }
});
//# sourceMappingURL=webhook-management.js.map