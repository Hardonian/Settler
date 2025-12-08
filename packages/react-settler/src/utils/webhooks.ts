/**
 * Webhook Integration Utilities
 * Helpers for integrating React.Settler with webhook systems
 */

// Webhook utilities - imports removed as unused
import { sanitizeString, generateSecureId } from '@settler/protocol';

export interface WebhookPayload {
  id: string;
  event: string;
  timestamp: string;
  data: unknown;
  signature?: string;
}

export interface WebhookHandler {
  (payload: WebhookPayload): Promise<void> | void;
}

/**
 * Webhook Event Types
 */
export type ReconciliationWebhookEvent =
  | 'transaction.created'
  | 'transaction.updated'
  | 'settlement.created'
  | 'settlement.updated'
  | 'exception.created'
  | 'exception.resolved'
  | 'reconciliation.completed'
  | 'reconciliation.failed';

import { requireFeature, FEATURE_FLAGS } from '../utils/licensing';

/**
 * Webhook Manager
 * Manages webhook subscriptions and handlers
 * 
 * ⚠️ Commercial Feature: Requires Settler Commercial subscription
 */
export class WebhookManager {
  private handlers: Map<ReconciliationWebhookEvent, WebhookHandler[]> = new Map();
  private secret: string;

  constructor(secret?: string) {
    requireFeature(FEATURE_FLAGS.WEBHOOK_MANAGER, 'Webhook Manager');
    this.secret = secret || generateSecureId('webhook');
  }

  /**
   * Subscribe to a webhook event
   */
  on(event: ReconciliationWebhookEvent, handler: WebhookHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler);

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
  async emit(event: ReconciliationWebhookEvent, data: unknown): Promise<void> {
    const handlers = this.handlers.get(event) || [];
    
    const payload: WebhookPayload = {
      id: generateSecureId('wh'),
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
  async verifySignature(payload: WebhookPayload, signature: string): Promise<boolean> {
    if (!this.secret) {
      return false;
    }

    const expectedSignature = await this.signPayload(payload);
    return signature === expectedSignature;
  }

  /**
   * Sanitize webhook data
   */
  private sanitizeData(data: unknown): unknown {
    if (typeof data === 'string') {
      return sanitizeString(data);
    }
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }
    if (data && typeof data === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[sanitizeString(key)] = this.sanitizeData(value);
      }
      return sanitized;
    }
    return data;
  }

  /**
   * Sign webhook payload
   */
  private async signPayload(payload: WebhookPayload): Promise<string> {
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

/**
 * Create webhook manager instance
 */
export function createWebhookManager(secret?: string): WebhookManager {
  return new WebhookManager(secret);
}

/**
 * Shopify Webhook Adapter
 */
export function createShopifyWebhookAdapter(webhookSecret: string) {
  const manager = createWebhookManager(webhookSecret);

  return {
    handleShopifyWebhook: async (shopifyPayload: {
      id: string;
      event: string;
      data: unknown;
    }) => {
      // Map Shopify events to reconciliation events
      const eventMap: Record<string, ReconciliationWebhookEvent> = {
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
export function createStripeWebhookAdapter(webhookSecret: string) {
  const manager = createWebhookManager(webhookSecret);

  return {
    handleStripeWebhook: async (stripePayload: {
      id: string;
      type: string;
      data: { object: unknown };
    }) => {
      // Map Stripe events to reconciliation events
      const eventMap: Record<string, ReconciliationWebhookEvent> = {
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
