import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { asExtendedClient } from '@/lib/supabase/types';
import { getConnectorDriver } from '@settler/adapters/src/drivers';
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';
import { emitLifecycleEventSafe, LifecycleEventType } from '@/lib/ops/lifecycle-events';
import { prisma } from '@/shared/db/prismaClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = withUniversalBillingGate(async function GET(
  request: NextRequest,
  { params }: { params: { providerId: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    const providerId = params.providerId;
    const driver = getConnectorDriver(providerId);

    if (!driver || !driver.handleCallback) {
      return NextResponse.json(
        { error: `Connector ${providerId} does not support OAuth callback` },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/dashboard/integrations?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
    }

    const typedSupabase = asExtendedClient(supabase);

    // Get connector config
    const { data: connectors } = await typedSupabase
      .from('connectors')
      .select('id, tenant_id, config')
      .eq('provider_id', providerId)
      .eq('status', 'connecting')
      .limit(1);

    if (!connectors || connectors.length === 0) {
      return NextResponse.json({ error: 'Connector not found' }, { status: 404 });
    }

    const connector = connectors[0];
    if (!connector) {
      return NextResponse.json({ error: 'Connector not found' }, { status: 404 });
    }

    // Verify tenant access
    const { data: membership } = await typedSupabase
      .from('app_private.memberships')
      .select('tenant_id')
      .eq('user_id', user.id)
      .eq('tenant_id', connector.tenant_id)
      .eq('status', 'active')
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Handle callback
    const redirectUri = `${request.nextUrl.origin}/api/connectors/callback/${providerId}`;
    const tenantId = typeof connector.tenant_id === 'string' ? connector.tenant_id : '';
    if (!tenantId) {
      return NextResponse.json({ error: 'Invalid connector tenant_id' }, { status: 400 });
    }
    const authResult = await driver.handleCallback(code, state || '', {
      tenantId,
      redirectUri,
    });

    // Store credentials (encrypted)
    const { error: credError } = await typedSupabase
      .from('connector_credentials')
      .upsert({
        connector_id: typeof connector.id === 'string' ? connector.id : '',
        tenant_id: tenantId,
        encrypted_credentials: {}, // Should encrypt
        access_token_encrypted: authResult.accessToken, // Should encrypt
        refresh_token_encrypted: authResult.refreshToken, // Should encrypt
        token_expires_at: authResult.expiresIn
          ? new Date(Date.now() + authResult.expiresIn * 1000).toISOString()
          : null,
      }, {
        onConflict: 'connector_id',
      });

    if (credError) {
      console.error('Failed to store credentials:', credError);
      return NextResponse.redirect(
        new URL('/dashboard/integrations?error=Failed to store credentials', request.url)
      );
    }

    // Update connector status
    await typedSupabase
      .from('connectors')
      .update({
        status: 'connected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', connector.id);

    // Emit lifecycle event: provider connected
    try {
      // Check if this is the first provider connection for this tenant
      const otherConnectors = await typedSupabase
        .from('connectors')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('status', 'connected')
        .neq('id', connector.id)
        .limit(1);

      const isFirstConnection = !otherConnectors.data || otherConnectors.data.length === 0;

      // Get billing account for tenant
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { billingAccountId: true },
      });

      await emitLifecycleEventSafe(LifecycleEventType.PROVIDER_CONNECTED, {
        userId: user.id,
        tenantId,
        billingAccountId: tenant?.billingAccountId || undefined,
        properties: {
          provider_id: providerId,
          is_first_connection: isFirstConnection,
        },
      });
    } catch (eventError) {
      // Don't fail the connection if event emission fails
      console.error('Failed to emit provider connected event:', eventError);
    }

    return NextResponse.redirect(
      new URL('/dashboard/integrations?success=Connected successfully', request.url)
    );
  } catch (error) {
    console.error('Error in callback route:', error);
    return NextResponse.redirect(
      new URL(
        `/dashboard/integrations?error=${encodeURIComponent(
          error instanceof Error ? error.message : 'Callback failed'
        )}`,
        request.url
      )
    );
  }
}, { feature: 'GET API' });