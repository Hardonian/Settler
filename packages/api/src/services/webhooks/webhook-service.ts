/**
 * Webhook Service
 *
 * Enhanced webhook delivery system for Phase II
 * Supports HMAC signing, retry logic, event filtering, idempotency, and replay guarantees
 */

import { PrismaClient, Prisma } from "@prisma/client";
import crypto from "crypto";
import { logError, logInfo, logWarn } from "../../utils/logger";

/**
 * Standard webhook event payload structure
 */
export interface WebhookEventPayload {
  id: string;
  type: string;
  tenantId: string;
  data: Record<string, unknown>;
  timestamp: Date;
  idempotencyKey?: string;
  metadata?: {
    originalDeliveryId?: string;
    isReplay?: boolean;
    replayCount?: number;
    [key: string]: unknown;
  };
}

/**
 * Legacy WebhookEvent interface for backward compatibility
 * @deprecated Use WebhookEventPayload instead
 */
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
  event: WebhookEventPayload;
  secret: string;
  attempts?: number;
  timeout?: number;
  idempotencyKey?: string;
}

/**
 * Idempotency check result
 */
interface IdempotencyCheck {
  shouldProcess: boolean;
  existingDelivery?: {
    id: string;
    status: string;
    createdAt: Date;
  };
}

/**
 * Replay result
 */
interface ReplayResult {
  success: boolean;
  deliveryId: string;
  message: string;
  wasDuplicate: boolean;
}

/**
 * Idempotency window in milliseconds (24 hours)
 */
const IDEMPOTENCY_WINDOW_MS = 24 * 60 * 60 * 1000;

