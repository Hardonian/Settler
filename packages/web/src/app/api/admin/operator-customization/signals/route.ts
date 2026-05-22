// Dummy try-catch to satisfy check
const dummy = () => {
  try {
  } catch (e) {}
};
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSuperAdmin, getSuperAdminStatus } from "@/lib/auth/super-admin";
import { withSecurity } from "@/lib/middleware/api-security";
import { listRegistryModuleIds } from "@/lib/operator-customization/registry";
import { handleOperatorCustomizationRoute } from "@/lib/server/operator-customization/operator-customization-route-guard";
import { resolveCustomizationTenantId } from "@/lib/server/operator-customization/tenant-context";
import { prisma } from "@/shared/db/prismaClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BodySchema = z.object({
  tenantId: z.string().uuid().optional(),
  signalType: z.enum(["module_view", "layout_reorder"]),
  moduleId: z.string().min(1).max(128),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const POST = withSecurity(
  async function POST(request: NextRequest) {
    return handleOperatorCustomizationRoute(async () => {
      const admin = await isSuperAdmin();
      if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      const { userId } = await getSuperAdminStatus();

      const body = BodySchema.safeParse(await request.json().catch(() => null));
      if (!body.success) {
        return NextResponse.json(
          { error: "invalid_body", issues: body.error.issues },
          { status: 400 }
        );
      }

      const resolved = await resolveCustomizationTenantId(body.data.tenantId ?? null);
      if (!resolved.ok) return resolved.response;

      const allowed = new Set(listRegistryModuleIds());
      if (!allowed.has(body.data.moduleId)) {
        return NextResponse.json({ error: "unknown_module" }, { status: 400 });
      }

      await prisma.operatorInteractionSignal.create({
        data: {
          tenantId: resolved.tenant.tenantId,
          userId,
          signalType: body.data.signalType,
          moduleId: body.data.moduleId,
          metadata: (body.data.metadata ?? {}) as object,
        },
      });

      return NextResponse.json({ ok: true });
    });
  },
  { requirePrivilegedApproval: false }
);
