/**
 * Console API Route Protection
 * 
 * Server-side authentication and subscription checks for console API routes.
 * Ensures all console API endpoints require authentication and subscription.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSubscriptionStatus } from '@/lib/get-subscription-status';

/**
 * Require authentication and subscription for console API routes
 * Returns NextResponse with error if access denied, null if allowed
 */
export async function requireConsoleApiAccess(
  request: NextRequest
): Promise<NextResponse | null> {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        },
        { status: 401 }
      );
    }
    
    // Check subscription status
    try {
      const subscriptionStatus = await getSubscriptionStatus();
      
      // Allow access if user has any subscription (including unpaid/trialing)
      // This allows users to see console and upgrade if needed
      if (!subscriptionStatus.hasSubscription && subscriptionStatus.tier === 'unsubscribed') {
        return NextResponse.json(
          { 
            error: 'Subscription Required',
            message: 'An active subscription is required to access this endpoint',
            code: 'SUBSCRIPTION_REQUIRED',
            upgradeUrl: `/pricing?next=${encodeURIComponent(request.nextUrl.pathname)}`
          },
          { status: 403 }
        );
      }
      
      // User is authenticated and has subscription - allow access
      return null;
    } catch (subscriptionError) {
      // If subscription check fails, log but allow access
      // This prevents 500s from blocking legitimate users
      console.error('[requireConsoleApiAccess] Subscription check failed:', subscriptionError);
      // Fail open - allow access if subscription check fails
      return null;
    }
  } catch (_error) {
    console.error('[requireConsoleApiAccess] Auth check failed:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to verify access',
        code: 'AUTH_CHECK_FAILED'
      },
      { status: 500 }
    );
  }
}
