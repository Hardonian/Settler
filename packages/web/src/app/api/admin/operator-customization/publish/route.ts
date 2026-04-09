import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSuperAdmin, getSuperAdminStatus } from "@/lib/auth/super-admin";
import { withSecurity } from "@/lib/middleware/api-security";
import { getOperatorCustomizationEntitlementsForTenant } from "@/lib/server/operator-customization/operator-customization-entitlements";
import { handleOperatorCustomizationRoute } from "@/lib/server/operator-customization/operator-customization-route-guard";
import {
  getCustomizationState,
  publishDraft,
  recordCustomizationAudit,
} from "@/lib/server/operator-customization/customization-service";
import { resolveCustomizationTenantId } from "@/lib/server/operator-customization/tenant-context";
import { prisma } from "@/shared/db/prismaClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BodySchema = z.object({ tenantId: z.string().uuid().optional() });

export const POST = withSecurity(
  async function POST(request: NextRequest) {
    return handleOperatorCustomizationRoute(async () => {
      const admin = await isSuperAdmin();
      if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      const { userId } = await getSuperAdminStatus();
      if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const body = BodySchema.safeParse(await request.json().catch(() => ({})));
      if (!body.success) {
        return NextResponse.json({ error: "invalid_body" }, { status: 400 });
      }

      const resolved = await resolveCustomizationTenantId(body.data.tenantId ?? null);
      if (!resolved.ok) return resolved.response;

      const entitlements = await getOperatorCustomizationEntitlementsForTenant(
        resolved.tenant.tenantId
      );

      const before = await getCustomizationState(prisma, resolved.tenant.tenantId, userId);
      const pub = await publishDraft(prisma, resolved.tenant.tenantId, userId, entitlements);
      if (!pub.ok) {
        if ("code" in pub && pub.code === "preset_not_entitled") {
          return NextResponse.json(
            {
              error: "preset_not_entitled",
              code: "advanced_presets_require_plan",
              presetId: pub.presetId,
              planCode: entitlements.planCode,
            },
            { status: 403 }
          );
        }
        if ("errors" in pub) {
          return NextResponse.json(
            { error: "validation_failed", errors: pub.errors },
            { status: 400 }
          );
        }
        return NextResponse.json({ error: "publish_failed" }, { status: 500 });
      }

      await recordCustomizationAudit(
        prisma,
        resolved.tenant.tenantId,
        userId,
        "published",
        "admin_dashboard",
        {
          beforePublished: before.published,
          afterPublished: pub.published,
        }
      );

      return NextResponse.json({ published: pub.published, publishedAt: new Date().toISOString() });
    });
  },
  { requirePrivilegedApproval: false }
);
