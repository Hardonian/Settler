/**
 * Webhook Management
 * 
 * Self-service webhook configuration and management.
 */

import { prisma } from '@/shared/db/prismaClient';
import crypto from 'crypto';

export interface Webhook {
  id: string;
  billingAccountId: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastTriggeredAt?: Date;
  failureCount: number;
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
  billingAccountId: string,
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
      userId: billingAccount.userId,
      tenantId: billingAccount.tenantId || billingAccount.userId, // Fallback to userId if tenantId is null
      url: input.url,
      events: input.events,
      secret,
      status: 'active',
    },
  });

  return webhook as Webhook;
}

/**
 * List webhooks for a billing account
 */
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
}

/**
 * Update webhook
 */
export async function updateWebhook(
  webhookId: string,
  billingAccountId: string,
  updates: Partial<Pick<Webhook, 'url' | 'events' | 'active'>>
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
    where: { id: webhookId, userId: billingAccount.userId },
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
      ...(updates.active !== undefined && { status: updates.active ? 'active' : 'inactive' }),
    },
  });

  return webhook as Webhook;
}

/**
 * Delete webhook
 */
export async function deleteWebhook(
  webhookId: string,
  billingAccountId: string
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
    where: { id: webhookId, userId: billingAccount.userId },
  });

  if (!existing) {
    throw new Error('Webhook not found');
  }

  await prisma.webhook.delete({
    where: { id: webhookId },
  });
}

/**
 * Rotate webhook secret
 */
export async function rotateWebhookSecret(
  webhookId: string,
  billingAccountId: string
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
    where: { id: webhookId, userId: billingAccount.userId },
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
  billingAccountId: string,
  limit = 50
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
    where: { id: webhookId, userId: billingAccount.userId },
  });

  if (!existing) {
    throw new Error('Webhook not found');
  }

  // This would query webhook_deliveries table if it exists
  // For now, return empty array
  return [];
}
