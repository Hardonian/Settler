/**
 * Console Site Builder - Experiments API
 *
 * GET /api/console/site/experiments - List experiments for tenant
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
  async function GET(request: NextRequest) {
    try {
      const auth = await requireAuth(request);
      const tenantId = auth.tenantId;
      if (!tenantId) {
        return NextResponse.json({ experiments: [] }, { status: 200 });
      }

      await requirePermission(auth.userId, SiteBuilderPermission.VIEW_EXPERIMENT_RESULTS, tenantId);

      const experiments = await prisma.experiment.findMany({
        where: { tenantId },
        orderBy: { updatedAt: "desc" },
        include: {
          targetPage: {
            select: { id: true, slug: true, seoTitle: true },
          },
          variants: {
            select: { id: true, key: true, label: true },
            orderBy: { createdAt: "asc" },
          },
          _count: {
            select: { metricEvents: true },
          },
        },
      });

      return NextResponse.json({ experiments }, { status: 200 });
    } catch {
      return handleApiError(error, "Failed to load experiments");
    }
  },
  { rateLimit: { windowMs: 60_000, maxRequests: 60 }, requireAuth: true }
);

