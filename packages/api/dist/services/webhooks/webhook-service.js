"use strict";
/**
 * Webhook Service
 *
 * Enhanced webhook delivery system for Phase II
 * Supports HMAC signing, retry logic, and event filtering
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../../utils/logger");
class WebhookService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Generate HMAC signature for webhook payload
     */
    generateSignature(payload, secret) {
        return crypto_1.default
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');
    }
    /**
     * Verify webhook signature
     */
    verifySignature(payload, signature, secret) {
        const expectedSignature = this.generateSignature(payload, secret);
        return crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    }
    /**
     * Deliver webhook event
     */
    async deliverWebhook(delivery) {
        const payload = JSON.stringify(delivery.event);
        const signature = this.generateSignature(payload, delivery.secret);
        const timestamp = Date.now();
        const headers = {
            'Content-Type': 'application/json',
            'X-Settler-Signature': signature,
            'X-Settler-Timestamp': timestamp.toString(),
            'X-Settler-Event-Type': delivery.event.type,
            'X-Settler-Event-ID': delivery.event.id,
        };
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), delivery.timeout || 30000);
            const response = await fetch(delivery.url, {
                method: 'POST',
                headers,
                body: payload,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            // Log delivery
            await this.prisma.webhookDelivery.create({
                data: {
                    webhookId: delivery.webhookId,
                    url: delivery.url,
                    payload: delivery.event,
                    status: response.ok ? 'delivered' : 'failed',
                    statusCode: response.status,
                    responseBody: await response.text().catch(() => null),
                    attempts: delivery.attempts || 1,
                    deliveredAt: response.ok ? new Date() : null,
                },
            });
            if (!response.ok) {
                (0, logger_1.logError)('Webhook delivery failed', {
                    webhookId: delivery.webhookId,
                    status: response.status,
                    url: delivery.url,
                });
                return false;
            }
            (0, logger_1.logInfo)('Webhook delivered successfully', {
                webhookId: delivery.webhookId,
                eventType: delivery.event.type,
            });
            return true;
        }
        catch (error) {
            // Log failed delivery
            await this.prisma.webhookDelivery.create({
                data: {
                    webhookId: delivery.webhookId,
                    url: delivery.url,
                    payload: delivery.event,
                    status: 'failed',
                    statusCode: null,
                    responseBody: error instanceof Error ? error.message : 'Unknown error',
                    attempts: delivery.attempts || 1,
                },
            });
            (0, logger_1.logError)('Webhook delivery error', {
                error,
                webhookId: delivery.webhookId,
                url: delivery.url,
            });
            return false;
        }
    }
    /**
     * Queue webhook for delivery with retry logic
     */
    async queueWebhook(tenantId, eventType, eventData) {
        // Get all active webhooks for this tenant that subscribe to this event type
        const webhooks = await this.prisma.webhook.findMany({
            where: {
                tenantId,
                status: 'active',
                events: {
                    has: eventType,
                },
            },
        });
        const event = {
            id: crypto_1.default.randomUUID(),
            type: eventType,
            tenantId,
            data: eventData,
            timestamp: new Date(),
        };
        // Queue delivery for each webhook
        for (const webhook of webhooks) {
            const delivery = {
                webhookId: webhook.id,
                url: webhook.url,
                event,
                secret: webhook.secret,
                attempts: 1,
            };
            // Attempt delivery
            const success = await this.deliverWebhook(delivery);
            // If failed, schedule retry
            if (!success) {
                await this.scheduleRetry(delivery);
            }
        }
    }
    /**
     * Schedule webhook retry
     */
    async scheduleRetry(delivery) {
        const maxAttempts = 5;
        const attempt = (delivery.attempts || 1) + 1;
        if (attempt > maxAttempts) {
            (0, logger_1.logError)('Webhook max retries exceeded', {
                webhookId: delivery.webhookId,
                eventType: delivery.event.type,
            });
            return;
        }
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
        const delayMs = Math.pow(2, attempt - 1) * 1000;
        const nextRetryAt = new Date(Date.now() + delayMs);
        // Update webhook delivery record
        await this.prisma.webhookDelivery.updateMany({
            where: {
                webhookId: delivery.webhookId,
                status: 'failed',
            },
            data: {
                attempts: attempt,
                nextRetryAt,
            },
        });
        // Schedule retry (in production, use a job queue)
        setTimeout(async () => {
            const success = await this.deliverWebhook({
                ...delivery,
                attempts: attempt,
            });
            if (!success) {
                await this.scheduleRetry({
                    ...delivery,
                    attempts: attempt,
                });
            }
        }, delayMs);
    }
    /**
     * Create webhook subscription
     */
    async createWebhook(tenantId, userId, url, events, secret) {
        const webhookSecret = secret || crypto_1.default.randomBytes(32).toString('hex');
        const webhook = await this.prisma.webhook.create({
            data: {
                userId,
                tenantId,
                url,
                events,
                secret: webhookSecret,
                status: 'active',
            },
        });
        return webhook;
    }
    /**
     * List webhooks for tenant
     */
    async listWebhooks(tenantId) {
        return this.prisma.webhook.findMany({
            where: {
                tenantId,
                status: 'active',
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    /**
     * Delete webhook
     */
    async deleteWebhook(webhookId, tenantId) {
        await this.prisma.webhook.updateMany({
            where: {
                id: webhookId,
                tenantId,
            },
            data: {
                status: 'inactive',
            },
        });
    }
}
exports.WebhookService = WebhookService;
//# sourceMappingURL=webhook-service.js.map