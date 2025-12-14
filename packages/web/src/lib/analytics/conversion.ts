/**
 * Conversion Analytics
 * 
 * Tracks user journey and conversion funnel metrics.
 */

import { prisma } from '@/shared/db/prismaClient';

export type ConversionEvent = 
  | 'page_view'
  | 'playground_visit'
  | 'playground_action'
  | 'signup_start'
  | 'signup_complete'
  | 'api_key_created'
  | 'first_api_call'
  | 'first_reconciliation'
  | 'upgrade_intent'
  | 'upgrade_complete'
  | 'trial_start'
  | 'trial_end';

export interface ConversionEventData {
  userId?: string;
  sessionId?: string;
  event: ConversionEvent;
  properties?: Record<string, unknown>;
  timestamp?: Date;
}

/**
 * Track a conversion event
 */
export async function trackConversionEvent(data: ConversionEventData): Promise<void> {
  try {
    // Store in activity_log table (or create dedicated conversion_events table)
    await prisma.$executeRaw`
      INSERT INTO activity_log (
        user_id,
        action,
        resource_type,
        metadata,
        created_at
      ) VALUES (
        ${data.userId || null}::uuid,
        ${data.event},
        'conversion',
        ${JSON.stringify(data.properties || {})}::jsonb,
        ${data.timestamp || new Date()}
      )
    `;
  } catch (error) {
    // Don't block operations if tracking fails
    console.error('[Conversion Analytics] Error tracking event:', error);
  }
}

/**
 * Get conversion funnel metrics
 */
export async function getConversionFunnel(startDate: Date, endDate: Date) {
  try {
    // Query conversion events from activity_log
    const events = await prisma.$queryRaw<Array<{
      action: string;
      count: bigint;
    }>>`
      SELECT 
        action,
        COUNT(*) as count
      FROM activity_log
      WHERE 
        resource_type = 'conversion'
        AND created_at >= ${startDate}
        AND created_at <= ${endDate}
      GROUP BY action
      ORDER BY 
        CASE action
          WHEN 'page_view' THEN 1
          WHEN 'playground_visit' THEN 2
          WHEN 'playground_action' THEN 3
          WHEN 'signup_start' THEN 4
          WHEN 'signup_complete' THEN 5
          WHEN 'api_key_created' THEN 6
          WHEN 'first_api_call' THEN 7
          WHEN 'first_reconciliation' THEN 8
          WHEN 'upgrade_intent' THEN 9
          WHEN 'upgrade_complete' THEN 10
          ELSE 99
        END
    `;

    const funnel: Record<string, number> = {};
    events.forEach(event => {
      funnel[event.action] = Number(event.count);
    });

    // Calculate conversion rates
    const pageViews = funnel['page_view'] || 0;
    const playgroundVisits = funnel['playground_visit'] || 0;
    const signups = funnel['signup_complete'] || 0;
    const apiKeysCreated = funnel['api_key_created'] || 0;
    const upgrades = funnel['upgrade_complete'] || 0;

    return {
      funnel,
      conversionRates: {
        playgroundToSignup: pageViews > 0 ? (signups / pageViews) * 100 : 0,
        signupToApiKey: signups > 0 ? (apiKeysCreated / signups) * 100 : 0,
        apiKeyToUpgrade: apiKeysCreated > 0 ? (upgrades / apiKeysCreated) * 100 : 0,
        overall: pageViews > 0 ? (upgrades / pageViews) * 100 : 0,
      },
      period: {
        start: startDate,
        end: endDate,
      },
    };
  } catch (error) {
    console.error('[Conversion Analytics] Error getting funnel:', error);
    return {
      funnel: {},
      conversionRates: {
        playgroundToSignup: 0,
        signupToApiKey: 0,
        apiKeyToUpgrade: 0,
        overall: 0,
      },
      period: {
        start: startDate,
        end: endDate,
      },
    };
  }
}

/**
 * Track page view
 */
export async function trackPageView(
  path: string,
  userId?: string,
  sessionId?: string
): Promise<void> {
  await trackConversionEvent({
    userId,
    sessionId,
    event: 'page_view',
    properties: {
      path,
    },
  });
}

/**
 * Track playground visit
 */
export async function trackPlaygroundVisit(
  userId?: string,
  sessionId?: string
): Promise<void> {
  await trackConversionEvent({
    userId,
    sessionId,
    event: 'playground_visit',
  });
}

/**
 * Track signup start
 */
export async function trackSignupStart(
  sessionId: string
): Promise<void> {
  await trackConversionEvent({
    sessionId,
    event: 'signup_start',
  });
}

/**
 * Track signup complete
 */
export async function trackSignupComplete(
  userId: string
): Promise<void> {
  await trackConversionEvent({
    userId,
    event: 'signup_complete',
  });
}
