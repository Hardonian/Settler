/**
 * Webhook Management
 *
 * Self-service webhook configuration and management.
 */

import { prisma } from "@/shared/db/prismaClient";
import crypto from "crypto";
import { validateWebhookUrl } from "../validation/api-validation";

export interface Webhook {
  id: string;
  userId: string;
  tenantId: string;
  url: string;
  events: string[];
  secret: string;
  status: string; // active, inactive, deleted
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface CreateWebhookInput {
  url: string;
  events: string[];
  secret?: string;
}

function requireTenantScope(tenantId: string): string {
  if (typeof tenantId !== "string" || tenantId.trim() === "") {
    throw new Error("Tenant context is required for webhook operations");
  }

  return tenantId;
}

/**
 * Generate webhook secret
 */
function generateWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(32).toString("base64url")}`;
}

/**
 * Create a new webhook
 */
export async function createWebhook(
  userId: string,
  tenantId: string,
  input: CreateWebhookInput
): Promise<Webhook> {
  const scopedTenantId = requireTenantScope(tenantId);

  // Validate URL format and SSRF safety
  const validation = validateWebhookUrl(input.url);
  if (!validation.valid) {
    throw new Error(validation.error || "Invalid webhook URL");
  }

  // Validate URL length
  if (input.url.length > 2048) {
    throw new Error("Webhook URL is too long (max 2048 characters)");
  }

  // Validate events
  const validEvents = [
    "reconciliation.completed",
    "reconciliation.failed",
    "receipt.parsed",
    "receipt.failed",
    "feature_flag.updated",
    "usage.limit_exceeded",
    "billing.subscription_updated",
  ];

  // Validate events array
  if (!Array.isArray(input.events)) {
    throw new Error("Events must be an array");
  }

  if (input.events.length === 0) {
    throw new Error("At least one event must be specified");
  }

  if (input.events.length > 20) {
    throw new Error("Maximum 20 events allowed per webhook");
  }

  // Validate each event
  const invalidEvents = input.events.filter((e) => {
    if (typeof e !== "string") return true;
    return !validEvents.includes(e);
  });

  if (invalidEvents.length > 0) {
    throw new Error(
      `Invalid events: ${invalidEvents.join(", ")}. Valid events: ${validEvents.join(", ")}`
    );
  }

  const secret = input.secret || generateWebhookSecret();

  const webhook = await prisma.webhook.create({
    data: {
      userId,
      tenantId: scopedTenantId,
      url: input.url,
      events: input.events,
      secret,
      status: "active",
    },
  });

  return {
    id: webhook.id,
    userId: webhook.userId,
    tenantId: webhook.tenantId,
    url: webhook.url,
    events: webhook.events as string[],
    secret: webhook.secret,
    status: webhook.status,
    createdAt: webhook.createdAt,
    updatedAt: webhook.updatedAt,
    deletedAt: webhook.deletedAt,
  };
}

/**
 * List webhooks for a user/tenant
 */
export async function listWebhooks(userId: string, tenantId: string): Promise<Webhook[]> {
  const scopedTenantId = requireTenantScope(tenantId);
  const webhooks = await prisma.webhook.findMany({
    where: {
      userId,
      tenantId: scopedTenantId,
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  return webhooks.map((w: (typeof webhooks)[0]) => ({
    id: w.id,
    userId: w.userId,
    tenantId: w.tenantId,
    url: w.url,
    events: w.events as string[],
    secret: w.secret,
    status: w.status,
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
    deletedAt: w.deletedAt,
  }));
}

/**
 * Update webhook
 */
export async function updateWebhook(
  webhookId: string,
  userId: string,
  tenantId: string,
  updates: Partial<Pick<Webhook, "url" | "events" | "status">>
): Promise<Webhook> {
  const scopedTenantId = requireTenantScope(tenantId);
  const existing = await prisma.webhook.findFirst({
    where: {
      id: webhookId,
      userId,
      tenantId: scopedTenantId,
      deletedAt: null,
    },
  });

  if (!existing) {
    throw new Error("Webhook not found");
  }

  // Validate URL if provided
  if (updates.url) {
    try {
      new URL(updates.url);
    } catch {
      throw new Error("Invalid webhook URL");
    }
  }

  const webhook = await prisma.webhook.update({
    where: { id: webhookId },
    data: {
      ...(updates.url && { url: updates.url }),
      ...(updates.events && { events: updates.events }),
      ...(updates.status && { status: updates.status }),
    },
  });

  return {
    id: webhook.id,
    userId: webhook.userId,
    tenantId: webhook.tenantId,
    url: webhook.url,
    events: webhook.events as string[],
    secret: webhook.secret,
    status: webhook.status,
    createdAt: webhook.createdAt,
    updatedAt: webhook.updatedAt,
    deletedAt: webhook.deletedAt,
  };
}

/**
 * Delete webhook (soft delete)
 */
export async function deleteWebhook(
  webhookId: string,
  userId: string,
  tenantId: string
): Promise<void> {
  const scopedTenantId = requireTenantScope(tenantId);
  const existing = await prisma.webhook.findFirst({
    where: {
      id: webhookId,
      userId,
      tenantId: scopedTenantId,
      deletedAt: null,
    },
  });

  if (!existing) {
    throw new Error("Webhook not found");
  }

  await prisma.webhook.update({
    where: { id: webhookId },
    data: {
      status: "deleted",
      deletedAt: new Date(),
    },
  });
}

/**
 * Rotate webhook secret
 */
export async function rotateWebhookSecret(
  webhookId: string,
  userId: string,
  tenantId: string
): Promise<{ secret: string }> {
  const scopedTenantId = requireTenantScope(tenantId);
  const existing = await prisma.webhook.findFirst({
    where: {
      id: webhookId,
      userId,
      tenantId: scopedTenantId,
      deletedAt: null,
    },
  });

  if (!existing) {
    throw new Error("Webhook not found");
  }

  const newSecret = generateWebhookSecret();

  await prisma.webhook.update({
    where: { id: webhookId },
    data: { secret: newSecret },
  });

  return { secret: newSecret };
}

/**
 * Get webhook delivery history
 */
export async function getWebhookDeliveries(
  webhookId: string,
  userId: string,
  tenantId: string,
  _limit = 50
): Promise<
  Array<{
    id: string;
    webhookId: string;
    status: "success" | "failed";
    responseCode?: number;
    responseBody?: string;
    attemptedAt: Date;
  }>
> {
  const scopedTenantId = requireTenantScope(tenantId);
  const existing = await prisma.webhook.findFirst({
    where: {
      id: webhookId,
      userId,
      tenantId: scopedTenantId,
      deletedAt: null,
    },
  });

  if (!existing) {
    throw new Error("Webhook not found");
  }

  const deliveries = await prisma.webhookDelivery.findMany({
    where: { webhookId },
    orderBy: { createdAt: "desc" },
    take: _limit,
  });

  return deliveries.map((d: (typeof deliveries)[0]) => ({
    id: d.id,
    webhookId: d.webhookId,
    status: d.status === "delivered" ? "success" : "failed",
    responseCode: d.statusCode || undefined,
    responseBody: d.responseBody || undefined,
    attemptedAt: d.createdAt,
  }));
}
