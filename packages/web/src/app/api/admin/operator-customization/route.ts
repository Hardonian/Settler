/**
 * Operator Customization Studio — current draft/published state for admin dashboard surface.
 * Super-admin only. Tenant scoped via ?tenantId= or default slug tenant.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSuperAdmin, getSuperAdminStatus } from "@/lib/auth/super-admin";
import { withSecurity } from "@/lib/middleware/api-security";
import { ADMIN_DASHBOARD_MODULE_REGISTRY } from "@/lib/operator-customization/registry";
import { OperatorSurfaceCustomizationSchema } from "@/lib/operator-customization/schema";
import { getCustomizationState, saveDraft } from "@/lib/server/operator-customization/customization-service";
import { resolveCustomizationTenantId } from "@/lib/server/operator-customization/tenant-context";
import { prisma } from "@/shared/db/prismaClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withSecurity(async function GET(request: NextRequest) {
  const admin = await isSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const tenant = await resolveCustomizationTenantId(searchParams.get("tenantId"));
  if (!tenant.ok) return tenant.response;

  const { userId } = await getSuperAdminStatus();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = await getCustomizationState(prisma, tenant.tenantId, userId);

  return NextResponse.json({
    ...state,
    registry: Object.values(ADMIN_DASHBOARD_MODULE_REGISTRY),
    degraded: {
      inference: "rules_only",
      message:
        "Prompt-assisted proposals use deterministic rules only in this build. No LLM writes to config.",
    },
  });
});

const PutBodySchema = z.object({
  tenantId: z.string().uuid().optional(),
  draft: z.unknown(),
});

export const PUT = withSecurity(
  async function PUT(request: NextRequest) {
  const admin = await isSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { userId } = await getSuperAdminStatus();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = PutBodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "invalid_body", issues: body.error.issues }, { status: 400 });
  }

  const tenant = await resolveCustomizationTenantId(body.data.tenantId ?? null);
  if (!tenant.ok) return tenant.response;

  const parsedConfig = OperatorSurfaceCustomizationSchema.safeParse(body.data.draft);
  if (!parsedConfig.success) {
    return NextResponse.json(
      { error: "invalid_config", issues: parsedConfig.error.issues },
      { status: 400 }
    );
  }

  const saved = await saveDraft(prisma, tenant.tenantId, userId, parsedConfig.data);
  if (!saved.ok) {
    return NextResponse.json({ error: "validation_failed", errors: saved.errors }, { status: 400 });
  }

  await prisma.operatorCustomizationAudit.create({
    data: {
      tenantId: tenant.tenantId,
      userId,
      action: "draft_saved",
      surface: "admin_dashboard",
      details: { source: "studio_manual" },
    },
  });

  const state = await getCustomizationState(prisma, tenant.tenantId, userId);
  return NextResponse.json({
    ...state,
    registry: Object.values(ADMIN_DASHBOARD_MODULE_REGISTRY),
    degraded: {
      inference: "rules_only",
      message:
        "Prompt-assisted proposals use deterministic rules only in this build. No LLM writes to config.",
    },
  });
  },
  { requirePrivilegedApproval: false }
);
