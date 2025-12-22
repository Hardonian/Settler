import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getConnectorDriver } from '@settler/adapters/src/drivers';
import { verifyWebhook } from '@settler/adapters/src/webhook-verification';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
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
    const body = JSON.parse(rawBody);
    const signature = request.headers.get('x-signature') || request.headers.get('x-webhook-signature') || '';

    // Verify webhook signature
    const config = {}; // TODO: Get webhook secret from connector config
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
    const { data: webhookEvent, error: webhookError } = await supabase
      .from('webhook_events')
      .insert({
        connector_id: null, // Will be set after identifying tenant
        tenant_id: null, // Will be set after identifying tenant
        webhook_id: body.id || body.event_id || crypto.randomUUID(),
        event_type: body.type || body.event_type || 'unknown',
        payload: body,
        signature: request.headers.get('x-signature') || undefined,
        processed: false,
      })
      .select('id')
      .single();

    if (webhookError) {
      console.error('Failed to store webhook event:', webhookError);
    }

    // TODO: Verify webhook signature based on provider
    // TODO: Identify tenant from webhook payload
    // TODO: Get credentials and process webhook

    // For now, return success
    return NextResponse.json({
      success: true,
      message: 'Webhook received',
    });
  } catch (error) {
    console.error('Error in webhook route:', error);
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
