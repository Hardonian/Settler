import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getConnectorDriver } from '@settler/adapters/src/drivers';
import { refreshTokenIfNeeded } from '@settler/adapters/src/token-refresh';

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
    const { tenantId } = body;

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

    // Get credentials
    const { data: connector } = await supabase
      .from('connectors')
      .select('id, config')
      .eq('tenant_id', tenantId)
      .eq('provider_id', providerId)
      .single();

    if (!connector) {
      return NextResponse.json(
        { error: 'Connector not found' },
        { status: 404 }
      );
    }

    const { data: credentials } = await supabase
      .from('connector_credentials')
      .select('*')
      .eq('connector_id', connector.id)
      .single();

    if (!credentials) {
      return NextResponse.json(
        { error: 'Credentials not found' },
        { status: 404 }
      );
    }

    // Refresh token
    const result = await refreshTokenIfNeeded(
      driver,
      providerId,
      tenantId,
      credentials as Record<string, unknown>,
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    if (!result.refreshed) {
      return NextResponse.json({
        success: false,
        message: result.error || 'Token refresh not needed or not supported',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
      result,
    });
  } catch (error) {
    console.error('Error in refresh route:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to refresh token',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
