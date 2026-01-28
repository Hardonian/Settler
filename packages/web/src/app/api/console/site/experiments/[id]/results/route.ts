/**
 * Console Site Builder - Experiment Results API
 *
 * GET /api/console/site/experiments/:id/results
 *
 * Returns aggregated metrics for each variant:
 * - views, clicks, conversions, conversionRate
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/unified-auth";
import { requirePermission, SiteBuilderPermission } from "@/shared/auth/roles";
import { prisma } from "@/shared/db/prismaClient";
import { handleApiError } from "@/lib/api/error-handler";
import { withSecurity } from "@/lib/middleware/api-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type VariantResult = {
  key: string;
  label: string;
  views: number;
  clicks: number;
  conversions: number;
  conversionRate: number;
};

export const GET = withSecurity(
  async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
      const auth = await requireAuth(request);
      const tenantId = auth.tenantId;
      if (!tenantId) {
        return NextResponse.json({ results: [] }, { status: 200 });
      }

      await requirePermission(auth.userId, SiteBuilderPermission.VIEW_EXPERIMENT_RESULTS, tenantId);

      const experiment = await prisma.experiment.findFirst({
        where: { id: params.id, tenantId },
        include: {
          variants: { select: { key: true, label: true } },
        },
      });
      if (!experiment) {
        return NextResponse.json({ results: [] }, { status: 200 });
      }

      const events = await prisma.experimentMetricEvent.findMany({
        where: { experimentId: experiment.id, tenantId },
        select: { variantKey: true, eventType: true },
      });

      const byVariant = new Map<string, { views: number; clicks: number; conversions: number }>();
      for (const v of experiment.variants) {
        byVariant.set(v.key, { views: 0, clicks: 0, conversions: 0 });
      }
      for (const e of events) {
        const v = byVariant.get(e.variantKey) ?? { views: 0, clicks: 0, conversions: 0 };
        if (e.eventType === "view") v.views += 1;
        if (e.eventType === "click") v.clicks += 1;
        if (e.eventType === "conversion") v.conversions += 1;
        byVariant.set(e.variantKey, v);
      }

      const results: VariantResult[] = experiment.variants.map((v) => {
        const counts = byVariant.get(v.key) ?? { views: 0, clicks: 0, conversions: 0 };
        const conversionRate =
          counts.views > 0 ? Math.round((counts.conversions / counts.views) * 10000) / 100 : 0;
        return {
          key: v.key,
          label: v.label,
          views: counts.views,
          clicks: counts.clicks,
          conversions: counts.conversions,
          conversionRate,
        };
      });

      return NextResponse.json({ results }, { status: 200 });
    } catch (error) {
      return handleApiError(error, "Failed to load experiment results");
    }
  },
  { rateLimit: { windowMs: 60_000, maxRequests: 60 }, requireAuth: true }
);

