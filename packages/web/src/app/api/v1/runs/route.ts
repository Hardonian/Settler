// ROUTE_CLASS: api-key-service
// AUTH: API key auth — tenant isolated via ctx.tenantId in all queries
import { NextRequest, NextResponse } from "next/server";
import {
  RunCreateSchema,
  applyRateLimit,
  buildContext,
  createRun,
  fail,
  getIdempotent,
  ok,
  recordRequestMetrics,
  storeIdempotent,
} from "@/lib/api/v1/recon/core";
import {
  buildCanonicalRunResultContract,
  type ReconJobRecordLike,
  type ReconResultRecordLike,
} from "@/lib/reconciliation/canonical-run-result";
import { prisma } from "@/shared/db/prismaClient";

export const runtime = "nodejs";

type RunListRow = {
  id: string;
  createdAt: Date;
  status: string;
  tenantId?: string;
  sourceAdapter?: string | null;
  targetAdapter?: string | null;
  reconStrategy?: string | null;
  templateId?: string | null;
  validationRules?: unknown;
  sourceConfigEncrypted?: string | null;
  targetConfigEncrypted?: string | null;
};

export async function GET(request: NextRequest) {
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
      route: "/api/v1/runs",
      method: "GET",
      statusCode: 429,
      latencyMs: Date.now() - started,
      cacheHit: false,
      rateLimited: true,
    });
    return limited;
  }

  try {
    const status = request.nextUrl.searchParams.get("status") ?? undefined;
    const cursor = request.nextUrl.searchParams.get("cursor") ?? undefined;
    const limit = Number(request.nextUrl.searchParams.get("limit") || 20);

    const runs = (await prisma.reconJob.findMany({
      where: {
        tenantId: ctx.tenantId,
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 50),
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    })) as RunListRow[];

    const runIds = runs.map((run: RunListRow) => run.id);
    const latestResults = runIds.length
      ? await prisma.reconResult.findMany({
          where: {
            tenantId: ctx.tenantId,
            reconJobId: { in: runIds },
          },
          orderBy: { startedAt: "desc" },
          select: {
            id: true,
            reconJobId: true,
            status: true,
            startedAt: true,
            completedAt: true,
            sourceCount: true,
            targetCount: true,
            matchedCount: true,
            unmatchedSourceCount: true,
            unmatchedTargetCount: true,
            conflictCount: true,
            errorMessage: true,
            inputHash: true,
            snapshotId: true,
            summary: true,
            metadata: true,
          },
        })
      : [];

    const latestResultByRunId = new Map<string, ReconResultRecordLike>();
    for (const result of latestResults) {
      if (latestResultByRunId.has(result.reconJobId)) {
        continue;
      }
      latestResultByRunId.set(result.reconJobId, {
        id: result.id,
        recon_job_id: result.reconJobId,
        status: result.status,
        started_at: result.startedAt?.toISOString() || null,
        completed_at: result.completedAt?.toISOString() || null,
        source_count: result.sourceCount,
        target_count: result.targetCount,
        matched_count: result.matchedCount,
        unmatched_source_count: result.unmatchedSourceCount,
        unmatched_target_count: result.unmatchedTargetCount,
        conflict_count: result.conflictCount,
        error_message: result.errorMessage,
        input_hash: result.inputHash,
        snapshot_id: result.snapshotId,
        summary: result.summary,
        metadata: (result.metadata as Record<string, unknown> | null) || null,
      });
    }

    const rows = runs
      .map((run: RunListRow) => {
        const contract = buildCanonicalRunResultContract({
          job: {
            id: run.id,
            status: run.status,
            tenantId: ctx.tenantId,
            sourceAdapter: run.sourceAdapter,
            targetAdapter: run.targetAdapter,
            reconStrategy: run.reconStrategy,
            templateId: run.templateId,
            validationRules: run.validationRules,
            sourceConfigEncrypted: run.sourceConfigEncrypted,
            targetConfigEncrypted: run.targetConfigEncrypted,
          } as ReconJobRecordLike,
          result: latestResultByRunId.get(run.id) ?? null,
        });

        return {
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
        };
      })
      .filter((run) => (status ? run.status === status : true));

    const payload = {
      rows,
      next_cursor: runs.length === Math.min(limit, 50) ? runs[runs.length - 1]?.id : null,
    };

    await recordRequestMetrics(ctx, {
      route: "/api/v1/runs",
      method: "GET",
      statusCode: 200,
      latencyMs: Date.now() - started,
      cacheHit: false,
      rateLimited: false,
    });
    return ok(NextResponse.json(payload), ctx.requestId);
  } catch (error) {
    await recordRequestMetrics(ctx, {
      route: "/api/v1/runs",
      method: "GET",
      statusCode: 500,
      latencyMs: Date.now() - started,
      cacheHit: false,
      rateLimited: false,
    });
    return fail(error, request, ctx.requestId);
  }
}

export async function POST(request: NextRequest) {
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
  const limited = await applyRateLimit(ctx, "write");
  if (limited) {
    await recordRequestMetrics(ctx, {
      route: "/api/v1/runs",
      method: "POST",
      statusCode: 429,
      latencyMs: Date.now() - started,
      cacheHit: false,
      rateLimited: true,
    });
    return limited;
  }

  try {
    const raw = await request.json();
    const parsed = RunCreateSchema.parse(raw);
    const idempotencyKey = request.headers.get("idempotency-key");
    if (!idempotencyKey) {
      return NextResponse.json(
        { error: "Idempotency-Key header required", code: "SETTLER_INVALID_INPUT" },
        { status: 400 }
      );
    }

    const idem = await getIdempotent(ctx.tenantId, idempotencyKey, parsed);
    if ((idem as { conflict?: boolean }).conflict) {
      return NextResponse.json(
        { error: "Idempotency key reuse with different request", code: "SETTLER_CONFLICT" },
        { status: 409 }
      );
    }
    if ((idem as { replay?: unknown }).replay) {
      return ok(
        NextResponse.json((idem as { replay: unknown }).replay, { status: 200 }),
        ctx.requestId
      );
    }

    const run = await createRun(ctx, parsed);
    const payload = {
      id: run.id,
      status: parsed.async ? "queued" : "succeeded",
      mode: parsed.async ? "async" : "sync",
      created_at: run.createdAt.toISOString(),
    };
    await storeIdempotent(ctx.tenantId, idempotencyKey, idem.reqHash, payload);

    await recordRequestMetrics(ctx, {
      route: "/api/v1/runs",
      method: "POST",
      statusCode: parsed.async ? 202 : 201,
      latencyMs: Date.now() - started,
      cacheHit: false,
      rateLimited: false,
    });
    return ok(NextResponse.json(payload, { status: parsed.async ? 202 : 201 }), ctx.requestId);
  } catch (error) {
    await recordRequestMetrics(ctx, {
      route: "/api/v1/runs",
      method: "POST",
      statusCode: 500,
      latencyMs: Date.now() - started,
      cacheHit: false,
      rateLimited: false,
    });
    return fail(error, request, ctx.requestId);
  }
}