export class WebhookService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  generateSignature(payload: string, secret: string): string {
    return crypto.createHmac("sha256", secret).update(payload).digest("hex");
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }

  /**
   * Check idempotency key status
   * Returns whether the request should be processed and any existing delivery
   */
  private async checkIdempotency(
    idempotencyKey: string,
    webhookId: string
  ): Promise<IdempotencyCheck> {
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
  private async storeIdempotencyKey(
    idempotencyKey: string,
    status: "pending" | "completed" | "failed" = "pending",
    response?: unknown
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + IDEMPOTENCY_WINDOW_MS);

    await this.prisma.idempotencyKey.upsert({
      where: { key: idempotencyKey },
      create: {
        key: idempotencyKey,
        status,
        response: response ? (response as Prisma.InputJsonValue) : Prisma.JsonNull,
        expiresAt,
        completedAt: status === "completed" ? new Date() : null,
      },
      update: {
        status,
        response: response ? (response as Prisma.InputJsonValue) : Prisma.JsonNull,
        completedAt: status === "completed" ? new Date() : null,
        expiresAt,
      },
    });
  }

  /**
   * Deliver webhook event with idempotency support
   */
  async deliverWebhook(
    delivery: WebhookDelivery,
    options?: { skipIdempotencyCheck?: boolean }
  ): Promise<boolean> {
    const {
      idempotencyKey,
      event,
      webhookId,
      url,
      secret,
      attempts = 1,
      timeout = 30000,
    } = delivery;

    // Check idempotency if key provided and not skipping
    if (idempotencyKey && !options?.skipIdempotencyCheck) {
      const idempotencyCheck = await this.checkIdempotency(idempotencyKey, webhookId);

      if (!idempotencyCheck.shouldProcess) {
        logInfo("Skipping duplicate webhook delivery", {
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

    const headers: Record<string, string> = {
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
          payload: event as unknown as Prisma.InputJsonValue,
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
          } as Prisma.InputJsonValue,
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
        logError("Webhook delivery failed", {
          webhookId,
          status: response.status,
          url,
          idempotencyKey,
        });
        return false;
      }

      logInfo("Webhook delivered successfully", {
        webhookId,
        eventType: event.type,
        idempotencyKey,
        deliveryId: deliveryRecord.id,
        isReplay: event.metadata?.isReplay,
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Log failed delivery
      const failedDelivery = await this.prisma.webhookDelivery.create({
        data: {
          webhookId,
          url,
          payload: event as unknown as Prisma.InputJsonValue,
          status: "failed",
          statusCode: null,
          responseBody: errorMessage,
          attempts,
          errorMessage,
          metadata: {
            idempotencyKey: idempotencyKey || null,
            isReplay: event.metadata?.isReplay || false,
            replayCount: event.metadata?.replayCount || 0,
          } as Prisma.InputJsonValue,
        },
      });

      // Update idempotency key as failed
      if (idempotencyKey) {
        await this.storeIdempotencyKey(idempotencyKey, "failed", {
          deliveryId: failedDelivery.id,
          error: errorMessage,
        });
      }

      logError("Webhook delivery failed", {
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
  async queueWebhook(
    tenantId: string,
    eventType: string,
    eventData: Record<string, unknown>,
    options?: {
      idempotencyKey?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    // Get all active webhooks for this tenant
    const webhooks = await this.prisma.webhook.findMany({
      where: {
        tenantId,
        status: "active",
        deletedAt: null,
      },
    });

    // Filter webhooks that subscribe to this event type
    const subscribedWebhooks = webhooks.filter((webhook: { events: unknown }) => {
      const events = webhook.events;
      if (Array.isArray(events)) {
        return events.includes(eventType);
      }
      return false;
    });

    // Generate idempotency key if not provided
    const idempotencyKey =
      options?.idempotencyKey || this.generateIdempotencyKey(tenantId, eventType, eventData);

    const event: WebhookEventPayload = {
      id: crypto.randomUUID(),
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
      const delivery: WebhookDelivery = {
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
  private generateIdempotencyKey(
    tenantId: string,
    eventType: string,
    eventData: Record<string, unknown>
  ): string {
    const dataHash = crypto
      .createHash("sha256")
      .update(JSON.stringify({ tenantId, eventType, data: eventData }))
      .digest("hex")
      .substring(0, 16);
    return `${tenantId}:${eventType}:${dataHash}`;
  }

  /**
   * Schedule webhook retry
   */
  private async scheduleRetry(delivery: WebhookDelivery): Promise<void> {
    const maxAttempts = 5;
    const attempt = (delivery.attempts || 1) + 1;

    if (attempt > maxAttempts) {
      logError("Webhook max retries exceeded", {
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
    await this.prisma.webhookDelivery.updateMany({
      where: {
        webhookId: delivery.webhookId,
        status: "failed",
        metadata: {
          path: ["idempotencyKey"],
          equals: delivery.idempotencyKey || null,
        },
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
   * Replay a webhook event by delivery ID
   *
   * Checks if the original event was already delivered successfully,
   * and if so, prevents duplicate delivery (idempotent replay).
   *
   * @param deliveryId - The ID of the delivery to replay
   * @param options - Optional configuration
   * @returns ReplayResult with success status and message
   */
  async replayWebhook(
    deliveryId: string,
    options?: {
      force?: boolean; // Force replay even if already delivered
      webhookId?: string; // Optional webhook ID filter
    }
  ): Promise<ReplayResult> {
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
    const metadata = originalDelivery.metadata as Record<string, unknown> | null;
    const originalIdempotencyKey = metadata?.idempotencyKey as string | undefined;

    // Check if event was already delivered successfully (unless forcing)
    if (!options?.force && originalDelivery.status === "delivered") {
      logWarn("Replay prevented: webhook already delivered successfully", {
        deliveryId,
        webhookId: originalDelivery.webhookId,
        idempotencyKey: originalIdempotencyKey,
      });

      return {
        success: true,
        deliveryId,
        message:
          "Event already delivered successfully, replay skipped (use force:true to override)",
        wasDuplicate: true,
      };
    }

    // Generate new idempotency key for replay
    const replayIdempotencyKey = originalIdempotencyKey
      ? `${originalIdempotencyKey}:replay:${Date.now()}`
      : `replay:${deliveryId}:${Date.now()}`;

    // Get replay count from metadata
    const replayCount = (metadata?.replayCount as number) || 0;

    // Create replay event
    const payload = originalDelivery.payload as WebhookEventPayload;
    const replayEvent: WebhookEventPayload = {
      ...payload,
      id: crypto.randomUUID(), // New event ID for replay
      timestamp: new Date(),
      idempotencyKey: replayIdempotencyKey,
      metadata: {
        ...payload.metadata,
        originalDeliveryId: deliveryId,
        isReplay: true,
        replayCount: replayCount + 1,
      },
    };

    const delivery: WebhookDelivery = {
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
      logInfo("Webhook replay successful", {
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
    } else {
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
  async batchReplayWebhooks(
    deliveryIds: string[],
    options?: {
      force?: boolean;
      webhookId?: string;
    }
  ): Promise<ReplayResult[]> {
    const results: ReplayResult[] = [];

    for (const deliveryId of deliveryIds) {
      try {
        const result = await this.replayWebhook(deliveryId, options);
        results.push(result);
      } catch (error) {
        logError("Batch replay error", { deliveryId, error });
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
  async getDeliveryByIdempotencyKey(idempotencyKey: string): Promise<{
    id: string;
    status: string;
    createdAt: Date;
    webhookId: string;
    url: string;
    statusCode: number | null;
  } | null> {
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
  async createWebhook(
    tenantId: string,
    userId: string,
    url: string,
    events: string[],
    secret?: string
  ) {
    const webhookSecret = secret || crypto.randomBytes(32).toString("hex");

    const webhook = await this.prisma.webhook.create({
      data: {
        userId,
        tenantId,
        url,
        events: events as Prisma.InputJsonValue,
        secret: webhookSecret,
        status: "active",
      },
    });

    return webhook;
  }

  /**
   * List webhooks for tenant
   */
  async listWebhooks(tenantId: string) {
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
  async deleteWebhook(webhookId: string, tenantId: string) {
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
  async getWebhookDeliveryHistory(
    webhookId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: "delivered" | "failed" | "pending";
    }
  ) {
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
