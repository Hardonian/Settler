/**
 * Console API Keys API Route - Delete/Revoke
 * 
 * Supports both session auth (Console UI) and API key auth (SDK/CLI)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/unified-auth';
import { revokeApiKey } from '@/domain/console/apiKeys';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Authenticate using unified auth (session or API key)
    await requireAuth(request);
    
    const { id } = await params;
    await revokeApiKey(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    // If auth error, return 401
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // If permission error, return 403
    if (error instanceof Error && error.message.includes('Permission denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error revoking API key:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to revoke API key';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
