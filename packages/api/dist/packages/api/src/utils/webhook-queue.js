"use strict";
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
exports.checkIdempotency = checkIdempotency;
exports.storeIdempotencyKey = storeIdempotencyKey;
exports.processWebhookDelivery = processWebhookDelivery;
exports.processPendingWebhooks = processPendingWebhooks;
exports.queueWebhookDelivery = queueWebhookDelivery;
const db_1 = require("../db");
const webhook_signature_1 = require("./webhook-signature");
const logger_1 = require("./logger");
const validation_1 = require("../config/validation");
/**
 * Idempotency window in milliseconds (24 hours)
 */
const IDEMPOTENCY_WINDOW_MS = 24 * 60 * 60 * 1000;
/**
 * Check idempotency key for duplicate detection
 */
async function checkIdempotency(idempotencyKey, webhookId) {
    if (!idempotencyKey) {
        return { shouldProcess: true };
    }
    // Look for existing delivery with same idempotency key
    const existing = await (0, db_1.query)(`SELECT id, status, created_at
     FROM webhook_deliveries
     WHERE webhook_id = $1
     AND metadata->>'idempotencyKey' = $2
     AND created_at > NOW() - INTERVAL '24 hours'
     ORDER BY created_at DESC
     LIMIT 1`, [webhookId, idempotencyKey]);
    if (existing.length === 0) {
        return { shouldProcess: true };
    }
    const delivery = existing[0];
    if (!delivery) {
        return { shouldProcess: true };
    }
    // If already delivered successfully, skip processing
    if (delivery.status === "delivered") {
        (0, logger_1.logInfo)("Skipping duplicate webhook delivery", {
            webhookId,
            idempotencyKey,
            existingDeliveryId: delivery.id,
        });
        return {
            shouldProcess: false,
            existingDelivery: {
                id: delivery.id,
                status: delivery.status,
                createdAt: delivery.created_at,
            },
            reason: "Already delivered successfully",
        };
    }
    // If previous attempt failed, allow retry
    if (delivery.status === "failed") {
        return {
            shouldProcess: true,
            existingDelivery: {
                id: delivery.id,
                status: delivery.status,
                createdAt: delivery.created_at,
            },
            reason: "Previous attempt failed, allowing retry",
        };
    }
    // If pending or processing, skip to prevent race conditions
    return {
        shouldProcess: false,
        existingDelivery: {
            id: delivery.id,
            status: delivery.status,
            createdAt: delivery.created_at,
        },
        reason: "Delivery already in progress",
    };
}
/**
 * Store idempotency key for a webhook delivery
 */
