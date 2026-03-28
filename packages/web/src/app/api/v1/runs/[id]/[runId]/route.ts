// ROUTE_CLASS: api-key-service
// AUTH: API key auth — tenant isolated via ctx.tenantId in all queries
import { NextRequest, NextResponse } from "next/server";
import {
  applyRateLimit,
  buildContext,
  fail,
  ok,
  recordRequestMetrics,
} from "@/lib/api/v1/recon/core";
import { prisma } from "@/shared/db/prismaClient";
import { buildCanonicalRunResultContract } from "@settler/reconciliation-core";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await buildContext(request);
  if (ctx instanceof NextResponse) return ctx;

  if (
    !ctx.tenantId ||
    typeof ctx.tenantId !== "string" ||
    ctx.tenantId.trim() === "" ||
    ctx.tenantId === "—"
  ) {
    return NextResponse.json(
      {
        error: "Unauthorized: Valid tenant workspace context is strictly required.",
        code: "SETTLER_UNAUTHORIZED",
      },
      { status: 401 }
    );
  }

  const started = Date.now();
  const limited = await applyRateLimit(ctx, "read");
  if (limited) {
    await recordRequestMetrics(ctx, {
      route: `/api/v1/runs/${params.id}`,
      method: "GET",
      statusCode: 429,
      latencyMs: Date.now() - started,
      cacheHit: false,
      rateLimited: true,
    });
    return limited;
  }

  try {
    const run = await prisma.reconJob.findUnique({
      where: {
        id: params.id,
        tenantId: ctx.tenantId,
      },
    });

    if (!run) {
      await recordRequestMetrics(ctx, {
        route: `/api/v1/runs/${params.id}`,
        method: "GET",
        statusCode: 404,
        latencyMs: Date.now() - started,
        cacheHit: false,
        rateLimited: false,
      });
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    const latestResult = await prisma.reconResult.findFirst({
      where: {
        reconJobId: params.id,
        tenantId: ctx.tenantId,
      },
      orderBy: {
        startedAt: "desc",
      },
    });

    const snapshot = latestResult?.snapshotId
      ? await prisma.runSnapshot.findUnique({
          where: {
            id: latestResult.snapshotId,
            tenantId: ctx.tenantId,
          },
        })
      : null;

    const [exceptionAggregateRow] = await prisma.$queryRaw<
      Array<{
        total: number | bigint;
        pending: number | bigint;
        investigating: number | bigint;
        resolved: number | bigint;
        ignored: number | bigint;
      }>
    >`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE acknowledged = false)::int AS pending,
        COUNT(*) FILTER (
          WHERE acknowledged = true AND COALESCE(LOWER(metadata -> 'resolution' ->> 'status'), '') NOT IN ('resolved', 'ignored')
        )::int AS investigating,
        COUNT(*) FILTER (
          WHERE LOWER(metadata -> 'resolution' ->> 'status') = 'resolved'
        )::int AS resolved,
        COUNT(*) FILTER (
          WHERE LOWER(metadata -> 'resolution' ->> 'status') = 'ignored'
        )::int AS ignored
      FROM drift_events
      WHERE recon_job_id = ${params.id} AND tenant_id = ${ctx.tenantId}
    `;

    const exceptionCounts = {
      total: Number(exceptionAggregateRow?.total || 0),
      pending: Number(exceptionAggregateRow?.pending || 0),
      investigating: Number(exceptionAggregateRow?.investigating || 0),
      resolved: Number(exceptionAggregateRow?.resolved || 0),
      ignored: Number(exceptionAggregateRow?.ignored || 0),
      unresolved:
        Number(exceptionAggregateRow?.pending || 0) +
        Number(exceptionAggregateRow?.investigating || 0),
    };

    const contract = buildCanonicalRunResultContract({
      job: run,
      result: latestResult,
      snapshot: snapshot,
      exceptionCounts,
    });

    const payload = {
      run_id: run.id,
      created_at: run.createdAt.toISOString(),
      status: contract.lifecycle.status,
      status_label: contract.lifecycle.statusLabel,
      summary_state: contract.summaryState,
      progress_state: contract.lifecycle.progressState,
      progress_percent: contract.lifecycle.progressPercent,
      is_terminal: contract.lifecycle.isTerminal,
      policy: "default",
      summary: {
        total: contract.summary.total,
        matched: contract.summary.matched,
        unmatched: contract.summary.unmatched,
        conflicts: contract.summary.conflicts,
      },
      summary_semantics: {
        processed: contract.summary.processed,
        matched_with_tolerance: contract.summary.matchedWithTolerance,
        exceptioned: contract.summary.exceptioned,
        unresolved: contract.summary.unresolved,
        ignored: contract.summary.ignored,
        resolved: contract.summary.resolved,
      },
      provenance: contract.provenance,
      config_drift: {
        status: contract.configDrift.status,
        adapter: contract.configDrift.adapter,
      },
      exceptions: {
        total: contract.exceptions.total,
        pending: contract.exceptions.pending,
        investigating: contract.exceptions.investigating,
        resolved: contract.exceptions.resolved,
        ignored: contract.exceptions.ignored,
        review_required: contract.exceptions.unresolved,
      },
      row_rationale: {
        available: contract.rowResults.length > 0,
        row_count: contract.rowResults.length,
        codes: Array.from(new Set(contract.rowResults.map((row) => row.rationale.code))),
      },
      row_results_preview: contract.rowResults.slice(0, 100),
    };

    await recordRequestMetrics(ctx, {
      route: `/api/v1/runs/${params.id}`,
      method: "GET",
      statusCode: 200,
      latencyMs: Date.now() - started,
      cacheHit: false,
      rateLimited: false,
    });
    return ok(NextResponse.json(payload), ctx.requestId);
  } catch (error) {
    await recordRequestMetrics(ctx, {
      route: `/api/v1/runs/${params.id}`,
      method: "GET",
      statusCode: 500,
      latencyMs: Date.now() - started,
      cacheHit: false,
      rateLimited: false,
    });
    return fail(error, request, ctx.requestId);
  }
}
