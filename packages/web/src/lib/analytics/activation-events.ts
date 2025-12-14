/**
 * Activation Event Tracking
 * 
 * Tracks "aha" moments and activation milestones for user lifecycle analysis.
 * Helps identify silent churn and measure product-market fit.
 */

import { prisma } from '@/shared/db/prismaClient';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database.types';

export type ActivationEventType =
  | 'first_receipt_parsed'
  | 'first_api_key_created'
  | 'first_reconciliation_run'
  | 'first_feature_flag_created'
  | 'first_webhook_configured'
  | 'first_integration_connected';

interface ActivationEvent {
  userId: string;
  billingAccountId?: string;
  tenantId?: string;
  eventType: ActivationEventType;
  metadata?: Record<string, unknown>;
}

/**
 * Track an activation event
 * Idempotent - won't create duplicate events for the same user + event type
 */
export async function trackActivationEvent(event: ActivationEvent): Promise<void> {
  try {
    // Check if event already tracked (idempotency)
    const existing = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM activity_log
      WHERE user_id = ${event.userId}::uuid
        AND activity_type = ${event.eventType}
      LIMIT 1
    `;

    if (existing && existing.length > 0) {
      // Event already tracked, skip
      return;
    }

    // Insert activation event into activity_log
    const supabase = await createClient();
    const activityData: Database['public']['Tables']['activity_log']['Insert'] = {
      user_id: event.userId,
      activity_type: event.eventType,
      entity_type: 'activation',
      entity_id: event.billingAccountId || null,
      metadata: {
        billingAccountId: event.billingAccountId,
        tenantId: event.tenantId,
        ...event.metadata,
      } as Record<string, unknown>,
    };
    
    const { error } = await supabase
      .from('activity_log')
      .insert(activityData as any);

    if (error) {
      console.error('[Activation Events] Failed to track event:', {
        eventType: event.eventType,
        userId: event.userId,
        error: error.message,
      });
      // Don't throw - activation tracking is non-critical
    }
  } catch (error) {
    console.error('[Activation Events] Error tracking activation event:', {
      eventType: event.eventType,
      userId: event.userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    // Don't throw - activation tracking is non-critical
  }
}

/**
 * Check if user has completed activation milestone
 */
export async function hasActivationMilestone(
  userId: string,
  eventType: ActivationEventType
): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('activity_log')
      .select('id')
      .eq('user_id', userId)
      .eq('activity_type', eventType)
      .limit(1)
      .single();

    if (error || !data) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Activation Events] Error checking milestone:', {
      eventType,
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Get activation score for user (0-100)
 * Based on completed activation milestones
 */
export async function getActivationScore(userId: string): Promise<number> {
  const milestones: ActivationEventType[] = [
    'first_receipt_parsed',
    'first_api_key_created',
    'first_reconciliation_run',
    'first_feature_flag_created',
    'first_webhook_configured',
    'first_integration_connected',
  ];

  let completed = 0;
  for (const milestone of milestones) {
    if (await hasActivationMilestone(userId, milestone)) {
      completed++;
    }
  }

  return Math.round((completed / milestones.length) * 100);
}