async function storeIdempotencyKey(idempotencyKey, deliveryId, status = "pending") {
    if (!idempotencyKey) {
        return;
    }
    const expiresAt = new Date(Date.now() + IDEMPOTENCY_WINDOW_MS);
    await (0, db_1.query)(`INSERT INTO idempotency_keys (key, status, response, expires_at, completed_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (key) DO UPDATE
     SET status = $2, response = $3, expires_at = $4, completed_at = $5`, [
        idempotencyKey,
        status,
        JSON.stringify({ deliveryId, timestamp: new Date().toISOString() }),
        expiresAt,
        status === "completed" ? new Date() : null,
    ]);
}
// Process webhook deliveries with exponential backoff
async function processWebhookDelivery(delivery) {
    const maxRetries = validation_1.validatedConfig.webhook.maxRetries;
    let attempt = 0;
    while (attempt <= maxRetries) {
        try {
            const signature = (0, webhook_signature_1.generateWebhookSignature)(JSON.stringify(delivery.payload), delivery.secret);
            const response = await fetch(delivery.url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Webhook-Signature": signature,
                    "X-Webhook-Timestamp": Math.floor(Date.now() / 1000).toString(),
                    "X-Webhook-Event": delivery.payload.event,
                },
                body: JSON.stringify(delivery.payload),
                signal: AbortSignal.timeout(10000), // 10s timeout
            });
            if (!response.ok) {
                throw new Error(`Webhook delivery failed: ${response.status} ${response.statusText}`);
            }
            // Success - update delivery status
            await (0, db_1.query)(`UPDATE webhook_deliveries
         SET status = 'delivered',
             status_code = $1,
             delivered_at = NOW(),
             attempts = $2
         WHERE id = $3`, [response.status, attempt + 1, delivery.id]);
            (0, logger_1.logInfo)("Webhook delivered", {
                deliveryId: delivery.id,
                webhookId: delivery.webhookId,
                attempt: attempt + 1,
            });
            return;
        }
        catch (error) {
            attempt++;
            if (attempt > maxRetries) {
                // Max retries exceeded - mark as failed
                await (0, db_1.query)(`UPDATE webhook_deliveries
           SET status = 'failed',
               error = $1,
               attempts = $2
           WHERE id = $3`, [error.message, attempt, delivery.id]);
                (0, logger_1.logError)("Webhook delivery failed after max retries", error, {
                    deliveryId: delivery.id,
                    webhookId: delivery.webhookId,
                    attempts: attempt,
                });
                return;
            }
            // Calculate next retry time (exponential backoff)
            const delay = Math.min(validation_1.validatedConfig.webhook.initialDelay * Math.pow(2, attempt - 1), validation_1.validatedConfig.webhook.maxDelay);
            const nextRetryAt = new Date(Date.now() + delay);
            await (0, db_1.query)(`UPDATE webhook_deliveries
         SET status = 'failed',
             error = $1,
             attempts = $2,
             next_retry_at = $3
         WHERE id = $4`, [error.message, attempt, nextRetryAt, delivery.id]);
            (0, logger_1.logWarn)("Webhook delivery failed, will retry", {
                deliveryId: delivery.id,
                attempt,
                nextRetryAt: nextRetryAt.toISOString(),
                error: error.message,
            });
        }
    }
}
// Process pending webhook deliveries
async function processPendingWebhooks() {
    // Check kill switch for webhook processing
    const { isBackgroundJobPaused } = await Promise.resolve().then(() => __importStar(require("../services/operator-mode/kill-switches")));
    if (await isBackgroundJobPaused("webhook")) {
        (0, logger_1.logWarn)("Webhook processing paused via kill switch");
        return;
    }
    const pending = await (0, db_1.query)(`SELECT wd.id, wd.webhook_id as webhookId, wd.url, wd.payload, w.secret
     FROM webhook_deliveries wd
     JOIN webhooks w ON wd.webhook_id = w.id
     WHERE wd.status = 'failed'
       AND wd.next_retry_at <= NOW()
       AND wd.attempts < $1
     ORDER BY wd.next_retry_at ASC
     LIMIT 100`, [validation_1.validatedConfig.webhook.maxRetries]);
    for (const delivery of pending) {
        await processWebhookDelivery(delivery);
    }
}
// Queue webhook for delivery
async function queueWebhookDelivery(webhookId, payload) {
    const webhooks = await (0, db_1.query)(`SELECT url, secret FROM webhooks WHERE id = $1 AND status = 'active'`, [webhookId]);
    if (webhooks.length === 0) {
        throw new Error("Webhook not found or inactive");
    }
    const webhook = webhooks[0];
    if (!webhook) {
        throw new Error("Webhook not found or inactive");
    }
    const result = await (0, db_1.query)(`INSERT INTO webhook_deliveries (webhook_id, url, payload, status, attempts)
     VALUES ($1, $2, $3, 'pending', 0)
     RETURNING id`, [webhookId, webhook.url, JSON.stringify(payload)]);
    const deliveryId = result[0]?.id;
    if (!deliveryId) {
        throw new Error("Failed to create webhook delivery");
    }
    // Process immediately (in production, use job queue)
    processWebhookDelivery({
        id: deliveryId,
        webhookId,
        url: webhook.url,
        payload,
        secret: webhook.secret,
    }).catch((error) => {
        (0, logger_1.logError)("Failed to process webhook delivery", error, { deliveryId });
    });
    return deliveryId;
}
//# sourceMappingURL=webhook-queue.js.map