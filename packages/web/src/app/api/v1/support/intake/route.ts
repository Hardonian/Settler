/**
 * POST /api/v1/support/intake — canonical tenant-scoped support intake (Next BFF).
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { withSecurity } from "@/lib/middleware/api-security";
import { prisma } from "@/shared/db/prismaClient";
import {
  buildTenantContextErrorResponse,
  requireTenantRequestContext,
} from "@/lib/api/tenant-context";
import { buildSupportIntakeRunContext } from "@settler/reconciliation-core";
import { submitSupportIntake } from "@settler/support-intake";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  category: z.string().min(1),
  description: z.string().min(20).max(5000),
  run_id: z.string().optional(),
  route: z.string().optional(),
  module: z.string().optional(),
  contact: z
    .object({
      user_id: z.string().optional(),
      email: z.string().email().optional(),
      role: z.string().optional(),
    })
    .optional(),
  operator_triage_priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
});

export const POST = withSecurity(
  withUniversalBillingGate(
    async function POST(request: NextRequest) {
      try {
        const { userId, tenantId } = await requireTenantRequestContext(request);
        const raw = await request.json();
        const parsed = bodySchema.safeParse(raw);
        if (!parsed.success) {
          return NextResponse.json(
            {
              error: "Support intake request is invalid",
              code: "INVALID_SUPPORT_INTAKE",
              details: parsed.error.flatten(),
            },
            { status: 400 }
          );
        }

        const stored = await submitSupportIntake({
          prisma,
          userId,
          tenantId,
          path: request.nextUrl.pathname,
          body: parsed.data,
          resolveRunContext: (tid, runId) => buildSupportIntakeRunContext(prisma, tid, runId),
        });

        return NextResponse.json(
          {
            accepted: true,
            submission_id: stored.submissionId,
            tenant_id: stored.tenantId,
            created_at: stored.createdAt,
          },
          { status: 202 }
        );
      } catch (error) {
        return buildTenantContextErrorResponse(error);
      }
    },
    { feature: "POST API" }
  ),
  { rateLimit: { windowMs: 60_000, maxRequests: 30 }, requireAuth: true }
);
