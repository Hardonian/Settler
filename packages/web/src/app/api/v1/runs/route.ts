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
import { prisma } from "@/shared/db/prismaClient";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const ctx = await buildContext(request);
  if (ctx instanceof NextResponse) return ctx;

  // TENANT ISOLATION HARDENING: Strictly enforce tenant boundary before any DB access.
  // Prevents Prisma from stripping `undefined` and executing a cross-tenant read.
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
  const limited = applyRateLimit(ctx, "read");
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

    const runs = await prisma.reconJob.findMany({
      where: {
        tenantId: ctx.tenantId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 50),
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    const payload = {
      rows: runs.map((run: { id: string; createdAt: Date; status: string }) => ({
        run_id: run.id,
        created_at: run.createdAt.toISOString(),
        status: run.status,
        policy: "default",
      })),
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

  // TENANT ISOLATION HARDENING: Strictly enforce tenant boundary before any mutation.
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
  const limited = applyRateLimit(ctx, "write");
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
