/**
 * Console API Keys API Route - Delete/Revoke
 * 
 * Supports both session auth (Console UI) and API key auth (SDK/CLI)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/unified-auth';
import { revokeApiKey } from '@/domain/console/apiKeys';
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';
import { appLogger } from '@/lib/utils/logger';
import { withSecurity } from '@/lib/middleware/api-security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const DELETE = withSecurity(
  withUniversalBillingGate(async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Authenticate using unified auth (session or API key)
    await requireAuth(request);
    
    const { id } = await params;
    await revokeApiKey(id);

    return NextResponse.json({ success: true });
  } catch {
    // If auth error, return 401
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // If permission error, return 403
    if (error instanceof Error && error.message.includes('Permission denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    appLogger.error('[Console API Keys] Error revoking', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to revoke API key';
    // Return 200 with error instead of 500
    return NextResponse.json(
      { error: errorMessage, success: false },
      { status: 200 }
    );
  }
}, { feature: 'DELETE API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 20 }, requireAuth: true }
);
