import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/shared/db/prismaClient";
import { requireAdmin } from "@/lib/api/auth-gate";
import { withSecurity } from "@/lib/middleware/api-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function getPayload(days: number) {
  const [systemHealth] = await prisma.$queryRaw<Array<Record<string, number>>>(
    `
    WITH base_runs AS (
      SELECT r.id, r.tenant_id, r.status,
        COALESCE(r.source_count, 0)::numeric AS records_processed,
        COALESCE(r.matched_count, 0)::numeric AS matched_count,
        COALESCE(EXTRACT(EPOCH FROM (COALESCE(r.completed_at, NOW()) - COALESCE(r.started_at, r.created_at))) * 1000, 0)::numeric AS duration_ms,
        (
          SELECT COUNT(*)::numeric FROM reconciliation_matches m
          WHERE m.run_id = r.id AND m.tenant_id = r.tenant_id AND m.reviewed = false AND m.match_type IN ('manual', 'unmatched')
        ) AS manual_review_count
      FROM reconciliation_runs r
      WHERE COALESCE(r.started_at, r.created_at) >= NOW() - ($1::int || ' days')::interval
    ), api_window AS (
      SELECT
        COALESCE(percentile_cont(0.5) WITHIN GROUP (ORDER BY latency_ms), 0)::numeric AS p50_latency,
        COALESCE(percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms), 0)::numeric AS p95_latency,
        COALESCE((COUNT(*) FILTER (WHERE status_code >= 500)::numeric / NULLIF(COUNT(*), 0)) * 100, 0)::numeric AS error_rate
      FROM request_metrics
      WHERE created_at >= NOW() - ($1::int || ' days')::interval
    )
    SELECT
      COALESCE(COUNT(*)::numeric / GREATEST($1::numeric, 1), 0)::float8 AS runs_per_day,
      COALESCE((COUNT(*) FILTER (WHERE status = 'failed')::numeric / NULLIF(COUNT(*), 0)) * 100, 0)::float8 AS run_failure_rate,
      COALESCE((SUM(matched_count) / NULLIF(SUM(records_processed), 0)) * 100, 0)::float8 AS match_rate,
      COALESCE((SUM(manual_review_count) / NULLIF(SUM(records_processed), 0)) * 100, 0)::float8 AS manual_review_rate,
      COALESCE(percentile_cont(0.5) WITHIN GROUP (ORDER BY duration_ms), 0)::float8 AS run_duration_p50,
      COALESCE(percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms), 0)::float8 AS run_duration_p95,
      (SELECT p50_latency::float8 FROM api_window) AS api_latency_p50,
      (SELECT p95_latency::float8 FROM api_window) AS api_latency_p95,
      (SELECT error_rate::float8 FROM api_window) AS api_error_rate
    FROM base_runs;
  `,
    days
  );

  const recentRuns = await prisma.$queryRaw<Array<Record<string, unknown>>>(`
    SELECT id::text AS run_id, tenant_id::text AS tenant_id, status, error_message,
      COALESCE(started_at, created_at) AS started_at, completed_at,
      COALESCE(source_count, 0) AS source_count, COALESCE(matched_count, 0) AS matched_count
    FROM reconciliation_runs
    ORDER BY COALESCE(started_at, created_at) DESC
    LIMIT 12;
  `);

  const errorSignatures = await prisma.$queryRaw<Array<Record<string, unknown>>>(`
    SELECT COALESCE(metadata->>'signature', error_id::text, 'unknown_error') AS signature,
      MAX(occurred_at) AS last_seen,
      COUNT(*)::int AS occurrences,
      COUNT(DISTINCT tenant_id)::int AS impacted_tenants,
      COUNT(*) FILTER (WHERE occurred_at >= NOW() - interval '24 hours')::int AS occurrences_24h,
      MIN(occurred_at) AS first_seen
    FROM operator_runtime_events
    WHERE event_type = 'error_thrown' AND occurred_at >= NOW() - interval '30 days'
    GROUP BY 1
    ORDER BY occurrences DESC
    LIMIT 20;
  `);

  const [usage] = await prisma.$queryRaw<Array<Record<string, unknown>>>(`
    WITH run_window AS (
      SELECT tenant_id, COALESCE(source_count, 0)::bigint AS records
      FROM reconciliation_runs
      WHERE COALESCE(started_at, created_at) >= NOW() - interval '30 days'
    )
    SELECT
      (SELECT COUNT(DISTINCT tenant_id)::int FROM reconciliation_runs WHERE COALESCE(started_at, created_at) >= NOW() - interval '7 days') AS active_tenants_7d,
      (SELECT COUNT(DISTINCT tenant_id)::int FROM reconciliation_runs WHERE COALESCE(started_at, created_at) >= NOW() - interval '30 days') AS active_tenants_30d,
      COALESCE(COUNT(*), 0)::int AS runs_30d,
      COALESCE(SUM(records), 0)::bigint AS records_30d
    FROM run_window;
  `);

  const tenantOverview = await prisma.$queryRaw<Array<Record<string, unknown>>>(`
    SELECT tenant_id::text, COUNT(*)::int AS run_count,
      COALESCE(SUM(source_count), 0)::bigint AS records_processed,
      COALESCE((COUNT(*) FILTER (WHERE status = 'failed')::numeric / NULLIF(COUNT(*), 0)) * 100, 0)::float8 AS failure_rate
    FROM reconciliation_runs
    WHERE COALESCE(started_at, created_at) >= NOW() - interval '30 days'
    GROUP BY tenant_id
    ORDER BY run_count DESC
    LIMIT 10;
  `);

  const capabilities = {
    githubIssueTriage: Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO),
    stripeRevenue: Boolean(process.env.STRIPE_SECRET_KEY),
    slackAlerts: Boolean(process.env.SLACK_WEBHOOK_URL),
  };

  const totalRuns30d = Number(usage?.runs_30d ?? 0);
  const estimatedCostPerRun = 0.0025;

  return {
    systemHealth: systemHealth ?? null,
    activity: {
      recentRuns,
      failedRuns: recentRuns.filter((r) => r.status === "failed"),
      errorSignatures,
    },
    usage: {
      activeTenants7d: Number(usage?.active_tenants_7d ?? 0),
      activeTenants30d: Number(usage?.active_tenants_30d ?? 0),
      runs30d: totalRuns30d,
      records30d: Number(usage?.records_30d ?? 0),
    },
    financial: {
      estimatedComputeCostPerRunUsd: estimatedCostPerRun,
      estimatedComputeCost30dUsd: Number((totalRuns30d * estimatedCostPerRun).toFixed(2)),
      marginProxy: capabilities.stripeRevenue
        ? "available_via_billing_pipeline"
        : "unavailable_missing_stripe",
      assumptions: ["compute proxy = $0.0025 per run"],
    },
    tenantOverview,
    errorIntelligence: {
      top24h: errorSignatures.filter((row) => Number(row.occurrences_24h ?? 0) > 0).slice(0, 10),
      top7d: errorSignatures.slice(0, 10),
      newSignatures: errorSignatures.filter(
        (row) => Date.parse(String(row.first_seen ?? 0)) > Date.now() - 86400000
      ),
      regressions: errorSignatures
        .filter((row) => Number(row.occurrences_24h ?? 0) >= 5)
        .slice(0, 10),
    },
    alerts: [],
    capabilities,
  };
}

