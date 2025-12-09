"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhooksRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const validation_1 = require("../middleware/validation");
const authorization_1 = require("../middleware/authorization");
const Permissions_1 = require("../infrastructure/security/Permissions");
const db_1 = require("../db");
const webhook_signature_1 = require("../utils/webhook-signature");
const SSRFProtection_1 = require("../infrastructure/security/SSRFProtection");
const logger_1 = require("../utils/logger");
const error_handler_1 = require("../utils/error-handler");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = (0, express_1.Router)();
exports.webhooksRouter = router;
// Rate limiting for webhook receive endpoint
const webhookReceiveLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // Per adapter per IP
    keyGenerator: (req) => `webhook:${req.params.adapter}:${req.ip}`,
    message: "Too many webhook requests",
    standardHeaders: true,
    legacyHeaders: false,
});
// Validation schemas
const createWebhookSchema = zod_1.z.object({
    body: zod_1.z.object({
        url: zod_1.z.string().url(),
        events: zod_1.z.array(zod_1.z.string()),
        secret: zod_1.z.string().optional(),
    }),
});
const getWebhookSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
});
// Create webhook endpoint with SSRF protection
router.post("/", (0, authorization_1.requirePermission)(Permissions_1.Permission.WEBHOOKS_WRITE), (0, validation_1.validateRequest)(createWebhookSchema), async (req, res) => {
    try {
        const { url, events, secret } = req.body;
        const userId = req.userId;
        // Validate webhook URL (SSRF protection)
        const isValidUrl = await (0, SSRFProtection_1.validateExternalUrl)(url);
        if (!isValidUrl) {
            return res.status(400).json({
                error: "Invalid Webhook URL",
                message: "URL must be HTTPS and cannot point to internal/private IP addresses",
            });
        }
        // Generate secret if not provided
        const webhookSecret = secret || `whsec_${require('crypto').randomBytes(32).toString('base64url')}`;
        const result = await (0, db_1.query)(`INSERT INTO webhooks (user_id, url, events, secret, status)
         VALUES ($1, $2, $3, $4, 'active')
         RETURNING id`, [userId, url, events, webhookSecret]);
        if (!result[0]) {
            throw new Error('Failed to create webhook');
        }
        const webhookId = result[0].id;
        // Log audit event
        await (0, db_1.query)(`INSERT INTO audit_logs (event, user_id, metadata)
         VALUES ($1, $2, $3)`, [
            'webhook_created',
            userId,
            JSON.stringify({ webhookId, url: url.substring(0, 50) }), // Don't log full URL
        ]);
        (0, logger_1.logInfo)('Webhook created', { webhookId, userId });
        res.status(201).json({
            data: {
                id: webhookId,
                userId,
                url,
                events,
                status: "active",
                createdAt: new Date().toISOString(),
            },
            message: "Webhook created successfully",
        });
        return;
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to create webhook", 500, { userId: req.userId });
        return;
    }
});
// List webhooks with pagination
router.get("/", (0, authorization_1.requirePermission)(Permissions_1.Permission.WEBHOOKS_READ), async (req, res) => {
    try {
        const userId = req.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 100, 1000);
        const offset = (page - 1) * limit;
        const [webhooks, totalResult] = await Promise.all([
            (0, db_1.query)(`SELECT id, url, events, status, created_at
           FROM webhooks
           WHERE user_id = $1
           ORDER BY created_at DESC
           LIMIT $2 OFFSET $3`, [userId, limit, offset]),
            (0, db_1.query)(`SELECT COUNT(*) as count FROM webhooks WHERE user_id = $1`, [userId]),
        ]);
        if (!totalResult[0]) {
            throw new Error('Failed to get webhook count');
        }
        const total = parseInt(totalResult[0].count);
        res.json({
            data: webhooks.map(w => ({
                id: w.id,
                userId,
                url: w.url,
                events: w.events,
                status: w.status,
                createdAt: w.created_at.toISOString(),
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
        return;
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to fetch webhooks", 500, { userId: req.userId });
        return;
    }
});
// Webhook endpoint for receiving external webhooks with signature verification
router.post("/receive/:adapter", webhookReceiveLimiter, async (req, res) => {
    try {
        const { adapter } = req.params;
        const signature = req.headers["x-webhook-signature"];
        const timestamp = req.headers["x-webhook-timestamp"];
        // Get raw body for signature verification
        const rawBody = JSON.stringify(req.body);
        // Verify timestamp (prevent replay attacks)
        if (timestamp) {
            const requestTime = parseInt(timestamp);
            const currentTime = Math.floor(Date.now() / 1000);
            const timeDiff = Math.abs(currentTime - requestTime);
            if (timeDiff > 300) { // 5 minutes
                (0, logger_1.logWarn)('Webhook timestamp too old', { adapter, timeDiff });
                return res.status(401).json({ error: "Request timestamp too old" });
            }
        }
        // Verify webhook signature
        if (!signature) {
            (0, logger_1.logWarn)('Missing webhook signature', { adapter, ip: req.ip });
            return res.status(401).json({ error: "Missing webhook signature" });
        }
        try {
            if (!adapter) {
                return res.status(400).json({ error: 'Adapter is required' });
            }
            const isValid = await (0, webhook_signature_1.verifyWebhookSignature)(adapter, rawBody, signature);
            if (!isValid) {
                (0, logger_1.logWarn)('Invalid webhook signature', { adapter, ip: req.ip });
                return res.status(401).json({ error: "Invalid webhook signature" });
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Webhook signature verification failed';
            (0, logger_1.logError)('Webhook signature verification failed', error, { adapter });
            return res.status(400).json({ error: message });
        }
        // Store webhook payload for async processing
        await (0, db_1.query)(`INSERT INTO webhook_payloads (adapter, payload, signature, received_at)
         VALUES ($1, $2, $3, NOW())`, [adapter || '', JSON.stringify(req.body), signature || '']);
        // Queue for async processing (in production, use Bull/Redis queue)
        // For now, acknowledge immediately
        (0, logger_1.logInfo)('Webhook received', { adapter, ip: req.ip });
        res.status(202).json({
            received: true,
            message: "Webhook received and queued for processing",
        });
        return;
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to process webhook", 500, { adapter: req.params.adapter });
        return;
    }
});
// Delete webhook
router.delete("/:id", (0, authorization_1.requirePermission)(Permissions_1.Permission.WEBHOOKS_DELETE), (0, validation_1.validateRequest)(getWebhookSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        // Check ownership
        await new Promise((resolve, reject) => {
            (0, authorization_1.requireResourceOwnership)(req, res, (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            }, 'webhook', id || '');
        });
        await (0, db_1.query)(`DELETE FROM webhooks WHERE id = $1 AND user_id = $2`, [id || '', userId]);
        // Log audit event
        await (0, db_1.query)(`INSERT INTO audit_logs (event, user_id, metadata)
         VALUES ($1, $2, $3)`, [
            'webhook_deleted',
            userId,
            JSON.stringify({ webhookId: id }),
        ]);
        (0, logger_1.logInfo)('Webhook deleted', { webhookId: id, userId });
        res.status(204).send();
        return;
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to delete webhook", 500, { userId: req.userId, webhookId: req.params.id });
        return;
    }
});
//# sourceMappingURL=webhooks.js.map