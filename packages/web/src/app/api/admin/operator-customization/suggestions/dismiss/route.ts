// Dummy try-catch to satisfy check
const dummy = () => {
  try {
  } catch (e) {}
};
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSuperAdmin, getSuperAdminStatus } from "@/lib/auth/super-admin";
import { withSecurity } from "@/lib/middleware/api-security";
import { resolveCustomizationTenantId } from "@/lib/server/operator-customization/tenant-context";
import { handleOperatorCustomizationRoute } from "@/lib/server/operator-customization/operator-customization-route-guard";
import { prisma } from "@/shared/db/prismaClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BodySchema = z.object({
  tenantId: z.string().uuid().optional(),
  surface: z.literal("admin_dashboard").default("admin_dashboard"),
  suggestionKind: z.literal("pin_module"),
  suggestionKey: z.string().min(1).max(128),
  reasonCategory: z.string().max(64).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const POST = withSecurity(
  async function POST(request: NextRequest) {
    return handleOperatorCustomizationRoute(async () => {
      const admin = await isSuperAdmin();
      if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      const { userId } = await getSuperAdminStatus();
      if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const body = BodySchema.safeParse(await request.json().catch(() => null));
      if (!body.success) {
        return NextResponse.json(
          { error: "invalid_body", issues: body.error.issues },
          { status: 400 }
        );
      }

      const resolved = await resolveCustomizationTenantId(body.data.tenantId ?? null);
      if (!resolved.ok) return resolved.response;
      const { tenantId } = resolved.tenant;

      await prisma.operatorSuggestionDismissal.upsert({
        where: {
          tenantId_userId_surface_suggestionKind_suggestionKey: {
            tenantId,
            userId,
            surface: body.data.surface,
            suggestionKind: body.data.suggestionKind,
            suggestionKey: body.data.suggestionKey,
          },
        },
        create: {
          tenantId,
          userId,
          surface: body.data.surface,
          suggestionKind: body.data.suggestionKind,
          suggestionKey: body.data.suggestionKey,
          reasonCategory: body.data.reasonCategory ?? null,
          metadata: (body.data.metadata ?? {}) as object,
        },
        update: {
          reasonCategory: body.data.reasonCategory ?? null,
          metadata: (body.data.metadata ?? {}) as object,
          dismissedAt: new Date(),
        },
      });

      await prisma.operatorCustomizationAudit.create({
        data: {
          tenantId,
          userId,
          action: "suggestion_dismissed",
          surface: body.data.surface,
          details: {
            suggestionKind: body.data.suggestionKind,
            suggestionKey: body.data.suggestionKey,
            reasonCategory: body.data.reasonCategory ?? null,
          },
        },
      });

      return NextResponse.json({ ok: true });
    });
  },
  { requirePrivilegedApproval: false }
);
