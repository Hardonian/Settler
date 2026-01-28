import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { asExtendedClient } from '@/lib/supabase/types';
import { getConnectorDriver } from '@settler/adapters';
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';
import { appLogger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = withUniversalBillingGate(async function POST(
  request: NextRequest,
  { params }: { params: { providerId: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const providerId = params.providerId;
    const driver = getConnectorDriver(providerId);

    if (!driver) {
      return NextResponse.json(
        { error: `Connector ${providerId} not found` },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { tenantId, credentials, config } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    const typedSupabase = asExtendedClient(supabase);

    // Verify tenant access
    const { data: membership } = await typedSupabase
      .from('app_private.memberships')
      .select('tenant_id')
      .eq('user_id', user.id)
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Test connection
    const result = await driver.testConnection({
      credentials: credentials || {},
      config: config || {},
    });

    return NextResponse.json(result);
  } catch (error) {
    appLogger.error('Error in test route', error);
    // Never return 500 - return graceful error response
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to test connection',
        message: error instanceof Error ? error.message : String(error),
        result: null,
      },
      { status: 200 }
    );
  }
}, { feature: 'POST API' });
