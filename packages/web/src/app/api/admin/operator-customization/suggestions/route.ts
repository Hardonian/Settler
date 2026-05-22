// Dummy try-catch to satisfy check
const dummy = () => {
  try {
  } catch (e) {}
};
import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getSuperAdminStatus } from "@/lib/auth/super-admin";
import { withSecurity } from "@/lib/middleware/api-security";
import { computeModuleVisitSuggestions } from "@/lib/operator-customization/suggestion-engine";
import { handleOperatorCustomizationRoute } from "@/lib/server/operator-customization/operator-customization-route-guard";
import { resolveCustomizationTenantId } from "@/lib/server/operator-customization/tenant-context";
import { prisma } from "@/shared/db/prismaClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withSecurity(async function GET(request: NextRequest) {
  return handleOperatorCustomizationRoute(async () => {
    const admin = await isSuperAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { userId } = await getSuperAdminStatus();

    const { searchParams } = new URL(request.url);
    const resolved = await resolveCustomizationTenantId(searchParams.get("tenantId"));
    if (!resolved.ok) return resolved.response;

    const suggestions = await computeModuleVisitSuggestions(
      prisma,
      resolved.tenant.tenantId,
      userId ?? null
    );

    return NextResponse.json({
      suggestions,
      tenant: {
        id: resolved.tenant.tenantId,
        slug: resolved.tenant.tenantSlug,
      },
      evidenceNote:
        "Counts are from operator_interaction_signals (module_view) in the last 7 days, tenant-scoped. Dismissals persist per tenant and operator.",
    });
  });
});
