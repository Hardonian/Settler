/**
 * Demo Reset API Route
 * 
 * PHASE 6: GTM READINESS CHECK
 * 
 * Resets demo tenant data for repeatable demos.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resetDemoTenant, isDemoTenant } from '@/lib/gtm/demo-data';
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';
import { appLogger } from '@/lib/utils/logger';
import { withSecurity } from '@/lib/middleware/api-security';

export const POST = withSecurity(
  withUniversalBillingGate(async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { tenantId } = await request.json();

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId required' },
        { status: 400 }
      );
    }

    // Verify it's a demo tenant
    const isDemo = await isDemoTenant(tenantId);
    if (!isDemo) {
      return NextResponse.json(
        { error: 'Only demo tenants can be reset' },
        { status: 403 }
      );
    }

    // Reset demo data
    await resetDemoTenant(tenantId);

    return NextResponse.json({
      success: true,
      message: 'Demo data reset successfully',
    });
  } catch (error) {
    appLogger.error('[Demo Reset] Error', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reset demo data',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
  }
}, { feature: 'POST API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 10 }, requireAuth: true }
);