export const GET = withSecurity(
  async function GET(request: NextRequest) {
    const adminCheck = await requireAdmin(request as any);
    if (!adminCheck.isAdmin) return adminCheck.error!;

    const { searchParams } = new URL(request.url);
    const days = Math.min(30, Math.max(1, Number(searchParams.get("days") ?? 7) || 7));

    try {
      const data = await getPayload(days);
      return NextResponse.json({ data, generatedAt: new Date().toISOString() });
    } catch (error) {
      return NextResponse.json({
        data: null,
        degraded: true,
        error: error instanceof Error ? error.message : "Failed",
      });
    }
  },
  { requireAuth: true }
);

export const POST = withSecurity(
  async function POST(request: NextRequest) {
    const adminCheck = await requireAdmin(request as any);
    if (!adminCheck.isAdmin) return adminCheck.error!;

    try {
      const body = await request.json();
      const context = JSON.stringify({
        tenantId: body.tenantId ?? null,
        runId: body.runId ?? null,
        errorSignature: body.errorSignature ?? null,
      });
      await prisma.$executeRaw`
      INSERT INTO ops_support_tickets (subject, description, category, context, status, priority, created_at)
      VALUES (${body.subject ?? "Operator issue"}, ${body.description ?? "No description provided"}, ${body.category ?? "operator"}, ${context}::jsonb, 'open', 'medium', NOW())
    `;

      const githubEnabled = Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO);
      return NextResponse.json({
        success: true,
        triage: { dryRun: !githubEnabled, created: false },
      });
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : "Failed",
      });
    }
  },
  { requireAuth: true }
);
