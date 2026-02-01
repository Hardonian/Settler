import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { asExtendedClient } from '@/lib/supabase/types';
import { getConnectorDriver, verifyWebhook } from '@settler/adapters';
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';
import { appLogger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = withUniversalBillingGate(async function POST(
  request: NextRequest,
  { params }: { params: { providerId: string } }
) {
  try {
    const providerId = params.providerId;
    const driver = getConnectorDriver(providerId);

    if (!driver || !driver.handleWebhook) {
      return NextResponse.json(
        { error: `Connector ${providerId} does not support webhooks` },
        { status: 400 }
      );
    }

    const rawBody = await request.text();
    const body = JSON.parse(rawBody) as Record<string, unknown>;
    const signature = request.headers.get('x-signature') || request.headers.get('x-webhook-signature') || '';

    // Verify webhook signature
    const webhookSecret = process.env[`${providerId.toUpperCase()}_WEBHOOK_SECRET`] || '';
    
    if (webhookSecret && signature) {
      const verification = verifyWebhook(providerId, rawBody, signature, webhookSecret);
      if (!verification.valid) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid webhook signature',
            message: verification.error,
          },
          { status: 401 }
        );
      }
    }

    // Store webhook event
    const supabase = await createClient();
    const typedSupabase = asExtendedClient(supabase);
    const webhookId = typeof body.id === 'string' 
      ? body.id 
      : typeof body.event_id === 'string' 
        ? body.event_id 
        : crypto.randomUUID();
    const eventType = typeof body.type === 'string' 
      ? body.type 
      : typeof body.event_type === 'string' 
        ? body.event_type 
        : 'unknown';
    
    const { error: webhookError } = await typedSupabase
      .from('webhook_events')
      .insert({
        connector_id: null, // Will be set after identifying tenant
        tenant_id: null, // Will be set after identifying tenant
        webhook_id: webhookId,
        event_type: eventType,
        payload: body,
        signature: signature || null,
        processed: false,
      });

    if (webhookError) {
      appLogger.error('Failed to store webhook event', webhookError);
    }

    // TODO: Verify webhook signature based on provider
    // TODO: Identify tenant from webhook payload
    // TODO: Get credentials and process webhook

    // For now, return success
    return NextResponse.json({
      success: true,
      message: 'Webhook received',
    });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
    appLogger.error('Error in webhook route', error);
    // Never return 500 - return graceful error response (webhooks should retry via their own mechanism)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process webhook',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 200 }
    );
  }
}, { feature: 'POST API' });
