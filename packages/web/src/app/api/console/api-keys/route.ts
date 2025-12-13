/**
 * Console API Keys API Route
 * 
 * GET - List API keys
 * POST - Create API key
 * 
 * Supports both session auth (Console UI) and API key auth (SDK/CLI)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/unified-auth';
import { listApiKeys, createApiKey } from '@/domain/console/apiKeys';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Authenticate using unified auth (session or API key)
    await requireAuth(request);
    
    const keys = await listApiKeys();
    return NextResponse.json({ keys });
  } catch (error) {
    // If auth error, return 401
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Console API Keys] Error:', error);
    // Return 200 with empty array instead of 500 to prevent crashes
    return NextResponse.json({ keys: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate using unified auth (session or API key)
    await requireAuth(request);
    
    const body = await request.json();
    const result = await createApiKey(undefined, {
      name: body.name,
      scopes: body.scopes,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    } as CreateApiKeyInput);

    return NextResponse.json(result);
  } catch (error) {
    // If auth error, return 401
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // If permission error, return 403
    if (error instanceof Error && error.message.includes('Permission denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('[Console API Keys] Error creating:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create API key';
    // Return 200 with error message instead of 500
    return NextResponse.json(
      { error: errorMessage },
      { status: 200 }
    );
  }
}
