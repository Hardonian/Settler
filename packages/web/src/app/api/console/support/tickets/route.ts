import { NextRequest, NextResponse } from "next/server";
import { withSecurity } from "@/lib/middleware/api-security";
import { requireAdmin } from "@/lib/api/auth-gate";
import { prisma } from "@/shared/db/prismaClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type IntakeAuditMetadata = {
  submission_id?: string;
  category?: string;
  description?: string;
  run_id?: string | null;
  route?: string | null;
  module?: string | null;
  run_context?: {
    state?: string;
  };
};

export const GET = withSecurity(
  async function GET(request: NextRequest) {
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.isAdmin) {
      return adminCheck.error!;
    }

    const intakes = await prisma.auditLog.findMany({
      where: {
        action: "support_intake_submitted",
        resourceType: "support",
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        tenantId: true,
        userId: true,
        createdAt: true,
        metadata: true,
      },
    });

    const items = intakes.map((intake: (typeof intakes)[number]) => {
      const metadata = (intake.metadata ?? {}) as IntakeAuditMetadata;
      const description = typeof metadata.description === "string" ? metadata.description : "";
      const subject = description.split("\n")[0]?.trim() || "Support intake";

      return {
        id: intake.id,
        submissionId: metadata.submission_id ?? intake.id,
        tenantId: intake.tenantId,
        userId: intake.userId,
        subject,
        category: metadata.category ?? null,
        status: "submitted",
        route: metadata.route ?? null,
        module: metadata.module ?? null,
        runId: metadata.run_id ?? null,
        runContextState: metadata.run_context?.state ?? "unknown",
        createdAt: intake.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ items, count: items.length });
  },
  { rateLimit: { windowMs: 60_000, maxRequests: 100 }, requireAuth: true }
);

export const POST = withSecurity(
  async function POST() {
    return NextResponse.json(
      {
        code: "SUPPORT_INTAKE_APPEND_ONLY",
        message:
          "Support intake records are append-only via POST /api/v1/support/intake. Operator updates are not yet writable from this route.",
      },
      { status: 501 }
    );
  },
  { rateLimit: { windowMs: 60_000, maxRequests: 20 }, requireAuth: true }
);
