"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhooksRouter = void 0;
const crypto_1 = require("crypto");
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
const event_registry_1 = require("../services/webhooks/event-registry");
const raw_body_1 = require("../middleware/raw-body");
const client_1 = require("../infrastructure/redis/client");
const security_1 = require("../services/webhooks/security");
const router = (0, express_1.Router)();
exports.webhooksRouter = router;
const localReplayCache = new Map();
const WEBHOOK_REPLAY_WINDOW_SECONDS = 600;
// Rate limiting for webhook receive endpoint
const webhookReceiveLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 60,
    keyGenerator: (req) => `webhook:${req.params.adapter}:${req.ip}`,
    message: {
        error: "RATE_LIMITED",
        message: "Webhook ingest rate limit exceeded",
        retryAfterSeconds: 60,
    },
    standardHeaders: true,
    legacyHeaders: false,
});
const createWebhookSchema = zod_1.z.object({
    body: zod_1.z.object({
        url: zod_1.z.string().url(),
        events: zod_1.z.array(zod_1.z.string()).min(1),
        secret: zod_1.z.string().optional(),
    }),
});
const getWebhookSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
});
async function hasSeenWebhookReplayKey(replayKey) {
    if ((0, client_1.isRedisAvailable)()) {
        const exists = await client_1.cache.exists(replayKey);
        if (exists) {
            return "distributed";
        }
        await client_1.cache.set(replayKey, { seen: true }, WEBHOOK_REPLAY_WINDOW_SECONDS);
        return null;
    }
    const now = Date.now();
    for (const [key, expiresAt] of localReplayCache.entries()) {
        if (expiresAt <= now) {
            localReplayCache.delete(key);
        }
    }
    const existingExpiry = localReplayCache.get(replayKey);
    if (existingExpiry && existingExpiry > now) {
        return "local";
    }
    localReplayCache.set(replayKey, now + WEBHOOK_REPLAY_WINDOW_SECONDS * 1000);
    return null;
}
router.post("/", (0, authorization_1.requirePermission)(Permissions_1.Permission.WEBHOOKS_WRITE), (0, validation_1.validateRequest)(createWebhookSchema), async (req, res) => {
    try {
        const { url, events, secret } = req.body;
        const userId = req.userId;
        const isValidUrl = await (0, SSRFProtection_1.validateExternalUrl)(url);
        if (!isValidUrl) {
            return res.status(400).json({
                error: "Invalid Webhook URL",
                message: "URL must be HTTPS and cannot point to internal/private IP addresses",
            });
        }
        for (const event of events) {
            if (!(0, event_registry_1.isValidEventType)(event)) {
                return res.status(400).json({
                    error: "INVALID_EVENT_TYPE",
                    message: `Invalid event type: ${event}. Use GET /api/v1/webhooks/events to see available events.`,
                });
            }
            const metadata = (0, event_registry_1.getPublicEvents)().find((e) => e.type === event);
            if (!metadata || !metadata.public) {
                return res.status(400).json({
                    error: "INVALID_EVENT_TYPE",
                    message: `Event type ${event} is not available for public subscription`,
                });
            }
        }
        const webhookSecret = secret || `whsec_${(0, crypto_1.randomBytes)(32).toString("base64url")}`;
        const result = await (0, db_1.query)(`INSERT INTO webhooks (user_id, url, events, secret, status)
         VALUES ($1, $2, $3, $4, 'active')
         RETURNING id`, [userId, url, events, webhookSecret]);
        if (!result[0]) {
            throw new Error("Failed to create webhook");
        }
        const webhookId = result[0].id;
        await (0, db_1.query)(`INSERT INTO audit_logs (event, user_id, metadata)
         VALUES ($1, $2, $3)`, ["webhook_created", userId, JSON.stringify({ webhookId, url: url.substring(0, 50) })]);
        (0, logger_1.logInfo)("Webhook created", { webhookId, userId });
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
router.get("/", (0, authorization_1.requirePermission)(Permissions_1.Permission.WEBHOOKS_READ), async (req, res) => {
    try {
        const userId = req.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 100, 1000);
        const offset = (page - 1) * limit;
        const tenantId = req.tenantId;
        const [webhooks, totalResult] = await Promise.all([
            (0, db_1.query)(`SELECT id, url, events, status, created_at
           FROM webhooks
           WHERE user_id = $1 AND tenant_id = $2
           ORDER BY created_at DESC
           LIMIT $3 OFFSET $4`, [userId, tenantId, limit, offset]),
            (0, db_1.query)(`SELECT COUNT(*) as count FROM webhooks WHERE user_id = $1 AND tenant_id = $2`, [userId, tenantId]),
        ]);
        if (!totalResult[0]) {
            throw new Error("Failed to get webhook count");
        }
        const total = parseInt(totalResult[0].count);
        res.json({
            data: webhooks.map((w) => ({
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
router.post("/receive/:adapter", webhookReceiveLimiter, (0, raw_body_1.createRawBodyMiddleware)(), async (req, res) => {
    try {
        const adapter = (req.params.adapter || "").toLowerCase();
        const signature = req.headers["x-webhook-signature"];
        const timestampHeader = req.headers["x-webhook-timestamp"];
        if (!adapter || !(0, security_1.isAllowedWebhookAdapter)(adapter)) {
            return res.status(400).json({
                error: "UNSUPPORTED_ADAPTER",
                message: "Webhook adapter is not allowed",
            });
        }
        const timestampValidation = (0, security_1.validateWebhookTimestamp)(timestampHeader);
        if (!timestampValidation.valid) {
            return res.status(401).json({
                error: "INVALID_WEBHOOK_TIMESTAMP",
                message: timestampValidation.reason === "missing"
                    ? "Missing webhook timestamp"
                    : timestampValidation.reason === "invalid"
                        ? "Invalid webhook timestamp"
                        : "Webhook timestamp is outside allowed tolerance",
            });
        }
        if (!signature) {
            (0, logger_1.logWarn)("Missing webhook signature", { adapter, ip: req.ip });
            return res.status(401).json({ error: "Missing webhook signature" });
        }
        const rawBody = req.rawBodyString;
        if (!rawBody) {
            return res.status(400).json({
                error: "RAW_BODY_REQUIRED",
                message: "Raw body is required for webhook signature verification",
            });
        }
        const replayKey = (0, security_1.buildWebhookReplayKey)(adapter, signature, timestampHeader);
        const replayHit = await hasSeenWebhookReplayKey(replayKey);
        if (replayHit) {
            (0, logger_1.logWarn)("Rejected replayed webhook", { adapter, mode: replayHit });
            return res.status(409).json({
                error: "WEBHOOK_REPLAY_DETECTED",
                mode: replayHit,
                message: replayHit === "distributed"
                    ? "Webhook already processed in distributed replay window"
                    : "Webhook already processed in local replay window",
            });
        }
        try {
            const isValid = await (0, webhook_signature_1.verifyWebhookSignature)(adapter, rawBody, signature);
            if (!isValid) {
                (0, logger_1.logWarn)("Invalid webhook signature", { adapter, ip: req.ip });
                return res.status(401).json({ error: "Invalid webhook signature" });
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Webhook signature verification failed";
            (0, logger_1.logError)("Webhook signature verification failed", error, { adapter });
            return res.status(400).json({ error: message });
        }
        await (0, db_1.query)(`INSERT INTO webhook_payloads (adapter, payload, signature, received_at)
           VALUES ($1, $2, $3, NOW())`, [adapter, JSON.stringify(req.body), signature]);
        (0, logger_1.logInfo)("Webhook received", {
            adapter,
            replayProtection: (0, client_1.isRedisAvailable)() ? "distributed" : "local_only",
        });
        res.status(202).json({
            received: true,
            mode: (0, client_1.isRedisAvailable)() ? "distributed" : "local_only",
            message: "Webhook received and queued for processing",
        });
        return;
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to process webhook", 500, {
            adapter: req.params.adapter,
        });
        return;
    }
});
router.delete("/:id", (0, authorization_1.requirePermission)(Permissions_1.Permission.WEBHOOKS_DELETE), (0, validation_1.validateRequest)(getWebhookSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        await new Promise((resolve, reject) => {
            (0, authorization_1.requireResourceOwnership)(req, res, (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            }, "webhook", id || "");
        });
        const tenantId = req.tenantId;
        await (0, db_1.query)(`DELETE FROM webhooks WHERE id = $1 AND user_id = $2 AND tenant_id = $3`, [
            id || "",
            userId,
            tenantId,
        ]);
        await (0, db_1.query)(`INSERT INTO audit_logs (event, user_id, metadata)
         VALUES ($1, $2, $3)`, ["webhook_deleted", userId, JSON.stringify({ webhookId: id })]);
        (0, logger_1.logInfo)("Webhook deleted", { webhookId: id, userId });
        res.status(204).send();
        return;
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to delete webhook", 500, {
            userId: req.userId,
            webhookId: req.params.id,
        });
        return;
    }
});
//# sourceMappingURL=webhooks.js.map