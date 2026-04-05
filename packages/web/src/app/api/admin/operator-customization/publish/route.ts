import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSuperAdmin, getSuperAdminStatus } from "@/lib/auth/super-admin";
import { withSecurity } from "@/lib/middleware/api-security";
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
  const admin = await isSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { userId } = await getSuperAdminStatus();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = BodySchema.safeParse(await request.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const tenant = await resolveCustomizationTenantId(body.data.tenantId ?? null);
  if (!tenant.ok) return tenant.response;

  const before = await getCustomizationState(prisma, tenant.tenantId, userId);
  const pub = await publishDraft(prisma, tenant.tenantId, userId);
  if (!pub.ok) {
    return NextResponse.json({ error: "validation_failed", errors: pub.errors }, { status: 400 });
  }

  await recordCustomizationAudit(prisma, tenant.tenantId, userId, "published", "admin_dashboard", {
    beforePublished: before.published,
    afterPublished: pub.published,
  });

  return NextResponse.json({ published: pub.published, publishedAt: new Date().toISOString() });
  },
  { requirePrivilegedApproval: false }
);
