/**
 * Console Site Builder - Experiment Detail API
 *
 * GET /api/console/site/experiments/:id - Fetch experiment details
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/unified-auth";
import { requirePermission, SiteBuilderPermission } from "@/shared/auth/roles";
import { prisma } from "@/shared/db/prismaClient";
import { handleApiError } from "@/lib/api/error-handler";
import { withSecurity } from "@/lib/middleware/api-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withSecurity(
  async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
      const auth = await requireAuth(request);
      const tenantId = auth.tenantId;
      if (!tenantId) {
        return NextResponse.json({ experiment: null }, { status: 200 });
      }

      await requirePermission(auth.userId, SiteBuilderPermission.VIEW_EXPERIMENT_RESULTS, tenantId);

      const experiment = await prisma.experiment.findFirst({
        where: { id: params.id, tenantId },
        include: {
          targetPage: { select: { id: true, slug: true, seoTitle: true } },
          variants: { select: { id: true, key: true, label: true }, orderBy: { createdAt: "asc" } },
        },
      });

      return NextResponse.json({ experiment }, { status: 200 });
    } catch (error) {
      return handleApiError(error, "Failed to load experiment");
    }
  },
  { rateLimit: { windowMs: 60_000, maxRequests: 60 }, requireAuth: true }
);

