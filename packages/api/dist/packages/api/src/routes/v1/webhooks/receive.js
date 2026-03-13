"use strict";
/**
 * Webhook Receive Routes
 *
 * Endpoints for receiving webhooks from payment providers
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const WebhookIngestionService_1 = require("../../../application/webhooks/WebhookIngestionService");
const api_response_1 = require("../../../utils/api-response");
const error_handler_1 = require("../../../utils/error-handler");
const distributed_guards_1 = require("../../../services/distributed-guards");
const router = (0, express_1.Router)();
const webhookService = new WebhookIngestionService_1.WebhookIngestionService();
const MAX_TIMESTAMP_SKEW_MS = 5 * 60 * 1000;
function parseWebhookTimestamp(req) {
    const header = req.headers["x-webhook-timestamp"] || req.headers["x-timestamp"];
    if (!header) {
        return null;
    }
    const value = Array.isArray(header) ? header[0] : header;
    const asNumber = Number(value);
    if (!Number.isFinite(asNumber)) {
        return null;
    }
    return asNumber > 9999999999 ? asNumber : asNumber * 1000;
}
/**
 * POST /api/v1/webhooks/receive/:adapter
 * Receive webhook from payment provider
 */
router.post("/:adapter", async (req, res) => {
    try {
        const { adapter } = req.params;
        const tenantId = req.headers["x-tenant-id"] || req.body.tenant_id;
        if (!tenantId) {
            return (0, api_response_1.sendError)(res, 400, "BAD_REQUEST", "Tenant ID required");
        }
        const signature = req.headers["x-signature"] ||
            req.headers["stripe-signature"] ||
            req.headers["paypal-transmission-sig"] ||
            req.headers["x-square-signature"] ||
            req.headers["x-square-hmacsha256-signature"] ||
            "";
        if (!adapter || !signature) {
            return (0, api_response_1.sendError)(res, 400, "BAD_REQUEST", "Adapter and webhook signature are required");
        }
        const webhookTimestamp = parseWebhookTimestamp(req);
        if (webhookTimestamp && Math.abs(Date.now() - webhookTimestamp) > MAX_TIMESTAMP_SKEW_MS) {
            return (0, api_response_1.sendError)(res, 400, "WEBHOOK_TIMESTAMP_EXPIRED", "Webhook timestamp outside accepted window");
        }
        const replay = await (0, distributed_guards_1.consumeWebhookReplayKey)({
            adapter,
            tenantId,
            payload: req.body,
            signature: String(signature),
        });
        res.setHeader("X-Webhook-Replay-Guarantee", replay.guarantee);
        if (replay.duplicate) {
            (0, distributed_guards_1.logWebhookReplayRejected)(replay.guarantee, adapter);
            return (0, api_response_1.sendSuccess)(res, { processed: true, deduplicated: true, events: 0, guarantee: replay.guarantee }, "Duplicate webhook ignored");
        }
        const secret = await getWebhookSecret(adapter, tenantId);
        if (!secret) {
            return (0, api_response_1.sendError)(res, 401, "UNAUTHORIZED", "Webhook secret not configured");
        }
        const result = await webhookService.processWebhook(adapter, req.body, signature, secret, tenantId);
        if (!result.success) {
            return (0, api_response_1.sendError)(res, 400, "PROCESSING_FAILED", result.errors?.join(", ") || "Failed to process webhook");
        }
        (0, api_response_1.sendSuccess)(res, {
            processed: true,
            deduplicated: false,
            events: result.events.length,
            guarantee: replay.guarantee,
        });
        return;
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to process webhook", 500);
        return;
    }
});
async function getWebhookSecret(adapter, _tenantId) {
    const { query } = await Promise.resolve().then(() => __importStar(require("../../../db")));
    const result = await query(`SELECT secret FROM webhook_configs WHERE adapter = $1 LIMIT 1`, [adapter]);
    return result.length > 0 && result[0] ? result[0].secret : null;
}
exports.default = router;
//# sourceMappingURL=receive.js.map