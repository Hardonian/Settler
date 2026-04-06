/**
 * Operator Customization Studio — current draft/published state for admin dashboard surface.
 * Super-admin only. Tenant scoped via ?tenantId= or implicit single active tenant.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSuperAdmin, getSuperAdminStatus } from "@/lib/auth/super-admin";
import { withSecurity } from "@/lib/middleware/api-security";
import { ADMIN_DASHBOARD_MODULE_REGISTRY } from "@/lib/operator-customization/registry";
import { OperatorSurfaceCustomizationSchema } from "@/lib/operator-customization/schema";
import { getOperatorCustomizationEntitlementsForTenant } from "@/lib/server/operator-customization/operator-customization-entitlements";
import { handleOperatorCustomizationRoute } from "@/lib/server/operator-customization/operator-customization-route-guard";
import { getCustomizationState, saveDraft } from "@/lib/server/operator-customization/customization-service";
import { resolveCustomizationTenantId } from "@/lib/server/operator-customization/tenant-context";
import { prisma } from "@/shared/db/prismaClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withSecurity(async function GET(request: NextRequest) {
  return handleOperatorCustomizationRoute(async () => {
    const admin = await isSuperAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const resolved = await resolveCustomizationTenantId(searchParams.get("tenantId"));
    if (!resolved.ok) return resolved.response;

    const { userId } = await getSuperAdminStatus();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const entitlements = await getOperatorCustomizationEntitlementsForTenant(resolved.tenant.tenantId);
    const state = await getCustomizationState(prisma, resolved.tenant.tenantId, userId);

    return NextResponse.json({
      ...state,
      tenant: {
        id: resolved.tenant.tenantId,
        slug: resolved.tenant.tenantSlug,
        multiTenantEnvironment: resolved.tenant.multiTenantEnvironment,
      },
      entitlements,
      registry: Object.values(ADMIN_DASHBOARD_MODULE_REGISTRY),
      degraded: {
        inference: "rules_only",
        code: "rules_only_build",
        message:
          "Advisory proposals use deterministic rules only in this build. Nothing auto-publishes; review before apply.",
      },
    });
  });
});

const PutBodySchema = z.object({
  tenantId: z.string().uuid().optional(),
  draft: z.unknown(),
});

export const PUT = withSecurity(
  async function PUT(request: NextRequest) {
    return handleOperatorCustomizationRoute(async () => {
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

      const resolved = await resolveCustomizationTenantId(body.data.tenantId ?? null);
      if (!resolved.ok) return resolved.response;

      const entitlements = await getOperatorCustomizationEntitlementsForTenant(resolved.tenant.tenantId);

      const parsedConfig = OperatorSurfaceCustomizationSchema.safeParse(body.data.draft);
      if (!parsedConfig.success) {
        return NextResponse.json(
          { error: "invalid_config", issues: parsedConfig.error.issues },
          { status: 400 }
        );
      }

      const saved = await saveDraft(
        prisma,
        resolved.tenant.tenantId,
        userId,
        parsedConfig.data,
        entitlements
      );
      if (!saved.ok) {
        if ("code" in saved && saved.code === "preset_not_entitled") {
          return NextResponse.json(
            {
              error: "preset_not_entitled",
              code: "advanced_presets_require_plan",
              presetId: saved.presetId,
              planCode: entitlements.planCode,
            },
            { status: 403 }
          );
        }
        if ("errors" in saved) {
          return NextResponse.json({ error: "validation_failed", errors: saved.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "save_failed" }, { status: 500 });
      }

      await prisma.operatorCustomizationAudit.create({
        data: {
          tenantId: resolved.tenant.tenantId,
          userId,
          action: "draft_saved",
          surface: "admin_dashboard",
          details: { source: "studio_manual" },
        },
      });

      const state = await getCustomizationState(prisma, resolved.tenant.tenantId, userId);
      return NextResponse.json({
        ...state,
        tenant: {
          id: resolved.tenant.tenantId,
          slug: resolved.tenant.tenantSlug,
          multiTenantEnvironment: resolved.tenant.multiTenantEnvironment,
        },
        entitlements,
        registry: Object.values(ADMIN_DASHBOARD_MODULE_REGISTRY),
        degraded: {
          inference: "rules_only",
          code: "rules_only_build",
          message:
            "Advisory proposals use deterministic rules only in this build. Nothing auto-publishes; review before apply.",
        },
      });
    });
  },
  { requirePrivilegedApproval: false }
);
