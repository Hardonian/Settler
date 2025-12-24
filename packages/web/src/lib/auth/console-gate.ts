/**
 * Console Access Gate
 * 
 * Server-side authentication and subscription checks for console routes.
 * Ensures proper tenant isolation and least privilege.
 */

import { createClient } from '@/lib/supabase/server';
import { getSubscriptionStatus } from '@/lib/get-subscription-status';
import { redirect } from 'next/navigation';

export interface ConsoleAccessResult {
  allowed: boolean;
  reason?: 'unauthenticated' | 'no_subscription' | 'subscription_inactive';
  redirectTo?: string;
}

/**
 * Check if user has access to console
 * Redirects if access denied (throws NextResponse), returns null if allowed
 * 
 * @throws {NextResponse} Redirects to sign-in or pricing if access denied
 */
export async function requireConsoleAccess(): Promise<null> {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    // Redirect to sign-in with return URL
    const signInUrl = `/signup?next=${encodeURIComponent('/console')}`;
    redirect(signInUrl);
  }
  
  // Check subscription status
  try {
    const subscriptionStatus = await getSubscriptionStatus();
    
    // Allow access if user has any subscription (including unpaid/trialing)
    // This allows users to see console and upgrade if needed
    if (!subscriptionStatus.hasSubscription && subscriptionStatus.tier === 'unsubscribed') {
      // Redirect to pricing/upgrade page
      const upgradeUrl = `/pricing?next=${encodeURIComponent('/console')}`;
      redirect(upgradeUrl);
    }
    
    // User is authenticated and has subscription - allow access
    return null;
  } catch (error) {
    // CRITICAL: Fail closed - do not allow access if subscription check fails
    // This prevents revenue leakage. Show friendly error instead of granting access.
    console.error('[requireConsoleAccess] Subscription check failed:', error);
    
    // Redirect to pricing with error message
    const upgradeUrl = `/pricing?next=${encodeURIComponent('/console')}&error=subscription_check_failed`;
    redirect(upgradeUrl);
  }
}

/**
 * Get console access status without redirecting
 * Useful for conditional rendering
 */
export async function getConsoleAccessStatus(): Promise<ConsoleAccessResult> {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        allowed: false,
        reason: 'unauthenticated',
        redirectTo: `/signup?next=${encodeURIComponent('/console')}`,
      };
    }
    
    try {
      const subscriptionStatus = await getSubscriptionStatus();
      
      if (!subscriptionStatus.hasSubscription && subscriptionStatus.tier === 'unsubscribed') {
        return {
          allowed: false,
          reason: 'no_subscription',
          redirectTo: `/pricing?next=${encodeURIComponent('/console')}`,
        };
      }
      
      return { allowed: true };
    } catch (error) {
      console.error('[getConsoleAccessStatus] Subscription check failed:', error);
      // CRITICAL: Fail closed - deny access if subscription check fails
      return {
        allowed: false,
        reason: 'subscription_check_failed',
        redirectTo: `/pricing?next=${encodeURIComponent('/console')}&error=subscription_check_failed`,
      };
    }
  } catch (error) {
    console.error('[getConsoleAccessStatus] Auth check failed:', error);
    return {
      allowed: false,
      reason: 'unauthenticated',
      redirectTo: `/signup?next=${encodeURIComponent('/console')}`,
    };
  }
}
