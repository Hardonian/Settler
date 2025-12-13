/**
 * Console API Keys API Route - Delete/Revoke
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { revokeApiKey } from '@/domain/console/apiKeys';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Supabase admin client

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
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
