/**
 * Active tenants for super-admin customization targeting (explicit tenant selection in multi-tenant envs).
 */

import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { withSecurity } from "@/lib/middleware/api-security";
import { listActiveTenantsForPicker } from "@/lib/server/operator-customization/tenant-context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withSecurity(async function GET(_request: NextRequest) {
  const admin = await isSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const items = await listActiveTenantsForPicker();
  return NextResponse.json({
    items,
    activeTenantCount: items.length,
  });
});
