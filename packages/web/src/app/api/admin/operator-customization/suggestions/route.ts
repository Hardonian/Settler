import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getSuperAdminStatus } from "@/lib/auth/super-admin";
import { withSecurity } from "@/lib/middleware/api-security";
import { computeModuleVisitSuggestions } from "@/lib/operator-customization/suggestion-engine";
import { resolveCustomizationTenantId } from "@/lib/server/operator-customization/tenant-context";
import { prisma } from "@/shared/db/prismaClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withSecurity(async function GET(request: NextRequest) {
  const admin = await isSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { userId } = await getSuperAdminStatus();

  const { searchParams } = new URL(request.url);
  const tenant = await resolveCustomizationTenantId(searchParams.get("tenantId"));
  if (!tenant.ok) return tenant.response;

  const suggestions = await computeModuleVisitSuggestions(prisma, tenant.tenantId, userId ?? null);

  return NextResponse.json({
    suggestions,
    evidenceNote:
      "Counts are from operator_interaction_signals (module_view) in the last 7 days, tenant-scoped.",
  });
});
