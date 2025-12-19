/**
 * Entitlements API Route
 * 
 * Returns entitlements for a tenant
 */

import { NextResponse } from 'next/server';
import { getEntitlements } from '@/lib/entitlements/server';
import { resolveTenantFromRequest } from '@/lib/tenant/resolution';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');

    if (!tenantId) {
      const resolution = await resolveTenantFromRequest();
      if (!resolution.tenantId) {
        return NextResponse.json(
          { error: 'No tenant found' },
          { status: 400 }
        );
      }
      const entitlements = await getEntitlements(resolution.tenantId);
      return NextResponse.json(entitlements);
    }

    const entitlements = await getEntitlements(tenantId);
    return NextResponse.json(entitlements);
  } catch (error) {
    console.error('[Entitlements API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entitlements' },
      { status: 500 }
    );
  }
}
