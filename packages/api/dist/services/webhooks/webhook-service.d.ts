/**
 * Webhook Service
 *
 * Enhanced webhook delivery system for Phase II
 * Supports HMAC signing, retry logic, and event filtering
 */
import { PrismaClient, Prisma } from '@prisma/client';
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
export declare class WebhookService {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Generate HMAC signature for webhook payload
     */
    generateSignature(payload: string, secret: string): string;
    /**
     * Verify webhook signature
     */
    verifySignature(payload: string, signature: string, secret: string): boolean;
    /**
     * Deliver webhook event
     */
    deliverWebhook(delivery: WebhookDelivery): Promise<boolean>;
    /**
     * Queue webhook for delivery with retry logic
     */
    queueWebhook(tenantId: string, eventType: string, eventData: Record<string, unknown>): Promise<void>;
    /**
     * Schedule webhook retry
     */
    private scheduleRetry;
    /**
     * Create webhook subscription
     */
    createWebhook(tenantId: string, userId: string, url: string, events: string[], secret?: string): Promise<{
        secret: string;
        status: string;
        id: string;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        metadata: Prisma.JsonValue;
        deletedAt: Date | null;
        tenantId: string;
        events: Prisma.JsonValue;
        url: string;
    }>;
    /**
     * List webhooks for tenant
     */
    listWebhooks(tenantId: string): Promise<{
        secret: string;
        status: string;
        id: string;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        metadata: Prisma.JsonValue;
        deletedAt: Date | null;
        tenantId: string;
        events: Prisma.JsonValue;
        url: string;
    }[]>;
    /**
     * Delete webhook
     */
    deleteWebhook(webhookId: string, tenantId: string): Promise<void>;
}
//# sourceMappingURL=webhook-service.d.ts.map