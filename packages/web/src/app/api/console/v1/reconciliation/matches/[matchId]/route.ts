import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/shared/db/prismaClient";
import { requireConsoleTenantContext } from "@/lib/server/console-tenant";
import { TenantMembershipError } from "@/lib/supabase/tenant-membership";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { withSecurity } from "@/lib/middleware/api-security";
import { appLogger } from "@/lib/utils/logger";
import { z } from "zod";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PatchBodySchema = z.object({
  reviewed: z.boolean().optional(),
  reviewState: z
    .enum(["reviewed", "approved", "dismissed", "escalated", "pending_review"])
    .optional(),
});

type ReviewState = "reviewed" | "approved" | "dismissed" | "escalated" | "pending_review";

export const PATCH = withSecurity(
  withUniversalBillingGate(
    async function PATCH(request: NextRequest, context: { params: Promise<{ matchId: string }> }) {
      try {
        const { tenantId, userId } = await requireConsoleTenantContext(request);
        const { matchId } = await context.params;

        const json = await request.json().catch(() => ({}));
        const parsed = PatchBodySchema.safeParse(json);
        if (!parsed.success) {
          return NextResponse.json({ error: "Invalid request", details: parsed.error.issues }, {
            status: 400,
          });
        }
        const { reviewed, reviewState } = parsed.data;

        const normalizedReviewState: ReviewState =
          reviewState === "reviewed" ||
          reviewState === "approved" ||
          reviewState === "dismissed" ||
          reviewState === "escalated"
            ? reviewState
            : reviewed === true
              ? "reviewed"
              : "pending_review";

        const existing = await prisma.reconciliationMatch.findFirst({
          where: { id: matchId, tenantId },
        });

        if (!existing) {
          return NextResponse.json({ error: "Not Found", message: "Match not found" }, {
            status: 404,
          });
        }

        const meta =
          existing.metadata && typeof existing.metadata === "object" && !Array.isArray(existing.metadata)
            ? { ...(existing.metadata as Record<string, unknown>) }
            : {};
        meta.review_state = normalizedReviewState;

        await prisma.reconciliationMatch.update({
          where: { id: matchId, tenantId },
          data: {
            reviewed: reviewed === true,
            reviewedBy: userId,
            reviewedAt: new Date(),
            metadata: meta as Prisma.InputJsonValue,
          },
        });

        return NextResponse.json({
          id: matchId,
          reviewed: reviewed === true,
          reviewState: normalizedReviewState,
          reviewedAt: new Date().toISOString(),
        });
      } catch (err) {
        if (err instanceof TenantMembershipError) {
          return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
        }
        appLogger.error("Console reconciliation match patch failed", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
      }
    },
    { feature: "PATCH API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 60 }, requireAuth: true }
);
