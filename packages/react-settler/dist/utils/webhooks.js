"use strict";
/**
 * Webhook Integration Utilities
 * Helpers for integrating React.Settler with webhook systems
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookManager = void 0;
exports.createWebhookManager = createWebhookManager;
exports.createShopifyWebhookAdapter = createShopifyWebhookAdapter;
exports.createStripeWebhookAdapter = createStripeWebhookAdapter;
// Webhook utilities - imports removed as unused
const protocol_1 = require("@settler/protocol");
const licensing_1 = require("../utils/licensing");
/**
 * Webhook Manager
 * Manages webhook subscriptions and handlers
 *
 * ⚠️ Commercial Feature: Requires Settler Commercial subscription
 */
class WebhookManager {
    handlers = new Map();
    secret;
    constructor(secret) {
        (0, licensing_1.requireFeature)(licensing_1.FEATURE_FLAGS.WEBHOOK_MANAGER, 'Webhook Manager');
        this.secret = secret || (0, protocol_1.generateSecureId)('webhook');
    }
    /**
     * Subscribe to a webhook event
     */
    on(event, handler) {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, []);
        }
        this.handlers.get(event).push(handler);
        // Return unsubscribe function
        return () => {
            const handlers = this.handlers.get(event);
            if (handlers) {
                const index = handlers.indexOf(handler);
                if (index > -1) {
                    handlers.splice(index, 1);
                }
            }
        };
    }
    /**
     * Emit a webhook event
     */
    async emit(event, data) {
        const handlers = this.handlers.get(event) || [];
        const payload = {
            id: (0, protocol_1.generateSecureId)('wh'),
            event,
            timestamp: new Date().toISOString(),
            data: this.sanitizeData(data)
        };
        // Add signature if secret is set
        if (this.secret) {
            payload.signature = await this.signPayload(payload);
        }
        // Call all handlers
        await Promise.all(handlers.map(handler => handler(payload)));
    }
    /**
     * Verify webhook signature
     */
    async verifySignature(payload, signature) {
        if (!this.secret) {
            return false;
        }
        const expectedSignature = await this.signPayload(payload);
        return signature === expectedSignature;
    }
    /**
     * Sanitize webhook data
     */
    sanitizeData(data) {
        if (typeof data === 'string') {
            return (0, protocol_1.sanitizeString)(data);
        }
        if (Array.isArray(data)) {
            return data.map(item => this.sanitizeData(item));
        }
        if (data && typeof data === 'object') {
            const sanitized = {};
            for (const [key, value] of Object.entries(data)) {
                sanitized[(0, protocol_1.sanitizeString)(key)] = this.sanitizeData(value);
            }
            return sanitized;
        }
        return data;
    }
    /**
     * Sign webhook payload
     */
    async signPayload(payload) {
        // Simple HMAC-like signing (in production, use crypto.subtle)
        const message = `${payload.id}:${payload.event}:${payload.timestamp}`;
        const encoder = new TextEncoder();
        const data = encoder.encode(message + this.secret);
        if (typeof crypto !== 'undefined' && crypto.subtle) {
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }
        // Fallback for environments without crypto.subtle
        return btoa(message + this.secret).substring(0, 64);
    }
}
exports.WebhookManager = WebhookManager;
/**
 * Create webhook manager instance
 */
function createWebhookManager(secret) {
    return new WebhookManager(secret);
}
/**
 * Shopify Webhook Adapter
 */
function createShopifyWebhookAdapter(webhookSecret) {
    const manager = createWebhookManager(webhookSecret);
    return {
        handleShopifyWebhook: async (shopifyPayload) => {
            // Map Shopify events to reconciliation events
            const eventMap = {
                'orders/create': 'transaction.created',
                'orders/paid': 'transaction.updated',
                'payouts/create': 'settlement.created'
            };
            const reconciliationEvent = eventMap[shopifyPayload.event] || 'transaction.created';
            await manager.emit(reconciliationEvent, shopifyPayload.data);
        },
        manager
    };
}
/**
 * Stripe Webhook Adapter
 */
function createStripeWebhookAdapter(webhookSecret) {
    const manager = createWebhookManager(webhookSecret);
    return {
        handleStripeWebhook: async (stripePayload) => {
            // Map Stripe events to reconciliation events
            const eventMap = {
                'charge.succeeded': 'transaction.created',
                'charge.refunded': 'transaction.updated',
                'payout.paid': 'settlement.created'
            };
            const reconciliationEvent = eventMap[stripePayload.type] || 'transaction.created';
            await manager.emit(reconciliationEvent, stripePayload.data.object);
        },
        manager
    };
}
//# sourceMappingURL=webhooks.js.map