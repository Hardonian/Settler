/**
 * Webhook Management
 * 
 * Self-service webhook configuration and management.
 */

import { prisma } from '@/shared/db/prismaClient';
import { createClient } from '@/lib/supabase/server';
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
  // Validate URL
  try {
    new URL(input.url);
  } catch {
    throw new Error('Invalid webhook URL');
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

  const invalidEvents = input.events.filter((e) => !validEvents.includes(e));
  if (invalidEvents.length > 0) {
    throw new Error(`Invalid events: ${invalidEvents.join(', ')}`);
  }

  const secret = input.secret || generateWebhookSecret();

  const webhook = await prisma.webhook.create({
    data: {
      billingAccountId,
      url: input.url,
      events: input.events,
      secret,
      active: true,
      failureCount: 0,
    },
  });

  return webhook as Webhook;
}

/**
 * List webhooks for a billing account
 */
export async function listWebhooks(billingAccountId: string): Promise<Webhook[]> {
  const webhooks = await prisma.webhook.findMany({
    where: { billingAccountId },
    orderBy: { createdAt: 'desc' },
  });

  return webhooks as Webhook[];
}

/**
 * Update webhook
 */
export async function updateWebhook(
  webhookId: string,
  billingAccountId: string,
  updates: Partial<Pick<Webhook, 'url' | 'events' | 'active'>>
): Promise<Webhook> {
  // Verify ownership
  const existing = await prisma.webhook.findFirst({
    where: { id: webhookId, billingAccountId },
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
      ...(updates.active !== undefined && { active: updates.active }),
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
  const existing = await prisma.webhook.findFirst({
    where: { id: webhookId, billingAccountId },
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
  const existing = await prisma.webhook.findFirst({
    where: { id: webhookId, billingAccountId },
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
  const existing = await prisma.webhook.findFirst({
    where: { id: webhookId, billingAccountId },
  });

  if (!existing) {
    throw new Error('Webhook not found');
  }

  // This would query webhook_deliveries table if it exists
  // For now, return empty array
  return [];
}
