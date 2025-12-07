/**
 * Analytics Event Tracking Service
 * Tracks user events for growth analytics
 */

import { query } from "../../db";
import { logInfo } from "../../utils/logger";

export interface AnalyticsEvent {
  userId: string;
  event: string;
  properties?: Record<string, unknown>;
  timestamp?: Date;
}

/**
 * Track an analytics event
 */
export async function trackEvent(
  userId: string,
  event: string,
  properties?: Record<string, unknown>
): Promise<void> {
  try {
    await query(
      `INSERT INTO analytics_events (user_id, event, properties, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [userId, event, properties ? JSON.stringify(properties) : null]
    );

    logInfo("Event tracked", { userId, event, properties });
  } catch (error) {
    // Don't throw - analytics is non-critical
    logInfo("Failed to track event", {
      userId,
      event,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Track activation event
 */
export async function trackActivationEvent(
  userId: string,
  step: string,
  additionalProperties?: Record<string, unknown>
): Promise<void> {
  await trackEvent(userId, "onboarding.step_completed", {
    step,
    ...additionalProperties,
  });
}

/**
 * Track conversion event
 */
export async function trackConversionEvent(
  userId: string,
  event: string,
  properties?: Record<string, unknown>
): Promise<void> {
  await trackEvent(userId, `conversion.${event}`, properties);
}

/**
 * Track usage event
 */
export async function trackUsageEvent(
  userId: string,
  metricType: string,
  value: number,
  additionalProperties?: Record<string, unknown>
): Promise<void> {
  await trackEvent(userId, "usage.metric", {
    metric_type: metricType,
    value,
    ...additionalProperties,
  });
}

/**
 * Track feature access event
 */
export async function trackFeatureAccess(
  userId: string,
  feature: string,
  accessed: boolean,
  planType?: string
): Promise<void> {
  await trackEvent(userId, accessed ? "feature.accessed" : "feature.locked", {
    feature,
    plan_type: planType,
  });
}

/**
 * Batch track events (for performance)
 */
export async function trackEvents(events: AnalyticsEvent[]): Promise<void> {
  if (events.length === 0) return;

  try {
    const values = events
      .map((_, index) => `($${index * 3 + 1}, $${index * 3 + 2}, $${index * 3 + 3}, NOW())`)
      .join(", ");

    const params = events.flatMap((e) => [
      e.userId,
      e.event,
      e.properties ? JSON.stringify(e.properties) : null,
    ]);

    await query(
      `INSERT INTO analytics_events (user_id, event, properties, created_at)
       VALUES ${values}`,
      params
    );

    logInfo("Batch events tracked", { count: events.length });
  } catch (error) {
    logInfo("Failed to track batch events", {
      count: events.length,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
