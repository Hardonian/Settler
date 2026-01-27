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
  reason?: 'unauthenticated' | 'no_subscription' | 'subscription_inactive' | 'subscription_check_failed';
  redirectTo?: string;
}

/**
 * Check if user has access to console
 * Redirects if access denied (throws NextResponse), returns null if allowed
 * 
 * @throws {NextResponse} Redirects to sign-in or pricing if access denied
 */
export async function requireConsoleAccess(): Promise<null> {
  try {
    const supabase = await createClient();
    
    // Check authentication with error handling
    let user;
    let authError;
    try {
      const authResult = await supabase.auth.getUser();
      user = authResult.data?.user;
      authError = authResult.error;
    } catch {
      // If auth.getUser() throws (e.g., invalid client), treat as unauthenticated
      console.error('[requireConsoleAccess] Auth check failed:', error);
      authError = { message: 'Authentication check failed', status: 500 };
      user = null;
    }
    
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
    } catch {
      // CRITICAL: Fail closed - do not allow access if subscription check fails
      // This prevents revenue leakage. Show friendly error instead of granting access.
      console.error('[requireConsoleAccess] Subscription check failed:', error);
      
      // Redirect to pricing with error message
      const upgradeUrl = `/pricing?next=${encodeURIComponent('/console')}&error=subscription_check_failed`;
      redirect(upgradeUrl);
    }
  } catch {
    // Catch any unexpected errors (including redirect throws)
    // Re-throw redirects (they're expected)
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error; // Re-throw Next.js redirects
    }
    
    // For other errors, redirect to sign-in as fallback
    console.error('[requireConsoleAccess] Unexpected error:', error);
    const signInUrl = `/signup?next=${encodeURIComponent('/console')}`;
    redirect(signInUrl);
  }
}

/**
 * Get console access status without redirecting
 * Useful for conditional rendering
 */
export async function getConsoleAccessStatus(): Promise<ConsoleAccessResult> {
  try {
    const supabase = await createClient();
    
    // Check authentication with error handling
    let user;
    let authError;
    try {
      const authResult = await supabase.auth.getUser();
      user = authResult.data?.user;
      authError = authResult.error;
    } catch {
      // If auth.getUser() throws (e.g., invalid client), treat as unauthenticated
      console.error('[getConsoleAccessStatus] Auth check failed:', error);
      authError = { message: 'Authentication check failed', status: 500 };
      user = null;
    }
    
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
    } catch {
      console.error('[getConsoleAccessStatus] Subscription check failed:', error);
      // CRITICAL: Fail closed - deny access if subscription check fails
      return {
        allowed: false,
        reason: 'subscription_check_failed',
        redirectTo: `/pricing?next=${encodeURIComponent('/console')}&error=subscription_check_failed`,
      };
    }
  } catch {
    console.error('[getConsoleAccessStatus] Auth check failed:', error);
    return {
      allowed: false,
      reason: 'unauthenticated',
      redirectTo: `/signup?next=${encodeURIComponent('/console')}`,
    };
  }
}
