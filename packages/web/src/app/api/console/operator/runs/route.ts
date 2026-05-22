import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/auth-gate";
import { withSecurity } from "@/lib/middleware/api-security";
import { prisma } from "@/shared/db/prismaClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

export const GET = withSecurity(
  async function GET(request: NextRequest) {
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.isAdmin) return adminCheck.error!;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Number(searchParams.get("pageSize") ?? DEFAULT_PAGE_SIZE) || DEFAULT_PAGE_SIZE)
    );
    const tenantId = (searchParams.get("tenantId") ?? "").trim();
    const status = (searchParams.get("status") ?? "").trim();

    const offset = (page - 1) * pageSize;

    const [countRow] = await prisma.$queryRaw<Array<{ total: number }>>(
      `
      SELECT COUNT(*)::int AS total
      FROM reconciliation_runs r
      WHERE ($1::text = '' OR r.tenant_id::text = $1::text)
        AND ($2::text = '' OR r.status = $2::text)
    `,
      tenantId,
      status
    );

    const runs = await prisma.$queryRaw<
      Array<{
        run_id: string;
        tenant_id: string;
        status: string;
        started_at: string;
        completed_at: string | null;
        duration_ms: number;
        source_count: number;
        matched_count: number;
        match_rate: number;
        manual_review_count: number;
        error_count: number;
      }>
    >(
      `
      WITH manual_review_counts AS (
        SELECT m.run_id, m.tenant_id, COUNT(*)::int AS manual_review_count
        FROM reconciliation_matches m
        WHERE m.reviewed = false
          AND m.match_type IN ('manual', 'unmatched')
        GROUP BY m.run_id, m.tenant_id
      ), error_counts AS (
        SELECT ore.run_id, ore.tenant_id, COUNT(*)::int AS error_count
        FROM operator_runtime_events ore
        WHERE ore.event_type = 'error_thrown'
        GROUP BY ore.run_id, ore.tenant_id
      )
      SELECT
        r.id::text AS run_id,
        r.tenant_id::text AS tenant_id,
        r.status,
        COALESCE(r.started_at, r.created_at)::text AS started_at,
        r.completed_at::text AS completed_at,
        COALESCE(EXTRACT(EPOCH FROM (COALESCE(r.completed_at, NOW()) - COALESCE(r.started_at, r.created_at))) * 1000, 0)::int AS duration_ms,
        COALESCE(r.source_count, 0)::int AS source_count,
        COALESCE(r.matched_count, 0)::int AS matched_count,
        COALESCE((COALESCE(r.matched_count, 0)::numeric / NULLIF(COALESCE(r.source_count, 0), 0)) * 100, 0)::float8 AS match_rate,
        COALESCE(mrc.manual_review_count, 0)::int AS manual_review_count,
        COALESCE(ec.error_count, 0)::int AS error_count
      FROM reconciliation_runs r
      LEFT JOIN manual_review_counts mrc
        ON mrc.run_id = r.id
       AND mrc.tenant_id = r.tenant_id
      LEFT JOIN error_counts ec
        ON ec.run_id = r.id
       AND ec.tenant_id = r.tenant_id
      WHERE ($1::text = '' OR r.tenant_id::text = $1::text)
        AND ($2::text = '' OR r.status = $2::text)
      ORDER BY COALESCE(r.started_at, r.created_at) DESC, r.id DESC
      LIMIT $3 OFFSET $4
    `,
      tenantId,
      status,
      pageSize,
      offset
    );

    return NextResponse.json({
      data: runs,
      pagination: {
        page,
        pageSize,
        total: Number(countRow?.total ?? 0),
        totalPages: Math.max(1, Math.ceil(Number(countRow?.total ?? 0) / pageSize)),
      },
    });
  },
  { requireAuth: true }
);
