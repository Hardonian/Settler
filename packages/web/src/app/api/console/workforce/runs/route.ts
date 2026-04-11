/**
 * GET /api/console/workforce/runs — recent Prior Run Delta Analyst audit rows
 */

import { NextRequest, NextResponse } from "next/server";
import { withSecurity } from "@/lib/middleware/api-security";
import { prisma } from "@/shared/db/prismaClient";
import type { WorkerRun } from "@prisma/client";
import { gateConsoleTenant } from "../_shared";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const WORKER_KEY = "prior_run_delta_analyst";

export const GET = withSecurity(
  async function GET(request: NextRequest): Promise<NextResponse> {
    const gate = await gateConsoleTenant(request);
    if (!gate.ok) return gate.response;

    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20") || 20));

    const rows = await prisma.workerRun.findMany({
      where: { tenantId: gate.tenantId, workerKey: WORKER_KEY },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const data = rows.map((row: WorkerRun) => ({
      id: row.id,
      tenantId: row.tenantId,
      workerKey: row.workerKey,
      workerVersion: row.workerVersion,
      trigger: row.trigger,
      runDeltaId: row.runDeltaId,
      status: row.status,
      output: row.output,
      evidence: row.evidence,
      degradedReasons: row.degradedReasons,
      createdAt: row.createdAt.toISOString(),
      completedAt: row.completedAt.toISOString(),
    }));

    return NextResponse.json(
      { data, capability: { state: "available" } },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  },
  {
    rateLimit: { windowMs: 60_000, maxRequests: 60 },
    requireAuth: true,
  }
);
