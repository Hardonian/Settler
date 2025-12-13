/**
 * Console API Keys API Route
 * 
 * GET - List API keys
 * POST - Create API key
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listApiKeys, createApiKey } from '@/domain/console/apiKeys';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Supabase admin client

export async function GET() {
  try {
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
    const body = await request.json();
    const result = await createApiKey(undefined, {
      name: body.name,
      scopes: body.scopes,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    });

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
    console.error('Error creating API key:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create API key';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
