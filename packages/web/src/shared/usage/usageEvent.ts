/**
 * Usage Event Tracking
 * 
 * Logs usage events for billing, analytics, and rate limiting.
 * Reuses the existing UsageEvent model from Prisma schema.
 */

import { prisma } from '../db/prismaClient';

export interface UsageEventInput {
  billingAccountId: string;
  projectId?: string;
  userId?: string;
  tenantId?: string;
  eventType: string; // e.g., "settler-receipts:parse_sync", "settler-feature-flags:evaluate"
  integrationId?: string;
  addOnId?: string;
  quantity: number;
  unit?: string; // e.g., "request", "receipt", "flag_evaluation"
  metadata?: Record<string, unknown>;
}

/**
 * Record a usage event
 */
export async function recordUsageEvent(input: UsageEventInput): Promise<void> {
  try {
    await prisma.usageEvent.create({
      data: {
        billingAccountId: input.billingAccountId,
        projectId: input.projectId,
        userId: input.userId,
        tenantId: input.tenantId,
        eventType: input.eventType,
        integrationId: input.integrationId,
        addOnId: input.addOnId,
        quantity: input.quantity,
        unit: input.unit,
        metadata: input.metadata || {},
      },
    });
  } catch (error) {
    // Log error but don't fail the request
    console.error('Failed to record usage event:', error);
  }
}

/**
 * Record usage for a service operation
 */
export async function recordServiceUsage(params: {
  billingAccountId: string;
  service: string; // e.g., "settler-receipts", "settler-feature-flags"
  operation: string; // e.g., "parse_sync", "evaluate"
  quantity?: number;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await recordUsageEvent({
    billingAccountId: params.billingAccountId,
    eventType: `${params.service}:${params.operation}`,
    quantity: params.quantity ?? 1,
    unit: 'request',
    metadata: params.metadata,
  });
}
