import { NextRequest, NextResponse } from "next/server";
import {
  DatasetCreateSchema,
  addDataset,
  applyRateLimit,
  buildContext,
  fail,
  listDatasets,
  ok,
} from "@/lib/api/v1/recon/core";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const ctx = await buildContext(request);
  if (ctx instanceof NextResponse) return ctx;
  const limited = applyRateLimit(ctx, "read");
  if (limited) return limited;

  try {
    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get("limit") || 50), 100);
    const cursor = Number(url.searchParams.get("cursor") || 0);
    const all = listDatasets(ctx.tenantId);
    const data = all.slice(cursor, cursor + limit);
    const nextCursor = cursor + limit < all.length ? String(cursor + limit) : undefined;
    return ok(
      NextResponse.json({ data, next_cursor: nextCursor, total: all.length }),
      ctx.requestId
    );
  } catch (error) {
    return fail(error, request, ctx.requestId);
  }
}

export async function POST(request: NextRequest) {
  const ctx = await buildContext(request);
  if (ctx instanceof NextResponse) return ctx;
  const limited = applyRateLimit(ctx, "write");
  if (limited) return limited;

  try {
    const parsed = DatasetCreateSchema.parse(await request.json());
    const dataset = addDataset(ctx.tenantId, parsed);
    return ok(NextResponse.json(dataset, { status: 201 }), ctx.requestId);
  } catch (error) {
    return fail(error, request, ctx.requestId);
  }
}
