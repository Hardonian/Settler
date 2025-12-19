import { NextResponse } from 'next/server';
import { getSubscriptionStatus } from '@/lib/get-subscription-status';

/**
 * Get current user's subscription status
 */
export async function GET() {
  try {
    const status = await getSubscriptionStatus();
    return NextResponse.json(status);
  } catch (error: any) {
    console.error('Error getting subscription status:', error);
    return NextResponse.json(
      { 
        tier: 'unsubscribed',
        hasSubscription: false,
        isPaid: false,
        isEnterprise: false,
        error: error.message 
      },
      { status: 500 }
    );
  }
}
