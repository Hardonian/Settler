import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  applyRateLimit,
  buildContext,
  fail,
  getLatestResult,
  ok,
  recordDriftMetric,
  recordRunMetrics,
} from "@/lib/api/v1/recon/core";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await buildContext(request);
  if (ctx instanceof NextResponse) return ctx;
  const limited = applyRateLimit(ctx, "write");
  if (limited) return limited;

  try {
    const { id } = await params;
    const result = await getLatestResult(ctx, id);
    if (!result)
      return NextResponse.json(
        { code: "SETTLER_NOT_FOUND", error: "Replay target not found" },
        { status: 404 }
      );
    const expected = (result.metadata as Record<string, unknown> | null)?.fingerprint as
      | string
      | undefined;
    const actual = createHash("sha256").update(`${id}:${ctx.tenantId}`).digest("hex");
    const match = Boolean(expected && expected === actual);

    if (!match) {
      await recordDriftMetric(ctx, {
        runId: id,
        expectedFingerprint: expected || null,
        actualFingerprint: actual,
        replayVerification: false,
      });
      await recordRunMetrics(ctx, {
        runId: id,
        status: "replay_failed",
        durationMs: 0,
        fingerprint: actual,
        replayOk: false,
        evidenceSizeBytes: 0,
        policyId: "default",
        policyHash: createHash("sha256").update("default-policy").digest("hex"),
      });
      return ok(
        NextResponse.json(
          {
            code: "SETTLER_CONFLICT",
            expected_fingerprint: expected || null,
            actual_fingerprint: actual,
            match,
            diff_pointers: ["summary", "metadata.fingerprint"],
          },
          { status: 409 }
        ),
        ctx.requestId
      );
    }

    await recordRunMetrics(ctx, {
      runId: id,
      status: "replay_succeeded",
      durationMs: 0,
      fingerprint: actual,
      replayOk: true,
      evidenceSizeBytes: 0,
      policyId: "default",
      policyHash: createHash("sha256").update("default-policy").digest("hex"),
    });

    return ok(
      NextResponse.json({ expected_fingerprint: expected, actual_fingerprint: actual, match }),
      ctx.requestId
    );
  } catch (error) {
    return fail(error, request, ctx.requestId);
  }
}
