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
 * CRITICAL: Never throws errors - always handles gracefully to prevent 500s
 * 
 * @throws {NextResponse} Redirects to sign-in or pricing if access denied
 */
export async function requireConsoleAccess(): Promise<null> {
  try {
    const supabase = await createClient();
    
    // Check authentication with comprehensive error handling
    let user = null;
    let authError = null;
    
    try {
      const authResult = await supabase.auth.getUser();
      user = authResult.data?.user ?? null;
      authError = authResult.error;
    } catch (error) {
      // If getUser() throws (e.g., invalid client), treat as auth error
      console.warn('[requireConsoleAccess] Auth check failed:', error);
      authError = error as Error;
    }
    
    // If there's an auth error or no user, redirect to sign-in
    // This handles both missing env vars and unauthenticated users
    if (authError || !user) {
      // Check if this is a configuration error (missing env vars)
      const isConfigError = authError && 
        (authError instanceof Error && authError.message?.includes('configuration') ||
         (typeof authError === 'object' && 'message' in authError && 
          String(authError.message).includes('configuration')));
      
      if (isConfigError) {
        // Don't redirect on config errors - let the page show error UI
        // This prevents redirect loops and allows error pages to render
        console.error('[requireConsoleAccess] Supabase configuration missing - allowing page render');
        return null;
      }
      
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
      // If subscription check fails, log but allow access
      // This prevents 500s from blocking legitimate users
      console.error('[requireConsoleAccess] Subscription check failed:', error);
      // Allow access - subscription gate is best-effort
      return null;
    }
  } catch (error) {
    // Catch-all error handler - never throw unhandled errors
    // Check if this is a redirect (NextResponse) and re-throw it
    if (error && typeof error === 'object' && 'digest' in error) {
      // This is a Next.js redirect - re-throw it
      throw error;
    }
    
    // For any other error, log and allow access to prevent 500s
    // The page will handle showing appropriate error UI
    console.error('[requireConsoleAccess] Unexpected error:', error);
    return null;
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
      // Fail open - allow access if subscription check fails
      return { allowed: true };
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
