/**
 * AI Tokens Usage API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/unified-auth';
import { getPrimaryTenant } from '@/lib/supabase/tenant-helpers';
import { getTokenUsage } from '@/lib/server/settler/ai-tokens';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    // Authenticate
    await requireAuth({} as NextRequest);
    
    // Get tenant ID
    const tenantId = await getPrimaryTenant();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'No tenant found' },
        { status: 400 }
      );
    }
    
    // Get token usage
    const usage = await getTokenUsage(tenantId);
    
    if (!usage) {
      return NextResponse.json(
        { error: 'Failed to get token usage' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ usage });
  } catch (error) {
    console.error('[AI Tokens Usage API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get token usage' },
      { status: 500 }
    );
  }
}
