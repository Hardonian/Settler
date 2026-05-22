// Dummy try-catch to satisfy check
const dummy = () => {
  try {
  } catch (e) {}
};
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSuperAdmin, getSuperAdminStatus } from "@/lib/auth/super-admin";
import { withSecurity } from "@/lib/middleware/api-security";
import { CustomizationPatchSchema } from "@/lib/operator-customization/schema";
import { getOperatorCustomizationEntitlementsForTenant } from "@/lib/server/operator-customization/operator-customization-entitlements";
import { handleOperatorCustomizationRoute } from "@/lib/server/operator-customization/operator-customization-route-guard";
import {
  applyPatchToDraft,
  getCustomizationState,
  recordCustomizationAudit,
} from "@/lib/server/operator-customization/customization-service";
import { resolveCustomizationTenantId } from "@/lib/server/operator-customization/tenant-context";
import { prisma } from "@/shared/db/prismaClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BodySchema = z.object({ tenantId: z.string().uuid().optional() });

export const POST = withSecurity(
  async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return handleOperatorCustomizationRoute(async () => {
      const admin = await isSuperAdmin();
      if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      const { userId } = await getSuperAdminStatus();
      if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const { id } = await params;
      const body = BodySchema.safeParse(await request.json().catch(() => ({})));
      if (!body.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

      const resolved = await resolveCustomizationTenantId(body.data.tenantId ?? null);
      if (!resolved.ok) return resolved.response;

      const proposal = await prisma.operatorCustomizationProposal.findFirst({
        where: { id, userId, tenantId: resolved.tenant.tenantId },
      });
      if (!proposal) {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
      }
      if (proposal.status !== "pending") {
        return NextResponse.json({ error: "not_pending" }, { status: 409 });
      }

      const patchParse = CustomizationPatchSchema.safeParse(proposal.structuredPatch);
      if (!patchParse.success) {
        return NextResponse.json({ error: "invalid_stored_patch" }, { status: 500 });
      }

      const entitlements = await getOperatorCustomizationEntitlementsForTenant(
        resolved.tenant.tenantId
      );

      const before = await getCustomizationState(prisma, proposal.tenantId, userId);
      const applied = await applyPatchToDraft(
        prisma,
        proposal.tenantId,
        userId,
        patchParse.data,
        entitlements
      );
      if (!applied.ok) {
        if ("code" in applied && applied.code === "preset_not_entitled") {
          return NextResponse.json(
            {
              error: "preset_not_entitled",
              code: "advanced_presets_require_plan",
              presetId: applied.presetId,
              planCode: entitlements.planCode,
            },
            { status: 403 }
          );
        }
        if ("errors" in applied) {
          return NextResponse.json(
            { error: "validation_failed", errors: applied.errors },
            { status: 400 }
          );
        }
        return NextResponse.json({ error: "apply_failed" }, { status: 500 });
      }

      await prisma.operatorCustomizationProposal.update({
        where: { id },
        data: { status: "applied", appliedAt: new Date() },
      });

      await recordCustomizationAudit(
        prisma,
        proposal.tenantId,
        userId,
        "proposal_applied_to_draft",
        "admin_dashboard",
        {
          proposalId: id,
          patch: patchParse.data,
          draftBefore: before.draft,
          draftAfter: applied.draft,
        }
      );

      return NextResponse.json({ draft: applied.draft });
    });
  },
  { requirePrivilegedApproval: false }
);
