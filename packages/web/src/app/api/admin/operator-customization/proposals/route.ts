import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSuperAdmin, getSuperAdminStatus } from "@/lib/auth/super-admin";
import { withSecurity } from "@/lib/middleware/api-security";
import { CustomizationPatchSchema } from "@/lib/operator-customization/schema";
import { buildProposalFromNaturalLanguage } from "@/lib/operator-customization/proposal-rules";
import { resolveCustomizationTenantId } from "@/lib/server/operator-customization/tenant-context";
import { prisma } from "@/shared/db/prismaClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PostBodySchema = z.object({
  tenantId: z.string().uuid().optional(),
  request: z.string().min(1).max(4000),
});

export const POST = withSecurity(
  async function POST(request: NextRequest) {
  const admin = await isSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { userId } = await getSuperAdminStatus();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = PostBodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "invalid_body", issues: body.error.issues }, { status: 400 });
  }

  const tenant = await resolveCustomizationTenantId(body.data.tenantId ?? null);
  if (!tenant.ok) return tenant.response;

  const built = buildProposalFromNaturalLanguage(body.data.request);
  if (!built.ok) {
    const row = await prisma.operatorCustomizationProposal.create({
      data: {
        tenantId: tenant.tenantId,
        userId,
        surface: "admin_dashboard",
        status: "rejected",
        naturalLanguageRequest: body.data.request,
        structuredPatch: {},
        rationale: built.reason,
        inferenceMode: built.inferenceMode,
        rejectedAt: new Date(),
      },
    });
    return NextResponse.json(
      {
        proposal: {
          id: row.id,
          status: "rejected",
          rationale: built.reason,
          inferenceMode: built.inferenceMode,
        },
      },
      { status: 422 }
    );
  }

  const parsedPatch = CustomizationPatchSchema.safeParse(built.patch);
  if (!parsedPatch.success) {
    return NextResponse.json({ error: "patch_invalid", issues: parsedPatch.error.issues }, { status: 500 });
  }

  const row = await prisma.operatorCustomizationProposal.create({
    data: {
      tenantId: tenant.tenantId,
      userId,
      surface: "admin_dashboard",
      status: "pending",
      naturalLanguageRequest: body.data.request,
      structuredPatch: parsedPatch.data as object,
      rationale: built.rationale,
      inferenceMode: built.inferenceMode,
    },
  });

  return NextResponse.json({
    proposal: {
      id: row.id,
      status: row.status,
      patch: parsedPatch.data,
      rationale: built.rationale,
      inferenceMode: built.inferenceMode,
    },
  });
  },
  { requirePrivilegedApproval: false }
);

export const GET = withSecurity(async function GET(request: NextRequest) {
  const admin = await isSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const tenant = await resolveCustomizationTenantId(searchParams.get("tenantId"));
  if (!tenant.ok) return tenant.response;

  const limit = Math.min(Number(searchParams.get("limit") ?? "20") || 20, 50);

  const rows = await prisma.operatorCustomizationProposal.findMany({
    where: { tenantId: tenant.tenantId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      status: true,
      naturalLanguageRequest: true,
      structuredPatch: true,
      rationale: true,
      inferenceMode: true,
      createdAt: true,
      appliedAt: true,
      rejectedAt: true,
    },
  });

  return NextResponse.json({ items: rows });
});
