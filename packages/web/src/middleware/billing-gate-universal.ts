/**
 * Universal Billing Gate Middleware
 * 
 * CRITICAL: This middleware enforces billing on ALL API routes by default.
 * Routes must explicitly opt-out if they're free/public.
 * 
 * Usage:
 *   export const POST = withUniversalBillingGate(handler, { allowPublic: false })
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireActiveSubscription } from '@/lib/security/billing-enforcement';

export interface UniversalBillingGateOptions {
  /** Allow unauthenticated/public access (for playground, marketing pages) */
  allowPublic?: boolean;
  /** Allow access without subscription (for free tier features) */
  allowFree?: boolean;
  /** Feature name for error messages */
  feature?: string;
}

/**
 * Universal billing gate that enforces subscription by default
 * 
 * This is the DEFAULT behavior. Routes must opt-out if they're free.
 */
export function withUniversalBillingGate<
  T extends (request: NextRequest, ...args: any[]) => Promise<NextResponse>
>(
  handler: T,
  options: UniversalBillingGateOptions = {}
): T {
  return (async (...args: Parameters<T>) => {
    const request = args[0] as NextRequest;
    const { allowPublic = false, allowFree = false, feature = 'This feature' } = options;

    // If public access is allowed, skip billing check
    if (allowPublic) {
      return handler.apply(null, args);
    }

    // Check for active subscription
    const subscriptionCheck = await requireActiveSubscription(request);
    
    if (!subscriptionCheck.allowed) {
      // If free tier is allowed, check if user is authenticated
      if (allowFree) {
        // Allow authenticated users even without subscription
        // (They'll hit usage limits instead)
        if (subscriptionCheck.reason === 'No authenticated user') {
          return (
            subscriptionCheck.error ||
            NextResponse.json(
              {
                error: 'Unauthorized',
                message: 'Authentication required',
                code: 'AUTH_REQUIRED',
              },
              { status: 401 }
            )
          );
        }
        return handler.apply(null, args);
      }
      
      // Otherwise, require subscription
      return subscriptionCheck.error || NextResponse.json(
        {
          error: 'Subscription Required',
          message: `${feature} requires an active subscription`,
          code: 'SUBSCRIPTION_REQUIRED',
          upgrade_required: true,
        },
        { status: 403 }
      );
    }

    // All checks passed, call handler
    return handler.apply(null, args);
  }) as T;
}

/**
 * Helper to mark routes as public (no billing required)
 */
export function publicRoute<
  T extends (request: NextRequest, ...args: any[]) => Promise<NextResponse>
>(
  handler: T
): T {
  return withUniversalBillingGate(handler, { allowPublic: true });
}

/**
 * Helper to mark routes as free tier (no subscription, but usage limits apply)
 */
export function freeRoute<
  T extends (request: NextRequest, ...args: any[]) => Promise<NextResponse>
>(
  handler: T
): T {
  return withUniversalBillingGate(handler, { allowFree: true });
}
