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
const router = (0, express_1.Router)();
const webhookService = new WebhookIngestionService_1.WebhookIngestionService();
/**
 * POST /api/v1/webhooks/receive/:adapter
 * Receive webhook from payment provider
 */
router.post('/:adapter', async (req, res) => {
    try {
        const { adapter } = req.params;
        const tenantId = req.headers['x-tenant-id'] || req.body.tenant_id;
        if (!tenantId) {
            return (0, api_response_1.sendError)(res, 400, 'BAD_REQUEST', 'Tenant ID required');
        }
        // Get signature from headers (provider-specific)
        const signature = req.headers['x-signature'] ||
            req.headers['stripe-signature'] ||
            req.headers['paypal-transmission-sig'] ||
            req.headers['x-square-signature'] ||
            req.headers['x-square-hmacsha256-signature'] ||
            '';
        if (!adapter || !tenantId) {
            return (0, api_response_1.sendError)(res, 400, 'BAD_REQUEST', 'Adapter and Tenant ID are required');
        }
        // Get webhook secret from config or database
        const secret = await getWebhookSecret(adapter, tenantId);
        if (!secret) {
            return (0, api_response_1.sendError)(res, 401, 'UNAUTHORIZED', 'Webhook secret not configured');
        }
        // Process webhook
        const result = await webhookService.processWebhook(adapter, req.body, signature, secret, tenantId);
        if (!result.success) {
            return (0, api_response_1.sendError)(res, 400, 'PROCESSING_FAILED', result.errors?.join(', ') || 'Failed to process webhook');
        }
        (0, api_response_1.sendSuccess)(res, {
            processed: true,
            events: result.events.length
        });
        return;
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to process webhook', 500);
        return;
    }
});
/**
 * Get webhook secret from database
 */
async function getWebhookSecret(adapter, _tenantId) {
    const { query } = await Promise.resolve().then(() => __importStar(require('../../../db')));
    const result = await query(`SELECT secret FROM webhook_configs WHERE adapter = $1 LIMIT 1`, [adapter]);
    return result.length > 0 && result[0] ? result[0].secret : null;
}
exports.default = router;
//# sourceMappingURL=receive.js.map