/**
 * Webhooks API Route
 * 
 * GET - List webhooks
 * POST - Create webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/unified-auth';
import { createWebhook, listWebhooks, CreateWebhookInput } from '@/lib/webhooks/manager';
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = withUniversalBillingGate(async function GET(request: NextRequest) {
  try {
    const authContext = await requireAuth(request);
    
    if (!authContext.userId) {
      return NextResponse.json({ webhooks: [] });
    }

    const webhooks = await listWebhooks(authContext.userId, authContext.tenantId || authContext.userId);

    // Don't expose secrets in list
    const safeWebhooks = webhooks.map((w) => ({
      ...w,
      secret: w.secret.substring(0, 12) + '...', // Show only prefix
    }));

    return NextResponse.json({ webhooks: safeWebhooks });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Webhooks API] Error:', error);
    return NextResponse.json({ webhooks: [] });
  }
}, { feature: 'GET API' });

export const POST = withUniversalBillingGate(async function POST(request: NextRequest) {
  try {
    const authContext = await requireAuth(request);
    
    if (!authContext.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    
    // Validate inputs
    if (!body.url || typeof body.url !== 'string') {
      return NextResponse.json({ error: 'URL is required and must be a string' }, { status: 400 });
    }

    if (!body.events || !Array.isArray(body.events)) {
      return NextResponse.json({ error: 'Events must be an array' }, { status: 400 });
    }

    const input: CreateWebhookInput = {
      url: body.url,
      events: body.events,
      secret: body.secret,
    };

    const webhook = await createWebhook(authContext.userId, authContext.tenantId || authContext.userId, input);

    // Return full secret only on creation
    return NextResponse.json({ webhook }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to create webhook';
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}, { feature: 'POST API' });
