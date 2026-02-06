"use strict";
/**
 * Webhook Service
 *
 * Enhanced webhook delivery system for Phase II
 * Supports HMAC signing, retry logic, event filtering, idempotency, and replay guarantees
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookService = void 0;
const client_1 = require("@prisma/client");
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../../utils/logger");
/**
 * Idempotency window in milliseconds (24 hours)
 */
const IDEMPOTENCY_WINDOW_MS = 24 * 60 * 60 * 1000;
class WebhookService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Generate HMAC signature for webhook payload
     */
    generateSignature(payload, secret) {
        return crypto_1.default.createHmac("sha256", secret).update(payload).digest("hex");
    }
    /**
     * Verify webhook signature
     */
    verifySignature(payload, signature, secret) {
        const expectedSignature = this.generateSignature(payload, secret);
        return crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    }
    /**
     * Check idempotency key status
     * Returns whether the request should be processed and any existing delivery
     */
    async checkIdempotency(idempotencyKey, webhookId) {
        const existing = await this.prisma.idempotencyKey.findUnique({
            where: { key: idempotencyKey },
        });
        if (!existing) {
            return { shouldProcess: true };
        }
        // Check if expired
        if (existing.expiresAt < new Date()) {
            return { shouldProcess: true };
        }
        // Find existing delivery for this webhook + idempotency key
        const existingDelivery = await this.prisma.webhookDelivery.findFirst({
            where: {
                webhookId,
                metadata: {
                    path: ["idempotencyKey"],
                    equals: idempotencyKey,
                },
                createdAt: {
                    gte: new Date(Date.now() - IDEMPOTENCY_WINDOW_MS),
                },
            },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                status: true,
                createdAt: true,
            },
        });
        if (existingDelivery?.status === "delivered") {
            return {
                shouldProcess: false,
                existingDelivery: existingDelivery,
            };
        }
        // If previous attempt failed, allow retry
        return { shouldProcess: true, existingDelivery: existingDelivery || undefined };
    }
    /**
     * Store idempotency key for a webhook delivery
     */
    async storeIdempotencyKey(idempotencyKey, status = "pending", response) {
        const expiresAt = new Date(Date.now() + IDEMPOTENCY_WINDOW_MS);
        await this.prisma.idempotencyKey.upsert({
            where: { key: idempotencyKey },
            create: {
                key: idempotencyKey,
                status,
                response: response ? response : client_1.Prisma.JsonNull,
                expiresAt,
                completedAt: status === "completed" ? new Date() : null,
            },
            update: {
                status,
                response: response ? response : client_1.Prisma.JsonNull,
                completedAt: status === "completed" ? new Date() : null,
                expiresAt,
            },
        });
    }
    /**
     * Deliver webhook event with idempotency support
     */
    async deliverWebhook(delivery, options) {
        const { idempotencyKey, event, webhookId, url, secret, attempts = 1, timeout = 30000, } = delivery;
        // Check idempotency if key provided and not skipping
        if (idempotencyKey && !options?.skipIdempotencyCheck) {
            const idempotencyCheck = await this.checkIdempotency(idempotencyKey, webhookId);
            if (!idempotencyCheck.shouldProcess) {
                (0, logger_1.logInfo)("Skipping duplicate webhook delivery", {
                    webhookId,
                    idempotencyKey,
                    existingDeliveryId: idempotencyCheck.existingDelivery?.id,
                });
                return true; // Return success to prevent retries
            }
        }
        // Store idempotency key as pending
        if (idempotencyKey) {
            await this.storeIdempotencyKey(idempotencyKey, "pending");
        }
        const payload = JSON.stringify(event);
        const signature = this.generateSignature(payload, secret);
        const timestamp = Date.now();
        const headers = {
            "Content-Type": "application/json",
            "X-Settler-Signature": signature,
            "X-Settler-Timestamp": timestamp.toString(),
            "X-Settler-Event-Type": event.type,
            "X-Settler-Event-ID": event.id,
        };
        // Add idempotency header if present
        if (idempotencyKey) {
            headers["X-Idempotency-Key"] = idempotencyKey;
        }
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            const response = await fetch(url, {
                method: "POST",
                headers,
                body: payload,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            const responseBody = await response.text().catch(() => null);
            const isSuccess = response.ok;
            // Log delivery with idempotency metadata
            const deliveryRecord = await this.prisma.webhookDelivery.create({
                data: {
                    webhookId,
                    url,
                    payload: event,
                    status: isSuccess ? "delivered" : "failed",
                    statusCode: response.status,
                    responseBody,
                    attempts,
                    metadata: {
                        idempotencyKey: idempotencyKey || null,
                        isReplay: event.metadata?.isReplay || false,
                        replayCount: event.metadata?.replayCount || 0,
                        signature,
                        timestamp,
                    },
                },
            });
            // Update idempotency key status
            if (idempotencyKey) {
                await this.storeIdempotencyKey(idempotencyKey, isSuccess ? "completed" : "failed", {
                    deliveryId: deliveryRecord.id,
                    status: isSuccess ? "delivered" : "failed",
                });
            }
            if (!isSuccess) {
                (0, logger_1.logError)("Webhook delivery failed", {
                    webhookId,
                    status: response.status,
                    url,
                    idempotencyKey,
                });
                return false;
            }
            (0, logger_1.logInfo)("Webhook delivered successfully", {
                webhookId,
                eventType: event.type,
                idempotencyKey,
                deliveryId: deliveryRecord.id,
                isReplay: event.metadata?.isReplay,
            });
            return true;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            // Log failed delivery
            const failedDelivery = await this.prisma.webhookDelivery.create({
                data: {
                    webhookId,
                    url,
                    payload: event,
                    status: "failed",
                    statusCode: null,
                    responseBody: errorMessage,
                    attempts,
                    errorMessage,
                    metadata: {
                        idempotencyKey: idempotencyKey || client_1.Prisma.JsonNull,
                        isReplay: event.metadata?.isReplay || false,
                        replayCount: event.metadata?.replayCount || 0,
                    },
                },
            });
            // Update idempotency key as failed
            if (idempotencyKey) {
                await this.storeIdempotencyKey(idempotencyKey, "failed", {
                    deliveryId: failedDelivery.id,
                    error: errorMessage,
                });
            }
            (0, logger_1.logError)("Webhook delivery failed", {
                webhookId,
                url,
                idempotencyKey,
                error,
            });
            return false;
        }
    }
    /**
     * Queue webhook for delivery with retry logic and idempotency support
     *
     * @param tenantId - The tenant ID
     * @param eventType - Type of event being triggered
     * @param eventData - Event payload data
     * @param options - Optional configuration including idempotencyKey
     */
    async queueWebhook(tenantId, eventType, eventData, options) {
        // Get all active webhooks for this tenant
        const webhooks = await this.prisma.webhook.findMany({
            where: {
                tenantId,
                status: "active",
                deletedAt: null,
            },
        });
        // Filter webhooks that subscribe to this event type
        const subscribedWebhooks = webhooks.filter((webhook) => {
            const events = webhook.events;
            if (Array.isArray(events)) {
                return events.includes(eventType);
            }
            return false;
        });
        // Generate idempotency key if not provided
        const idempotencyKey = options?.idempotencyKey || this.generateIdempotencyKey(tenantId, eventType, eventData);
        const event = {
            id: crypto_1.default.randomUUID(),
            type: eventType,
            tenantId,
            data: eventData,
            timestamp: new Date(),
            idempotencyKey,
            metadata: {
                ...options?.metadata,
                isReplay: false,
                replayCount: 0,
            },
        };
        // Queue delivery for each webhook
        for (const webhook of subscribedWebhooks) {
            const delivery = {
                webhookId: webhook.id,
                url: webhook.url,
                event,
                secret: webhook.secret,
                attempts: 1,
                idempotencyKey,
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
     * Generate a deterministic idempotency key from event data
     */
    generateIdempotencyKey(tenantId, eventType, eventData) {
        const dataHash = crypto_1.default
            .createHash("sha256")
            .update(JSON.stringify({ tenantId, eventType, data: eventData }))
            .digest("hex")
            .substring(0, 16);
        return `${tenantId}:${eventType}:${dataHash}`;
    }
    /**
     * Schedule webhook retry
     */
    async scheduleRetry(delivery) {
        const maxAttempts = 5;
        const attempt = (delivery.attempts || 1) + 1;
        if (attempt > maxAttempts) {
            (0, logger_1.logError)("Webhook max retries exceeded", {
                webhookId: delivery.webhookId,
                eventType: delivery.event.type,
                idempotencyKey: delivery.idempotencyKey,
            });
            return;
        }
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
        const delayMs = Math.pow(2, attempt - 1) * 1000;
        const nextRetryAt = new Date(Date.now() + delayMs);
        // Update webhook delivery record
        if (delivery.idempotencyKey) {
            await this.prisma.webhookDelivery.updateMany({
                where: {
                    webhookId: delivery.webhookId,
                    status: "failed",
                    metadata: {
                        path: ["idempotencyKey"],
                        equals: delivery.idempotencyKey,
                    },
                },
                data: {
                    attempts: attempt,
                    nextRetryAt,
                },
            });
        }
        else {
            // For deliveries without idempotency keys, use simpler where clause
            await this.prisma.webhookDelivery.updateMany({
                where: {
                    webhookId: delivery.webhookId,
                    status: "failed",
                },
                data: {
                    attempts: attempt,
                    nextRetryAt,
                },
            });
        }
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
     * Replay a webhook event by delivery ID
     *
     * Checks if the original event was already delivered successfully,
     * and if so, prevents duplicate delivery (idempotent replay).
     *
     * @param deliveryId - The ID of the delivery to replay
     * @param options - Optional configuration
     * @returns ReplayResult with success status and message
     */
    async replayWebhook(deliveryId, options) {
        // Find the original delivery
        const originalDelivery = await this.prisma.webhookDelivery.findUnique({
            where: { id: deliveryId },
            include: { webhook: true },
        });
        if (!originalDelivery) {
            return {
                success: false,
                deliveryId,
                message: "Original delivery not found",
                wasDuplicate: false,
            };
        }
        // Check if webhook is still active
        if (originalDelivery.webhook.status !== "active") {
            return {
                success: false,
                deliveryId,
                message: "Webhook is not active",
                wasDuplicate: false,
            };
        }
        // Filter by webhookId if specified
        if (options?.webhookId && originalDelivery.webhookId !== options.webhookId) {
            return {
                success: false,
                deliveryId,
                message: "Delivery does not belong to specified webhook",
                wasDuplicate: false,
            };
        }
        // Extract idempotency key from metadata
        const metadata = originalDelivery.metadata;
        const originalIdempotencyKey = metadata?.idempotencyKey;
        // Check if event was already delivered successfully (unless forcing)
        if (!options?.force && originalDelivery.status === "delivered") {
            (0, logger_1.logWarn)("Replay prevented: webhook already delivered successfully", {
                deliveryId,
                webhookId: originalDelivery.webhookId,
                idempotencyKey: originalIdempotencyKey,
            });
            return {
                success: true,
                deliveryId,
                message: "Event already delivered successfully, replay skipped (use force:true to override)",
                wasDuplicate: true,
            };
        }
        // Generate new idempotency key for replay
        const replayIdempotencyKey = originalIdempotencyKey
            ? `${originalIdempotencyKey}:replay:${Date.now()}`
            : `replay:${deliveryId}:${Date.now()}`;
        // Get replay count from metadata
        const replayCount = metadata?.replayCount || 0;
        // Create replay event
        const payload = originalDelivery.payload;
        const replayEvent = {
            ...payload,
            id: crypto_1.default.randomUUID(), // New event ID for replay
            timestamp: new Date(),
            idempotencyKey: replayIdempotencyKey,
            metadata: {
                ...payload.metadata,
                originalDeliveryId: deliveryId,
                isReplay: true,
                replayCount: replayCount + 1,
            },
        };
        const delivery = {
            webhookId: originalDelivery.webhookId,
            url: originalDelivery.url,
            event: replayEvent,
            secret: originalDelivery.webhook.secret,
            attempts: 1,
            idempotencyKey: replayIdempotencyKey,
        };
        // Attempt delivery (skip idempotency check for replay)
        const success = await this.deliverWebhook(delivery, { skipIdempotencyCheck: true });
        if (success) {
            (0, logger_1.logInfo)("Webhook replay successful", {
                deliveryId,
                webhookId: originalDelivery.webhookId,
                replayIdempotencyKey,
                replayCount: replayCount + 1,
            });
            return {
                success: true,
                deliveryId,
                message: "Webhook replay delivered successfully",
                wasDuplicate: false,
            };
        }
        else {
            // Schedule retry for failed replay
            await this.scheduleRetry(delivery);
            return {
                success: false,
                deliveryId,
                message: "Webhook replay failed, scheduled for retry",
                wasDuplicate: false,
            };
        }
    }
    /**
     * Batch replay multiple webhook deliveries
     *
     * @param deliveryIds - Array of delivery IDs to replay
     * @param options - Optional configuration
     * @returns Array of ReplayResult for each delivery
     */
    async batchReplayWebhooks(deliveryIds, options) {
        const results = [];
        for (const deliveryId of deliveryIds) {
            try {
                const result = await this.replayWebhook(deliveryId, options);
                results.push(result);
            }
            catch (error) {
                (0, logger_1.logError)("Batch replay error", { deliveryId, error });
                results.push({
                    success: false,
                    deliveryId,
                    message: error instanceof Error ? error.message : "Unknown error",
                    wasDuplicate: false,
                });
            }
        }
        return results;
    }
    /**
     * Get delivery status by idempotency key
     *
     * @param idempotencyKey - The idempotency key to check
     * @returns Delivery information if found
     */
    async getDeliveryByIdempotencyKey(idempotencyKey) {
        const idempotencyRecord = await this.prisma.idempotencyKey.findUnique({
            where: { key: idempotencyKey },
        });
        if (!idempotencyRecord) {
            return null;
        }
        const delivery = await this.prisma.webhookDelivery.findFirst({
            where: {
                metadata: {
                    path: ["idempotencyKey"],
                    equals: idempotencyKey,
                },
            },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                status: true,
                createdAt: true,
                webhookId: true,
                url: true,
                statusCode: true,
            },
        });
        return delivery;
    }
    /**
     * Create webhook subscription
     */
    async createWebhook(tenantId, userId, url, events, secret) {
        const webhookSecret = secret || crypto_1.default.randomBytes(32).toString("hex");
        const webhook = await this.prisma.webhook.create({
            data: {
                userId,
                tenantId,
                url,
                events: events,
                secret: webhookSecret,
                status: "active",
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
                status: "active",
                deletedAt: null,
            },
            orderBy: {
                createdAt: "desc",
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
                status: "deleted",
                deletedAt: new Date(),
            },
        });
    }
    /**
     * Get delivery history for a webhook
     */
    async getWebhookDeliveryHistory(webhookId, options) {
        return this.prisma.webhookDelivery.findMany({
            where: {
                webhookId,
                ...(options?.status && { status: options.status }),
            },
            orderBy: { createdAt: "desc" },
            take: options?.limit || 50,
            skip: options?.offset || 0,
        });
    }
}
exports.WebhookService = WebhookService;
//# sourceMappingURL=webhook-service.js.map