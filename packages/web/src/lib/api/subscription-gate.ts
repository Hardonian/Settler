/**
 * Subscription Tier Gate for API Routes
 * 
 * Enforces subscription tier requirements on API endpoints
 * Integrates with existing auth-gate for comprehensive security
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSubscriptionStatus } from '@/lib/get-subscription-status';
import { SubscriptionTier } from '@/lib/subscription-access';
import { getTraceId } from '@/lib/observability/trace';
import { logger } from '@/lib/observability/logger';
import { ErrorCode } from '@/lib/api/error-handler';

export interface SubscriptionGateOptions {
  /** Minimum subscription tier required */
  requiredTier: SubscriptionTier;
  /** Feature name for error messages */
  feature: string;
  /** Allow unauthenticated access (for playground) */
  allowUnauthenticated?: boolean;
}

/**
 * Check subscription tier for API request
 */
export async function requireSubscriptionTier(
  request: NextRequest,
  options: SubscriptionGateOptions
): Promise<{
  authorized: boolean;
  tier?: SubscriptionTier;
  error?: NextResponse;
}> {
  const traceId = await getTraceId(request);

  try {
    // Get subscription status
    const subscription = await getSubscriptionStatus();
    
    // Check if user has required tier
    const tierOrder: Record<SubscriptionTier, number> = {
      unsubscribed: 0,
      subscribed_unpaid: 1,
      subscribed_paid: 2,
      enterprise: 3,
    };

    const userTier = tierOrder[subscription.tier] ?? 0;
    const requiredTierLevel = tierOrder[options.requiredTier] ?? 0;

    if (userTier < requiredTierLevel) {
      await logger.warn('Subscription tier insufficient', {
        trace_id: traceId,
        route: request.nextUrl.pathname,
        user_tier: subscription.tier,
        required_tier: options.requiredTier,
        feature: options.feature,
      });

      return {
        authorized: false,
        tier: subscription.tier,
        error: NextResponse.json(
          {
            error: `Subscription required: ${options.feature} requires ${options.requiredTier} subscription`,
            code: ErrorCode.FORBIDDEN,
            tier: subscription.tier,
            required_tier: options.requiredTier,
            upgrade_url: '/console/billing',
            trace_id: traceId,
            timestamp: new Date().toISOString(),
          },
          { status: 403 }
        ),
      };
    }

    return {
      authorized: true,
      tier: subscription.tier,
    };
  } catch {
    await logger.error('Subscription check failed', {
      trace_id: traceId,
      route: request.nextUrl.pathname,
      error: error instanceof Error ? error.message : String(error),
    });

    // If allowUnauthenticated is true, allow through (for playground)
    if (options.allowUnauthenticated) {
      return {
        authorized: true,
        tier: 'unsubscribed',
      };
    }

    return {
      authorized: false,
      error: NextResponse.json(
        {
          error: 'Subscription check failed',
          message: 'Unable to verify subscription status. Please try again or contact support.',
          code: ErrorCode.INTERNAL_ERROR,
          trace_id: traceId,
          timestamp: new Date().toISOString(),
          retryable: true,
        },
        { status: 403 }
      ),
    };
  }
}

/**
 * Wrap API route handler with subscription tier gating
 */
export function withSubscriptionGate<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
  options: SubscriptionGateOptions
): T {
  return (async (...args: Parameters<T>) => {
    const request = args[0] as NextRequest;

    const subscriptionCheck = await requireSubscriptionTier(request, options);
    if (!subscriptionCheck.authorized) {
      return subscriptionCheck.error!;
    }

    // Call original handler
    return handler(...args);
  }) as T;
}
