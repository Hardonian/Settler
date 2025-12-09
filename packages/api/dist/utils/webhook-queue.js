"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processWebhookDelivery = processWebhookDelivery;
exports.processPendingWebhooks = processPendingWebhooks;
exports.queueWebhookDelivery = queueWebhookDelivery;
const db_1 = require("../db");
const webhook_signature_1 = require("./webhook-signature");
const logger_1 = require("./logger");
const config_1 = require("../config");
// Process webhook deliveries with exponential backoff
async function processWebhookDelivery(delivery) {
    const maxRetries = config_1.config.webhook.maxRetries;
    let attempt = 0;
    while (attempt <= maxRetries) {
        try {
            const signature = (0, webhook_signature_1.generateWebhookSignature)(JSON.stringify(delivery.payload), delivery.secret);
            const response = await fetch(delivery.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Signature': signature,
                    'X-Webhook-Timestamp': Math.floor(Date.now() / 1000).toString(),
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
            (0, logger_1.logInfo)('Webhook delivered', {
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
           WHERE id = $3`, [
                    error.message,
                    attempt,
                    delivery.id,
                ]);
                (0, logger_1.logError)('Webhook delivery failed after max retries', error, {
                    deliveryId: delivery.id,
                    webhookId: delivery.webhookId,
                    attempts: attempt,
                });
                return;
            }
            // Calculate next retry time (exponential backoff)
            const delay = Math.min(config_1.config.webhook.initialDelay * Math.pow(2, attempt - 1), config_1.config.webhook.maxDelay);
            const nextRetryAt = new Date(Date.now() + delay);
            await (0, db_1.query)(`UPDATE webhook_deliveries
         SET status = 'failed',
             error = $1,
             attempts = $2,
             next_retry_at = $3
         WHERE id = $4`, [
                error.message,
                attempt,
                nextRetryAt,
                delivery.id,
            ]);
            (0, logger_1.logWarn)('Webhook delivery failed, will retry', {
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
    const pending = await (0, db_1.query)(`SELECT wd.id, wd.webhook_id as webhookId, wd.url, wd.payload, w.secret
     FROM webhook_deliveries wd
     JOIN webhooks w ON wd.webhook_id = w.id
     WHERE wd.status = 'failed'
       AND wd.next_retry_at <= NOW()
       AND wd.attempts < $1
     ORDER BY wd.next_retry_at ASC
     LIMIT 100`, [config_1.config.webhook.maxRetries]);
    for (const delivery of pending) {
        await processWebhookDelivery(delivery);
    }
}
// Queue webhook for delivery
async function queueWebhookDelivery(webhookId, payload) {
    const webhooks = await (0, db_1.query)(`SELECT url, secret FROM webhooks WHERE id = $1 AND status = 'active'`, [webhookId]);
    if (webhooks.length === 0) {
        throw new Error('Webhook not found or inactive');
    }
    const webhook = webhooks[0];
    if (!webhook) {
        throw new Error('Webhook not found or inactive');
    }
    const result = await (0, db_1.query)(`INSERT INTO webhook_deliveries (webhook_id, url, payload, status, attempts)
     VALUES ($1, $2, $3, 'pending', 0)
     RETURNING id`, [webhookId, webhook.url, JSON.stringify(payload)]);
    const deliveryId = result[0]?.id;
    if (!deliveryId) {
        throw new Error('Failed to create webhook delivery');
    }
    // Process immediately (in production, use job queue)
    processWebhookDelivery({
        id: deliveryId,
        webhookId,
        url: webhook.url,
        payload,
        secret: webhook.secret,
    }).catch(error => {
        (0, logger_1.logError)('Failed to process webhook delivery', error, { deliveryId });
    });
    return deliveryId;
}
//# sourceMappingURL=webhook-queue.js.map