import { NextRequest, NextResponse } from "next/server";
import {
  applyRateLimit,
  buildContext,
  fail,
  getLatestResult,
  getRun,
  ok,
} from "@/lib/api/v1/recon/core";
import { buildCanonicalRunTruth, type ReconResultRow } from "@/lib/reconciliation/run-status";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await buildContext(request);
  if (ctx instanceof NextResponse) return ctx;
  const limited = applyRateLimit(ctx, "read");
  if (limited) return limited;

  try {
    const { id } = await params;
    const run = await getRun(ctx, id);
    if (!run)
      return NextResponse.json(
        { code: "SETTLER_NOT_FOUND", error: "Run not found" },
        { status: 404 }
      );
    const result = await getLatestResult(ctx, run.id);
    const canonicalResult: ReconResultRow | null = result
      ? {
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
          metadata: (result.metadata as Record<string, unknown> | null) || null,
        }
      : null;
    const truth = buildCanonicalRunTruth(run.status, canonicalResult);
    return ok(
      NextResponse.json({
        id: run.id,
        status: truth.status,
        status_label: truth.statusLabel,
        summary_state: truth.summaryState,
        progress_state: truth.progressState,
        is_terminal: truth.isTerminal,
        progress_percent: truth.progressPercent,
        summary: truth.summary,
        metadata: { sourceAdapter: run.sourceAdapter, targetAdapter: run.targetAdapter },
        policy: { id: "default", hash: "default-policy" },
        fingerprint: (result?.metadata as Record<string, unknown> | null)?.fingerprint || null,
        compute_units: 0,
        replay_ok: null,
        created_at: run.createdAt.toISOString(),
      }),
      ctx.requestId
    );
  } catch (error) {
    return fail(error, request, ctx.requestId);
  }
}
