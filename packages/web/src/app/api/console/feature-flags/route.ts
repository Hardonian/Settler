/**
 * Feature Flags API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/unified-auth';
import { getFeatureFlags, setFeatureFlag } from '@/lib/server/settler/feature-flags';
import { getPrimaryTenant } from '@/lib/supabase/tenant-helpers';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SetFlagSchema = z.object({
  key: z.string().min(1),
  value: z.union([z.boolean(), z.number(), z.string(), z.record(z.string(), z.unknown())]),
});

export async function GET(request: NextRequest) {
  try {
    // Authenticate
    await requireAuth(request);
    
    // Get tenant ID
    const tenantId = await getPrimaryTenant();
    if (!tenantId) {
      return NextResponse.json({ flags: [] }, { status: 200 });
    }
    
    // Get flags
    const flags = await getFeatureFlags(tenantId);
    
    return NextResponse.json({ flags });
  } catch (error) {
    console.error('[Feature Flags API] Error:', error);
    return NextResponse.json({ flags: [] }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    await requireAuth(request);
    
    // Get tenant ID
    const tenantId = await getPrimaryTenant();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'No tenant found' },
        { status: 400 }
      );
    }
    
    // Parse and validate body
    const body = await request.json();
    const { key, value } = SetFlagSchema.parse(body);
    
    // Set flag
    const success = await setFeatureFlag(tenantId, key, value);
    
    if (!success) {
      return NextResponse.json(
      {
        success: false,
        error: 'Failed to set feature flag',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('[Feature Flags API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to set feature flag',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
  }
}
