import { NextResponse } from 'next/server';
import { getSubscriptionStatus } from '@/lib/get-subscription-status';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Get current user's subscription status
 * 
 * CRITICAL: Never returns 500 - always returns 200 with fallback status
 * This prevents client-side errors from breaking the console UI
 */
export async function GET() {
  try {
    const status = await getSubscriptionStatus();
    return NextResponse.json(status);
  } catch (error: any) {
    // Log error for debugging
    console.error('[subscription-status] Error getting subscription status:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // CRITICAL: Always return 200 with fallback status
    // Never return 500 - this breaks the console UI
    return NextResponse.json({
      tier: 'unsubscribed',
      hasSubscription: false,
      isPaid: false,
      isEnterprise: false,
      // Include error message in development only
      ...(process.env.NODE_ENV === 'development' && error?.message
        ? { error: error.message }
        : {}),
    });
  }
}
