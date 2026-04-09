/**
 * Console Site Builder - Start Experiment API
 *
 * POST /api/console/site/experiments/:id/start
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/unified-auth";
import { requirePermission, SiteBuilderPermission } from "@/shared/auth/roles";
import { prisma } from "@/shared/db/prismaClient";
import { handleApiError } from "@/lib/api/error-handler";
import { withSecurity } from "@/lib/middleware/api-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const POST = withSecurity(
  async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
      const auth = await requireAuth(request);
      const tenantId = auth.tenantId;
      if (!tenantId) {
        return NextResponse.json({ success: false, error: "No tenant found" }, { status: 400 });
      }

      await requirePermission(auth.userId, SiteBuilderPermission.START_EXPERIMENT, tenantId);

      const experiment = await prisma.experiment.findFirst({
        where: { id: params.id, tenantId },
        select: { id: true, status: true },
      });
      if (!experiment) {
        return NextResponse.json(
          { success: false, error: "Experiment not found" },
          { status: 404 }
        );
      }

      if (experiment.status === "running") {
        return NextResponse.json({ success: true }, { status: 200 });
      }

      await prisma.experiment.update({
        where: { id: experiment.id },
        data: {
          status: "running",
          startsAt: new Date(),
        },
      });

      return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
      return handleApiError(error, "Failed to start experiment");
    }
  },
  { rateLimit: { windowMs: 60_000, maxRequests: 20 }, requireAuth: true }
);
