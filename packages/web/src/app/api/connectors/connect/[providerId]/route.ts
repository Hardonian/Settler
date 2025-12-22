import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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
    const { tenantId, redirectUri, config } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    // Verify tenant access
    const { data: membership } = await (supabase as any)
      .from('app_private.memberships')
      .select('tenant_id')
      .eq('user_id', user.id)
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get auth URL if OAuth2
    if (driver.metadata.authType === 'oauth2' && driver.getAuthUrl) {
      const authUrl = await driver.getAuthUrl({
        tenantId,
        redirectUri: redirectUri || `${request.nextUrl.origin}/api/connectors/callback/${providerId}`,
        state: crypto.randomUUID(),
        scopes: config?.scopes,
      });

      // Store state in session/database for verification
      const { data: connector } = await (supabase as any)
        .from('connectors')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('provider_id', providerId)
        .single();

      if (!connector) {
        // Create connector record
        const { data: newConnector } = await (supabase as any)
          .from('connectors')
          .insert({
            tenant_id: tenantId,
            provider_id: providerId,
            display_name: driver.metadata.displayName,
            status: 'connecting',
            auth_type: driver.metadata.authType,
            config: config || {},
            created_by: user.id,
          })
          .select('id')
          .single();

        if (!newConnector) {
          return NextResponse.json(
            { error: 'Failed to create connector' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          authUrl,
          connectorId: (newConnector as { id: string }).id,
        });
      }

      return NextResponse.json({
        authUrl,
        connectorId: (connector as { id: string }).id,
      });
    }

    // For API key auth, return success (credentials will be stored separately)
    return NextResponse.json({
      success: true,
      message: 'Please provide API credentials',
    });
  } catch (error) {
    console.error('Error in connect route:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
