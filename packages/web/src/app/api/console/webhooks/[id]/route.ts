/**
 * Webhook Management API Route
 * 
 * PATCH - Update webhook
 * DELETE - Delete webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/unified-auth';
import { updateWebhook, deleteWebhook } from '@/lib/webhooks/manager';
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';
import { withSecurity } from '@/lib/middleware/api-security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const PATCH = withSecurity(
  withUniversalBillingGate(async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const authContext = await requireAuth(request);
    const { id } = await params;

    if (!authContext.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const webhook = await updateWebhook(id, authContext.userId, authContext.tenantId || authContext.userId, {
      url: body.url,
      events: body.events,
      status: body.active ? 'active' : 'inactive',
    });

    return NextResponse.json({ webhook });
  } catch {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to update webhook';
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}, { feature: 'PATCH API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 20 }, requireAuth: true }
);

export const DELETE = withSecurity(
  withUniversalBillingGate(async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const authContext = await requireAuth(request);
    const { id } = await params;

    if (!authContext.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await deleteWebhook(id, authContext.userId, authContext.tenantId || authContext.userId);

    return NextResponse.json({ success: true });
  } catch {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete webhook';
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}, { feature: 'DELETE API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 20 }, requireAuth: true }
);
