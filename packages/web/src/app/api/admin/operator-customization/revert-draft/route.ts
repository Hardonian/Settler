import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSuperAdmin, getSuperAdminStatus } from "@/lib/auth/super-admin";
import { withSecurity } from "@/lib/middleware/api-security";
import { handleOperatorCustomizationRoute } from "@/lib/server/operator-customization/operator-customization-route-guard";
import {
  recordCustomizationAudit,
  revertPublishedToDraft,
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
      if (!body.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

      const resolved = await resolveCustomizationTenantId(body.data.tenantId ?? null);
      if (!resolved.ok) return resolved.response;

      const rev = await revertPublishedToDraft(prisma, resolved.tenant.tenantId, userId);
      if (!rev.ok) {
        return NextResponse.json(
          { error: "validation_failed", errors: rev.errors },
          { status: 400 }
        );
      }

      await recordCustomizationAudit(
        prisma,
        resolved.tenant.tenantId,
        userId,
        "draft_reverted_to_published",
        "admin_dashboard",
        {}
      );

      return NextResponse.json({ draft: rev.draft });
    });
  },
  { requirePrivilegedApproval: false }
);
