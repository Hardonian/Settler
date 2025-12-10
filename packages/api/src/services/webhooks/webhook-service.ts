/**
 * Webhook Service
 * 
 * Enhanced webhook delivery system for Phase II
 * Supports HMAC signing, retry logic, and event filtering
 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - PrismaClient is generated at build time
import { PrismaClient, Prisma } from '@prisma/client';
import crypto from 'crypto';
import { logError, logInfo } from '../../utils/logger';

export interface WebhookEvent {
  id: string;
  type: string;
  tenantId: string;
  data: Record<string, unknown>;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface WebhookDelivery {
  webhookId: string;
  url: string;
  event: WebhookEvent;
  secret: string;
  attempts?: number;
  timeout?: number;
}

export class WebhookService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  generateSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Deliver webhook event
   */
  async deliverWebhook(delivery: WebhookDelivery): Promise<boolean> {
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
      const timeoutId = setTimeout(
        () => controller.abort(),
        delivery.timeout || 30000
      );

      const response = await fetch(delivery.url, {
        method: 'POST',
        headers,
        body: payload,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Log delivery
      // TODO: WebhookDelivery model doesn't exist in Prisma schema - needs to be added
      // For now, we'll just log the delivery without persisting
      logInfo('Webhook delivered', {
        webhookId: delivery.webhookId,
        url: delivery.url,
        status: response.ok ? 'delivered' : 'failed',
        statusCode: response.status,
      });
      const responseBody = await response.text().catch(() => null);
          attempts: delivery.attempts || 1,
          deliveredAt: response.ok ? new Date() : null,
        },
      });

      if (!response.ok) {
        logError('Webhook delivery failed', {
          webhookId: delivery.webhookId,
          status: response.status,
          url: delivery.url,
        });
        return false;
      }

      logInfo('Webhook delivered successfully', {
        webhookId: delivery.webhookId,
        eventType: delivery.event.type,
      });

      return true;
    } catch (error) {
      // Log failed delivery
      // TODO: WebhookDelivery model doesn't exist in Prisma schema
      logError('Webhook delivery failed', {
        webhookId: delivery.webhookId,
        url: delivery.url,
        error,
      });
          statusCode: null,
          responseBody: error instanceof Error ? error.message : 'Unknown error',
          attempts: delivery.attempts || 1,
        },
      });

      logError('Webhook delivery error', {
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
  async queueWebhook(
    tenantId: string,
    eventType: string,
    eventData: Record<string, unknown>
  ): Promise<void> {
    // Get all active webhooks for this tenant that subscribe to this event type
    // TODO: Webhook model doesn't exist in Prisma schema - needs to be added
    // For now, return empty array (webhooks won't be delivered until schema is updated)
    const webhooks: Array<{ id: string; url: string; secret: string; events: string[] }> = [];
    logInfo('Webhook trigger (no webhooks configured - schema needs webhook models)', { tenantId, eventType });

    const event: WebhookEvent = {
      id: crypto.randomUUID(),
      type: eventType,
      tenantId,
      data: eventData,
      timestamp: new Date(),
    };

    // Queue delivery for each webhook
    for (const webhook of webhooks) {
      const delivery: WebhookDelivery = {
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
  private async scheduleRetry(delivery: WebhookDelivery): Promise<void> {
    const maxAttempts = 5;
    const attempt = (delivery.attempts || 1) + 1;

    if (attempt > maxAttempts) {
      logError('Webhook max retries exceeded', {
        webhookId: delivery.webhookId,
        eventType: delivery.event.type,
      });
      return;
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    const delayMs = Math.pow(2, attempt - 1) * 1000;
    const nextRetryAt = new Date(Date.now() + delayMs);

    // Update webhook delivery record
    // TODO: WebhookDelivery model doesn't exist in Prisma schema
    logInfo('Webhook retry scheduled', {
      webhookId: delivery.webhookId,
      attempt,
      nextRetryAt,
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
  async createWebhook(
    tenantId: string,
    userId: string,
    url: string,
    events: string[],
    secret?: string
  ) {
    const webhookSecret = secret || crypto.randomBytes(32).toString('hex');

    // TODO: Webhook model doesn't exist in Prisma schema - needs to be added
    // For now, return a stub object
    const webhook = {
      id: crypto.randomUUID(),
      userId,
      tenantId,
      url,
      events,
      secret: webhookSecret,
      status: 'active' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    logInfo('Webhook created (not persisted - schema needs webhook model)', { webhookId: webhook.id });
    return webhook;
  }

  /**
   * List webhooks for tenant
   */
  async listWebhooks(tenantId: string) {
    // TODO: Webhook model doesn't exist in Prisma schema
    return [] as Array<{ id: string; url: string; events: string[]; createdAt: Date }>;
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(webhookId: string, tenantId: string) {
    // TODO: Webhook model doesn't exist in Prisma schema
    logInfo('Webhook delete (not persisted - schema needs webhook model)', { webhookId, tenantId });
      data: {
        status: 'inactive',
      },
    });
  }
}
