import { NextRequest, NextResponse } from "next/server";
import {
  RunCreateSchema,
  applyRateLimit,
  buildContext,
  createRun,
  fail,
  getIdempotent,
  ok,
  storeIdempotent,
} from "@/lib/api/v1/recon/core";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ctx = await buildContext(request);
  if (ctx instanceof NextResponse) return ctx;
  const limited = applyRateLimit(ctx, "write");
  if (limited) return limited;

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

    const idem = getIdempotent(ctx.tenantId, idempotencyKey, parsed);
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
    storeIdempotent(ctx.tenantId, idempotencyKey, idem.reqHash, payload);

    return ok(NextResponse.json(payload, { status: parsed.async ? 202 : 201 }), ctx.requestId);
  } catch (error) {
    return fail(error, request, ctx.requestId);
  }
}
