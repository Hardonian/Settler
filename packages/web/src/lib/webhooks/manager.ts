/**
 * Webhook Management
 * 
 * Self-service webhook configuration and management.
 */

import { prisma } from '@/shared/db/prismaClient';
import crypto from 'crypto';

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

/**
 * Generate webhook secret
 */
function generateWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(32).toString('base64url')}`;
}

/**
 * Create a new webhook
 */
export async function createWebhook(
  userId: string,
  tenantId: string,
  input: CreateWebhookInput
): Promise<Webhook> {
  // Validate URL format
  try {
    const url = new URL(input.url);
    // Only allow HTTPS in production
    if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
      throw new Error('Webhook URLs must use HTTPS in production');
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('HTTPS')) {
      throw error;
    }
    throw new Error('Invalid webhook URL format');
  }

  // Validate URL length
  if (input.url.length > 2048) {
    throw new Error('Webhook URL is too long (max 2048 characters)');
  }

  // Validate events
  const validEvents = [
    'reconciliation.completed',
    'reconciliation.failed',
    'receipt.parsed',
    'receipt.failed',
    'feature_flag.updated',
    'usage.limit_exceeded',
    'billing.subscription_updated',
  ];

  // Validate events array
  if (!Array.isArray(input.events)) {
    throw new Error('Events must be an array');
  }

  if (input.events.length === 0) {
    throw new Error('At least one event must be specified');
  }

  if (input.events.length > 20) {
    throw new Error('Maximum 20 events allowed per webhook');
  }

  // Validate each event
  const invalidEvents = input.events.filter((e) => {
    if (typeof e !== 'string') return true;
    return !validEvents.includes(e);
  });

  if (invalidEvents.length > 0) {
    throw new Error(`Invalid events: ${invalidEvents.join(', ')}. Valid events: ${validEvents.join(', ')}`);
  }

  const secret = input.secret || generateWebhookSecret();

  // Get userId and tenantId from billingAccountId
  const billingAccount = await prisma.billingAccount.findUnique({
    where: { id: billingAccountId },
    select: { userId: true, tenantId: true },
  });

  if (!billingAccount) {
    throw new Error('Billing account not found');
  }

  const webhook = await prisma.webhook.create({
    data: {
<<<<<<< HEAD
      userId,
      tenantId,
=======
      userId: billingAccount.userId,
      tenantId: billingAccount.tenantId || billingAccount.userId, // Fallback to userId if tenantId is null
>>>>>>> origin/main
      url: input.url,
      events: input.events,
      secret,
      status: 'active',
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
<<<<<<< HEAD
export async function listWebhooks(userId: string, tenantId: string): Promise<Webhook[]> {
  const webhooks = await prisma.webhook.findMany({
    where: {
      userId,
      tenantId,
      deletedAt: null,
    },
    orderBy: { createdAt: 'desc' },
  });

  return webhooks.map((w) => ({
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
=======
export async function listWebhooks(billingAccountId: string): Promise<Webhook[]> {
  // Get userId from billingAccountId
  const billingAccount = await prisma.billingAccount.findUnique({
    where: { id: billingAccountId },
    select: { userId: true },
  });

  if (!billingAccount) {
    return [];
  }

  const webhooks = await prisma.webhook.findMany({
    where: { userId: billingAccount.userId },
    orderBy: { createdAt: 'desc' },
  });

  // Map to Webhook interface format
  return webhooks.map((w) => ({
    ...w,
    billingAccountId,
    active: w.status === 'active',
    failureCount: 0, // Not tracked in schema
    events: Array.isArray(w.events) ? w.events : [],
  })) as Webhook[];
>>>>>>> origin/main
}

/**
 * Update webhook
 */
export async function updateWebhook(
  webhookId: string,
  userId: string,
  tenantId: string,
  updates: Partial<Pick<Webhook, 'url' | 'events' | 'status'>>
): Promise<Webhook> {
  // Get userId from billingAccountId and verify ownership
  const billingAccount = await prisma.billingAccount.findUnique({
    where: { id: billingAccountId },
    select: { userId: true },
  });

  if (!billingAccount) {
    throw new Error('Billing account not found');
  }

  const existing = await prisma.webhook.findFirst({
<<<<<<< HEAD
    where: {
      id: webhookId,
      userId,
      tenantId,
      deletedAt: null,
    },
=======
    where: { id: webhookId, userId: billingAccount.userId },
>>>>>>> origin/main
  });

  if (!existing) {
    throw new Error('Webhook not found');
  }

  // Validate URL if provided
  if (updates.url) {
    try {
      new URL(updates.url);
    } catch {
      throw new Error('Invalid webhook URL');
    }
  }

  const webhook = await prisma.webhook.update({
    where: { id: webhookId },
    data: {
      ...(updates.url && { url: updates.url }),
      ...(updates.events && { events: updates.events }),
<<<<<<< HEAD
      ...(updates.status && { status: updates.status }),
=======
      ...(updates.active !== undefined && { status: updates.active ? 'active' : 'inactive' }),
>>>>>>> origin/main
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
  // Get userId from billingAccountId and verify ownership
  const billingAccount = await prisma.billingAccount.findUnique({
    where: { id: billingAccountId },
    select: { userId: true },
  });

  if (!billingAccount) {
    throw new Error('Billing account not found');
  }

  const existing = await prisma.webhook.findFirst({
<<<<<<< HEAD
    where: {
      id: webhookId,
      userId,
      tenantId,
      deletedAt: null,
    },
=======
    where: { id: webhookId, userId: billingAccount.userId },
>>>>>>> origin/main
  });

  if (!existing) {
    throw new Error('Webhook not found');
  }

  await prisma.webhook.update({
    where: { id: webhookId },
    data: {
      status: 'deleted',
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
  // Get userId from billingAccountId and verify ownership
  const billingAccount = await prisma.billingAccount.findUnique({
    where: { id: billingAccountId },
    select: { userId: true },
  });

  if (!billingAccount) {
    throw new Error('Billing account not found');
  }

  const existing = await prisma.webhook.findFirst({
<<<<<<< HEAD
    where: {
      id: webhookId,
      userId,
      tenantId,
      deletedAt: null,
    },
=======
    where: { id: webhookId, userId: billingAccount.userId },
>>>>>>> origin/main
  });

  if (!existing) {
    throw new Error('Webhook not found');
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
): Promise<Array<{
  id: string;
  webhookId: string;
  status: 'success' | 'failed';
  responseCode?: number;
  responseBody?: string;
  attemptedAt: Date;
}>> {
  // Get userId from billingAccountId and verify ownership
  const billingAccount = await prisma.billingAccount.findUnique({
    where: { id: billingAccountId },
    select: { userId: true },
  });

  if (!billingAccount) {
    throw new Error('Billing account not found');
  }

  const existing = await prisma.webhook.findFirst({
<<<<<<< HEAD
    where: {
      id: webhookId,
      userId,
      tenantId,
      deletedAt: null,
    },
=======
    where: { id: webhookId, userId: billingAccount.userId },
>>>>>>> origin/main
  });

  if (!existing) {
    throw new Error('Webhook not found');
  }

  const deliveries = await prisma.webhookDelivery.findMany({
    where: { webhookId },
    orderBy: { createdAt: 'desc' },
    take: _limit,
  });

  return deliveries.map((d) => ({
    id: d.id,
    webhookId: d.webhookId,
    status: d.status === 'delivered' ? 'success' : 'failed',
    responseCode: d.statusCode || undefined,
    responseBody: d.responseBody || undefined,
    attemptedAt: d.createdAt,
  }));
}
