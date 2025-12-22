import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getConnectorDriver } from '@settler/adapters/src/drivers';
import { ConnectorRuntime, RuntimeConfig } from '@settler/adapters/src/connector-runtime';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
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
    const { tenantId, since, until, accountId } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    // Verify tenant access
    const { data: membership } = await supabase
      .from('app_private.memberships')
      .select('tenant_id')
      .eq('user_id', user.id)
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Initialize runtime
    const runtimeConfig: RuntimeConfig = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    };

    const runtime = new ConnectorRuntime(runtimeConfig);

    // Execute sync
    const result = await runtime.executeSync(driver, tenantId, providerId, {
      since: since ? new Date(since) : undefined,
      until: until ? new Date(until) : undefined,
      accountId,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Error in sync route:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
