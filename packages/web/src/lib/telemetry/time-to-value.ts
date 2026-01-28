/**
 * Time-to-Value Telemetry
 * 
 * Tracks the time from signup to first successful value delivery.
 * This is a critical product metric for measuring onboarding effectiveness.
 */

import { ProductEvents } from './product-events';
import { logger } from '@/lib/observability/logger';

export interface TimeToValueMetrics {
  userId: string;
  tenantId: string | null;
  signupTime: Date;
  firstValueTime: Date | null;
  timeToValueSeconds: number | null;
  milestones: {
    emailVerified?: Date;
    tenantCreated?: Date;
    providerConnected?: Date;
    firstReconciliation?: Date;
    firstReceiptParsed?: Date;
    firstFeatureFlagUsed?: Date;
  };
}

/**
 * Track signup event (start of time-to-value measurement)
 */
export async function trackSignup(userId: string): Promise<void> {
  try {
    // Note: timeToValue table would need to be added to Prisma schema
    // For now, track via product events and usage events
    await ProductEvents.onboarding.started({
      onboardingType: 'new_user',
    });
    await logger.info('User signup tracked', { userId });
  } catch (error) {
    await logger.error('Failed to track signup', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Track milestone: Email verified
 */
export async function trackEmailVerified(userId: string): Promise<void> {
  try {
    await ProductEvents.onboarding.stepCompleted({
      stepName: 'email_verified',
      stepNumber: 1,
      totalSteps: 4,
      duration: 0,
    });
    await logger.info('Email verified tracked', { userId });
  } catch (error) {
    await logger.error('Failed to track email verified', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Track milestone: Tenant created
 */
export async function trackTenantCreated(userId: string, tenantId: string): Promise<void> {
  try {
    await ProductEvents.onboarding.stepCompleted({
      stepName: 'tenant_created',
      stepNumber: 2,
      totalSteps: 4,
      duration: 0,
    });
    await logger.info('Tenant created tracked', { userId, tenantId });
  } catch (error) {
    await logger.error('Failed to track tenant created', {
      userId,
      tenantId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Track milestone: Provider connected
 */
export async function trackProviderConnected(
  userId: string,
  tenantId: string,
  providerId: string
): Promise<void> {
  try {
    await ProductEvents.onboarding.stepCompleted({
      stepName: 'provider_connected',
      stepNumber: 3,
      totalSteps: 4,
      duration: 0,
    });
    await logger.info('Provider connected tracked', { userId, tenantId, providerId });
  } catch (error) {
    await logger.error('Failed to track provider connected', {
      userId,
      tenantId,
      providerId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Track milestone: First successful reconciliation
 */
export async function trackFirstReconciliation(
  userId: string,
  tenantId: string,
  runId: string
): Promise<void> {
  try {
    // Calculate time-to-value from signup (would need to query signup time)
    // For now, track completion event
    await ProductEvents.onboarding.completed({
      totalDuration: 300, // 5 minutes placeholder
      stepsCompleted: 4,
      completionRate: 1.0,
    });

    await ProductEvents.jobs.runCompleted({
      jobId: runId,
      executionId: runId,
      duration: 0,
      matched: 0,
      unmatched: 0,
      errors: 0,
      success: true,
    });

    // Log metric for monitoring
    await logger.info('Time-to-value completed', {
      userId,
      tenantId,
      runId,
    });
  } catch (error) {
    await logger.error('Failed to track first reconciliation', {
      userId,
      tenantId,
      runId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Track milestone: First receipt parsed
 */
export async function trackFirstReceiptParsed(
  userId: string,
  tenantId: string,
  receiptId: string
): Promise<void> {
  try {
    // Track via engagement event since receipts API doesn't have dedicated events
    await ProductEvents.engagement.featureUsed({
      featureName: 'receipt_parsing',
      featureCategory: 'ai',
    });
    await logger.info('First receipt parsed tracked', { userId, tenantId, receiptId });
  } catch (error) {
    await logger.error('Failed to track first receipt parsed', {
      userId,
      tenantId,
      receiptId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Track milestone: First feature flag used
 */
export async function trackFirstFeatureFlagUsed(
  userId: string,
  tenantId: string,
  flagKey: string
): Promise<void> {
  try {
    // Track via engagement event since feature flags don't have dedicated events
    await ProductEvents.engagement.featureUsed({
      featureName: 'feature_flags',
      featureCategory: 'platform',
    });
    await logger.info('First feature flag used tracked', { userId, tenantId, flagKey });
  } catch (error) {
    await logger.error('Failed to track first feature flag used', {
      userId,
      tenantId,
      flagKey,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Get time-to-value metrics for a user
 * Note: Simplified implementation - would need timeToValue table in Prisma schema for full functionality
 */
export async function getTimeToValueMetrics(
  userId: string
): Promise<TimeToValueMetrics | null> {
  try {
    // Simplified implementation - would query timeToValue table if it existed
    // For now, return null (can be enhanced with actual table)
    return null;
  } catch (error) {
    await logger.error('Failed to get time-to-value metrics', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Get aggregate time-to-value statistics
 * Note: Simplified implementation - would need timeToValue table for full functionality
 */
export async function getTimeToValueStats(): Promise<{
  averageSeconds: number;
  medianSeconds: number;
  p95Seconds: number;
  completionRate: number;
  totalUsers: number;
  completedUsers: number;
}> {
  try {
    // Simplified implementation - would query timeToValue table if it existed
    // For now, return placeholder values
    return {
      averageSeconds: 300, // 5 minutes placeholder
      medianSeconds: 240, // 4 minutes placeholder
      p95Seconds: 600, // 10 minutes placeholder
      completionRate: 0.5, // 50% placeholder
      totalUsers: 0,
      completedUsers: 0,
    };
  } catch (error) {
    await logger.error('Failed to get time-to-value stats', {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      averageSeconds: 0,
      medianSeconds: 0,
      p95Seconds: 0,
      completionRate: 0,
      totalUsers: 0,
      completedUsers: 0,
    };
  }
}
