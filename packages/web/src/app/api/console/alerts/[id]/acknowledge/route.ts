/**
 * Acknowledge Alert API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/unified-auth';
import { acknowledgeAlert } from '@/lib/server/settler/alerts';
import { getPrimaryTenant } from '@/lib/supabase/tenant-helpers';
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = withUniversalBillingGate(async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate
    await requireAuth(request);
    
    // Get tenant ID
    const tenantId = await getPrimaryTenant();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'No tenant found' },
        { status: 400 }
      );
    }
    
    // Acknowledge alert
    const success = await acknowledgeAlert(tenantId, params.id);
    
    if (!success) {
      return NextResponse.json(
      {
        success: false,
        error: 'Failed to acknowledge alert',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Acknowledge Alert API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to acknowledge alert',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
  }
}, { feature: 'POST API' });