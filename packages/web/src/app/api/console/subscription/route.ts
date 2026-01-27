/**
 * Subscription Info API Route
 * 
 * Returns current user's subscription tier and feature access.
 */

import { NextResponse } from 'next/server';
import { getSubscriptionInfo } from '@/lib/console/subscription';
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';
import { appLogger } from '@/lib/utils/logger';
import { withSecurity } from '@/lib/middleware/api-security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = withSecurity(
  withUniversalBillingGate(async function GET() {
  try {
    const subscription = await getSubscriptionInfo();
    return NextResponse.json(subscription);
  } catch {
    appLogger.error('[Subscription API] Error', error);
    return NextResponse.json(
      { 
        tier: 'unauthenticated',
        features: {
          playgroundRequestsPerDay: 10,
          playgroundRequestsPerMinute: 2,
          apiRequestsPerMonth: 0,
          advancedPlaygroundFeatures: false,
          requestHistory: false,
          customTemplates: false,
          webhookTesting: false,
          teamCollaboration: false,
        }
      },
      { status: 200 }
    );
  }
}, { feature: 'Subscription API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);
