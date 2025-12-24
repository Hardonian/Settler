import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { asExtendedClient } from '@/lib/supabase/types';
import { getConnectorDriver } from '@settler/adapters/src/drivers';

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

    // Get connector
    const { data: connector } = await typedSupabase
      .from('connectors')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('provider_id', providerId)
      .single();

    if (!connector) {
      return NextResponse.json(
        { error: 'Connector not found' },
        { status: 404 }
      );
    }

    // Get credentials for revoke
    const { data: credentials } = await typedSupabase
      .from('connector_credentials')
      .select('access_token_encrypted')
      .eq('connector_id', connector.id)
      .single();

    // Revoke tokens if driver supports it
    if (driver.revoke && credentials?.access_token_encrypted) {
      try {
        const accessToken = typeof credentials.access_token_encrypted === 'string' 
          ? credentials.access_token_encrypted 
          : '';
        if (accessToken) {
          await driver.revoke(accessToken, { tenantId });
        }
      } catch (error) {
        console.error('Failed to revoke token:', error);
        // Continue with disconnection even if revoke fails
      }
    }

    // Delete credentials
    await typedSupabase
      .from('connector_credentials')
      .delete()
      .eq('connector_id', connector.id);

    // Update connector status
    await typedSupabase
      .from('connectors')
      .update({
        status: 'disconnected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', connector.id);

    return NextResponse.json({
      success: true,
      message: 'Connector disconnected successfully',
    });
  } catch (error) {
    console.error('Error in disconnect route:', error);
    // Never return 500 - return graceful error response
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to disconnect connector',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 }
    );
  }
}
