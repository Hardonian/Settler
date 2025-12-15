/**
 * Webhooks API Route
 * 
 * GET - List webhooks
 * POST - Create webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/unified-auth';
import { prisma } from '@/shared/db/prismaClient';
import { createWebhook, listWebhooks, CreateWebhookInput } from '@/lib/webhooks/manager';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const authContext = await requireAuth(request);
    
    if (!authContext.billingAccountId) {
      return NextResponse.json({ webhooks: [] });
    }

    const webhooks = await listWebhooks(authContext.billingAccountId);

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
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await requireAuth(request);
    
    if (!authContext.billingAccountId) {
      return NextResponse.json({ error: 'Billing account not found' }, { status: 404 });
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

    const webhook = await createWebhook(authContext.billingAccountId, input);

    // Return full secret only on creation
    return NextResponse.json({ webhook }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to create webhook';
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
