import { createHash, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/auth-gate";
import { withSecurity } from "@/lib/middleware/api-security";
import { prisma } from "@/shared/db/prismaClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const COOLDOWN_HOURS = 6;

interface ErrorSignatureRow {
  signature: string;
  last_seen: string;
  occurrences: number;
  impacted_tenants: number;
  occurrences_24h: number;
  first_seen: string;
  sample_run_id: string | null;
  sample_tenant_id: string | null;
  sample_route: string | null;
  sample_module: string | null;
  sample_stack: string | null;
}

interface AlertCandidate {
  dedupeKey: string;
  metric: string;
  severity: "warning" | "critical";
  observed: number;
  baseline: number;
  message: string;
}

const supportSchema = z.object({
  subject: z.string().min(3).max(180),
  description: z.string().min(5).max(5000),
  category: z.string().max(80).optional(),
  tenantId: z.string().uuid().optional(),
  runId: z.string().uuid().optional(),
  errorSignature: z.string().max(300).optional(),
  contact: z.string().max(180).optional(),
});

async function ensureOperatorTables(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS operator_anomaly_alerts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      dedupe_key TEXT NOT NULL UNIQUE,
      metric TEXT NOT NULL,
      severity TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      triggered_count INTEGER NOT NULL DEFAULT 1,
      first_triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_value DOUBLE PRECISION NOT NULL,
      baseline_value DOUBLE PRECISION NOT NULL,
      message TEXT NOT NULL,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      acknowledged_at TIMESTAMPTZ,
      acknowledged_by TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_operator_anomaly_alerts_last_triggered ON operator_anomaly_alerts(last_triggered_at DESC);

    CREATE TABLE IF NOT EXISTS operator_error_issue_links (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      signature TEXT NOT NULL UNIQUE,
      github_issue_number INTEGER,
      github_issue_url TEXT,
      github_issue_state TEXT,
      first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_triaged_at TIMESTAMPTZ,
      cooldown_until TIMESTAMPTZ,
      observation_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_operator_error_issue_links_last_seen ON operator_error_issue_links(last_seen_at DESC);
  `);
}

function computeAnomalies(row: Record<string, number | null | undefined>): AlertCandidate[] {
  const toNumber = (v: number | null | undefined) => Number(v ?? 0);
  const recentFailure = toNumber(row.recent_failure_rate);
  const baseFailure = toNumber(row.baseline_failure_rate);
  const recentManual = toNumber(row.recent_manual_review_rate);
  const baseManual = toNumber(row.baseline_manual_review_rate);
  const recentP95 = toNumber(row.recent_api_p95_ms);
  const baseP95 = toNumber(row.baseline_api_p95_ms);
  const recentApiError = toNumber(row.recent_api_error_rate);
  const baseApiError = toNumber(row.baseline_api_error_rate);

  const anomalies: AlertCandidate[] = [];
  if (recentFailure > Math.max(6, baseFailure * 1.75)) {
    anomalies.push({
      dedupeKey: "run_failure_rate",
      metric: "run_failure_rate",
      severity: recentFailure > Math.max(12, baseFailure * 2.2) ? "critical" : "warning",
      observed: recentFailure,
      baseline: baseFailure,
      message: `Run failure rate spiked to ${recentFailure.toFixed(2)}% (baseline ${baseFailure.toFixed(2)}%).`,
    });
  }
  if (recentManual > Math.max(15, baseManual * 1.6)) {
    anomalies.push({
      dedupeKey: "manual_review_rate",
      metric: "manual_review_rate",
      severity: recentManual > Math.max(25, baseManual * 2) ? "critical" : "warning",
      observed: recentManual,
      baseline: baseManual,
      message: `Manual review rate spiked to ${recentManual.toFixed(2)}% (baseline ${baseManual.toFixed(2)}%).`,
    });
  }
  if (recentP95 > Math.max(1200, baseP95 * 1.8)) {
    anomalies.push({
      dedupeKey: "api_latency_p95",
      metric: "api_latency_p95",
      severity: recentP95 > Math.max(2500, baseP95 * 2.5) ? "critical" : "warning",
      observed: recentP95,
      baseline: baseP95,
      message: `API latency p95 rose to ${Math.round(recentP95)}ms (baseline ${Math.round(baseP95)}ms).`,
    });
  }
  if (recentApiError > Math.max(2.5, baseApiError * 2)) {
    anomalies.push({
      dedupeKey: "api_error_rate",
      metric: "api_error_rate",
      severity: recentApiError > Math.max(7, baseApiError * 2.5) ? "critical" : "warning",
      observed: recentApiError,
      baseline: baseApiError,
      message: `API error rate increased to ${recentApiError.toFixed(2)}% (baseline ${baseApiError.toFixed(2)}%).`,
    });
  }
  return anomalies;
}

async function persistAlerts(anomalies: AlertCandidate[]): Promise<void> {
  for (const alert of anomalies) {
    await prisma.$executeRaw`
      INSERT INTO operator_anomaly_alerts (
        dedupe_key, metric, severity, status, triggered_count,
        first_triggered_at, last_triggered_at,
        last_value, baseline_value, message, payload, created_at, updated_at
      )
      VALUES (
        ${alert.dedupeKey}, ${alert.metric}, ${alert.severity}, 'open', 1,
        NOW(), NOW(),
        ${alert.observed}, ${alert.baseline}, ${alert.message},
        ${JSON.stringify({ metric: alert.metric })}::jsonb,
        NOW(), NOW()
      )
      ON CONFLICT (dedupe_key)
      DO UPDATE SET
        severity = EXCLUDED.severity,
        status = 'open',
        triggered_count = operator_anomaly_alerts.triggered_count + 1,
        last_triggered_at = NOW(),
        last_value = EXCLUDED.last_value,
        baseline_value = EXCLUDED.baseline_value,
        message = EXCLUDED.message,
        payload = EXCLUDED.payload,
        updated_at = NOW();
    `;
  }
}

function parseGithubRepo(): { owner: string; repo: string } | null {
  const raw = process.env.GITHUB_REPO;
  if (!raw || !raw.includes("/")) return null;
  const [owner, repo] = raw.split("/");
  if (!owner || !repo) return null;
  return { owner, repo };
}

async function githubRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN missing");

  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${response.status}: ${body.slice(0, 400)}`);
  }

  return (await response.json()) as T;
}

async function triageGithubIssues(
  signatures: ErrorSignatureRow[]
): Promise<{ mode: "disabled" | "active"; triaged: number; skipped: number; errors: string[] }> {
  const repo = parseGithubRepo();
  if (!repo || !process.env.GITHUB_TOKEN) {
    return { mode: "disabled", triaged: 0, skipped: signatures.length, errors: [] };
  }

  const candidates = signatures.filter(
    (s) => s.occurrences_24h >= 5 || Date.parse(s.first_seen) > Date.now() - 24 * 60 * 60 * 1000
  );

  let triaged = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const signature of candidates) {
    try {
      const existing = await prisma.$queryRaw<
        Array<{
          github_issue_number: number | null;
          cooldown_until: Date | null;
          observation_count: number;
        }>
      >`
        SELECT github_issue_number, cooldown_until, observation_count
        FROM operator_error_issue_links
        WHERE signature = ${signature.signature}
        LIMIT 1
      `;

      const row = existing[0];
      if (row?.cooldown_until && row.cooldown_until.getTime() > Date.now()) {
        skipped += 1;
        continue;
      }

      if (row?.github_issue_number) {
        await githubRequest(
          `/repos/${repo.owner}/${repo.repo}/issues/${row.github_issue_number}/comments`,
          {
            method: "POST",
            body: JSON.stringify({
              body: [
                "Recurring operator error signature detected.",
                `- Signature: \`${signature.signature}\``,
                `- occurrences_24h: ${signature.occurrences_24h}`,
                `- occurrences_30d: ${signature.occurrences}`,
                `- sample_run_id: ${signature.sample_run_id ?? "n/a"}`,
                `- sample_tenant_id: ${signature.sample_tenant_id ?? "n/a"}`,
                `- sample_route: ${signature.sample_route ?? "n/a"}`,
              ].join("\n"),
            }),
          }
        );

        await prisma.$executeRaw`
          UPDATE operator_error_issue_links
          SET
            last_seen_at = NOW(),
            last_triaged_at = NOW(),
            cooldown_until = NOW() + (${COOLDOWN_HOURS}::text || ' hours')::interval,
            observation_count = observation_count + ${signature.occurrences_24h},
            updated_at = NOW()
          WHERE signature = ${signature.signature}
        `;
      } else {
        const created = await githubRequest<{ number: number; html_url: string; state: string }>(
          `/repos/${repo.owner}/${repo.repo}/issues`,
          {
            method: "POST",
            body: JSON.stringify({
              title: `[Operator] Error signature: ${signature.signature}`,
              labels: ["operator-triage", "runtime-error"],
              body: [
                "Automated operator triage created this issue from runtime telemetry.",
                "",
                `- Signature: \`${signature.signature}\``,
                `- First seen: ${signature.first_seen}`,
                `- Last seen: ${signature.last_seen}`,
                `- Occurrences (24h): ${signature.occurrences_24h}`,
                `- Occurrences (30d): ${signature.occurrences}`,
                `- Impacted tenants (count): ${signature.impacted_tenants}`,
                `- Sample run_id: ${signature.sample_run_id ?? "n/a"}`,
                `- Sample route: ${signature.sample_route ?? "n/a"}`,
                `- Sample module: ${signature.sample_module ?? "n/a"}`,
                "",
                "Stack sample:",
                "```",
                signature.sample_stack ?? "n/a",
                "```",
              ].join("\n"),
            }),
          }
        );

        await prisma.$executeRaw`
          INSERT INTO operator_error_issue_links (
            signature, github_issue_number, github_issue_url, github_issue_state,
            first_seen_at, last_seen_at, last_triaged_at, cooldown_until,
            observation_count, created_at, updated_at
          ) VALUES (
            ${signature.signature}, ${created.number}, ${created.html_url}, ${created.state},
            NOW(), NOW(), NOW(), NOW() + (${COOLDOWN_HOURS}::text || ' hours')::interval,
            ${signature.occurrences}, NOW(), NOW()
          )
          ON CONFLICT (signature)
          DO UPDATE SET
            github_issue_number = EXCLUDED.github_issue_number,
            github_issue_url = EXCLUDED.github_issue_url,
            github_issue_state = EXCLUDED.github_issue_state,
            last_seen_at = NOW(),
            last_triaged_at = NOW(),
            cooldown_until = EXCLUDED.cooldown_until,
            observation_count = operator_error_issue_links.observation_count + ${signature.occurrences_24h},
            updated_at = NOW()
        `;
      }

      triaged += 1;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "GitHub triage failed");
    }
  }

  return { mode: "active", triaged, skipped, errors };
}

async function buildPayload(days: number) {
  await ensureOperatorTables();

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

  const [anomalyWindow] = await prisma.$queryRaw<Array<Record<string, number>>>(`
    WITH recent_runs AS (
      SELECT
        COALESCE((COUNT(*) FILTER (WHERE status = 'failed')::numeric / NULLIF(COUNT(*), 0)) * 100, 0)::float8 AS failure_rate,
        COALESCE(AVG(CASE WHEN source_count > 0 THEN (
          SELECT COUNT(*)::float8
          FROM reconciliation_matches m
          WHERE m.run_id = r.id
            AND m.tenant_id = r.tenant_id
            AND m.reviewed = false
            AND m.match_type IN ('manual', 'unmatched')
        ) / source_count::float8 * 100 ELSE 0 END), 0)::float8 AS manual_review_rate
      FROM reconciliation_runs r
      WHERE COALESCE(started_at, created_at) >= NOW() - interval '24 hours'
    ),
    baseline_runs AS (
      SELECT
        COALESCE((COUNT(*) FILTER (WHERE status = 'failed')::numeric / NULLIF(COUNT(*), 0)) * 100, 0)::float8 AS failure_rate,
        COALESCE(AVG(CASE WHEN source_count > 0 THEN (
          SELECT COUNT(*)::float8
          FROM reconciliation_matches m
          WHERE m.run_id = r.id
            AND m.tenant_id = r.tenant_id
            AND m.reviewed = false
            AND m.match_type IN ('manual', 'unmatched')
        ) / source_count::float8 * 100 ELSE 0 END), 0)::float8 AS manual_review_rate
      FROM reconciliation_runs r
      WHERE COALESCE(started_at, created_at) >= NOW() - interval '14 days'
        AND COALESCE(started_at, created_at) < NOW() - interval '24 hours'
    ),
    recent_api AS (
      SELECT
        COALESCE(percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms), 0)::float8 AS p95_ms,
        COALESCE((COUNT(*) FILTER (WHERE status_code >= 500)::numeric / NULLIF(COUNT(*), 0)) * 100, 0)::float8 AS error_rate
      FROM request_metrics
      WHERE created_at >= NOW() - interval '24 hours'
    ),
    baseline_api AS (
      SELECT
        COALESCE(percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms), 0)::float8 AS p95_ms,
        COALESCE((COUNT(*) FILTER (WHERE status_code >= 500)::numeric / NULLIF(COUNT(*), 0)) * 100, 0)::float8 AS error_rate
      FROM request_metrics
      WHERE created_at >= NOW() - interval '14 days'
        AND created_at < NOW() - interval '24 hours'
    )
    SELECT
      recent_runs.failure_rate AS recent_failure_rate,
      baseline_runs.failure_rate AS baseline_failure_rate,
      recent_runs.manual_review_rate AS recent_manual_review_rate,
      baseline_runs.manual_review_rate AS baseline_manual_review_rate,
      recent_api.p95_ms AS recent_api_p95_ms,
      baseline_api.p95_ms AS baseline_api_p95_ms,
      recent_api.error_rate AS recent_api_error_rate,
      baseline_api.error_rate AS baseline_api_error_rate
    FROM recent_runs, baseline_runs, recent_api, baseline_api;
  `);

  const anomalies = computeAnomalies(anomalyWindow ?? {});
  await persistAlerts(anomalies);

  const persistedAlerts = await prisma.$queryRaw<Array<Record<string, unknown>>>(`
    SELECT dedupe_key, metric, severity, status, triggered_count,
      first_triggered_at, last_triggered_at, last_value, baseline_value, message
    FROM operator_anomaly_alerts
    ORDER BY last_triggered_at DESC
    LIMIT 25
  `);

  const recentRuns = await prisma.$queryRaw<Array<Record<string, unknown>>>(`
    SELECT id::text AS run_id, tenant_id::text AS tenant_id, status, error_message,
      COALESCE(started_at, created_at) AS started_at, completed_at,
      COALESCE(source_count, 0) AS source_count, COALESCE(matched_count, 0) AS matched_count
    FROM reconciliation_runs
    ORDER BY COALESCE(started_at, created_at) DESC
    LIMIT 20;
  `);

  const errorSignatures = await prisma.$queryRaw<ErrorSignatureRow[]>(`
    SELECT
      COALESCE(ore.metadata->>'signature', ore.error_id::text, 'unknown_error') AS signature,
      MAX(ore.occurred_at)::text AS last_seen,
      COUNT(*)::int AS occurrences,
      COUNT(DISTINCT ore.tenant_id)::int AS impacted_tenants,
      COUNT(*) FILTER (WHERE ore.occurred_at >= NOW() - interval '24 hours')::int AS occurrences_24h,
      MIN(ore.occurred_at)::text AS first_seen,
      MAX(ore.run_id)::text AS sample_run_id,
      MAX(ore.tenant_id)::text AS sample_tenant_id,
      MAX(ore.metadata->>'route') AS sample_route,
      MAX(ore.metadata->>'module') AS sample_module,
      MAX(ore.metadata->>'stack') AS sample_stack
    FROM operator_runtime_events ore
    WHERE ore.event_type = 'error_thrown'
      AND ore.occurred_at >= NOW() - interval '30 days'
    GROUP BY 1
    ORDER BY occurrences DESC
    LIMIT 30;
  `);

  const issueTriage = await triageGithubIssues(errorSignatures);

  const usage = await prisma.$queryRaw<Array<Record<string, unknown>>>(`
    WITH run_window AS (
      SELECT tenant_id, COALESCE(source_count, 0)::bigint AS records
      FROM reconciliation_runs
      WHERE COALESCE(started_at, created_at) >= NOW() - interval '30 days'
    ), segmented AS (
      SELECT
        SUM(CASE WHEN route LIKE '/api/%' THEN 1 ELSE 0 END)::bigint AS api_requests,
        SUM(CASE WHEN route NOT LIKE '/api/%' THEN 1 ELSE 0 END)::bigint AS ui_requests
      FROM request_metrics
      WHERE created_at >= NOW() - interval '30 days'
    )
    SELECT
      (SELECT COUNT(DISTINCT tenant_id)::int FROM reconciliation_runs WHERE COALESCE(started_at, created_at) >= NOW() - interval '7 days') AS active_tenants_7d,
      (SELECT COUNT(DISTINCT tenant_id)::int FROM reconciliation_runs WHERE COALESCE(started_at, created_at) >= NOW() - interval '30 days') AS active_tenants_30d,
      COALESCE(COUNT(*), 0)::int AS runs_30d,
      COALESCE(SUM(records), 0)::bigint AS records_30d,
      (SELECT COALESCE(api_requests, 0) FROM segmented)::bigint AS api_requests_30d,
      (SELECT COALESCE(ui_requests, 0) FROM segmented)::bigint AS ui_requests_30d
    FROM run_window;
  `);

  const tenantOverview = await prisma.$queryRaw<Array<Record<string, unknown>>>(`
    SELECT tenant_id::text, COUNT(*)::int AS run_count,
      COALESCE(SUM(source_count), 0)::bigint AS records_processed,
      COALESCE((COUNT(*) FILTER (WHERE status = 'failed')::numeric / NULLIF(COUNT(*), 0)) * 100, 0)::float8 AS failure_rate,
      COALESCE(AVG(CASE WHEN source_count > 0 THEN (
        SELECT COUNT(*)::float8
        FROM reconciliation_matches m
        WHERE m.run_id = r.id
          AND m.tenant_id = r.tenant_id
          AND m.reviewed = false
          AND m.match_type IN ('manual', 'unmatched')
      ) / source_count::float8 * 100 ELSE 0 END), 0)::float8 AS manual_review_rate
    FROM reconciliation_runs r
    WHERE COALESCE(started_at, created_at) >= NOW() - interval '30 days'
    GROUP BY tenant_id
    ORDER BY run_count DESC
    LIMIT 10;
  `);

  const tenantEconomics = await prisma.$queryRaw<Array<Record<string, unknown>>>(`
    WITH run_stats AS (
      SELECT tenant_id::text AS tenant_id, COUNT(*)::int AS runs_30d, COALESCE(SUM(source_count), 0)::bigint AS records_30d
      FROM reconciliation_runs
      WHERE COALESCE(started_at, created_at) >= NOW() - interval '30 days'
      GROUP BY tenant_id
    ),
    revenue AS (
      SELECT
        ba.tenant_id::text AS tenant_id,
        MAX(CASE
          WHEN s.status IN ('active','trialing','past_due') AND (s.metadata->>'monthly_revenue_usd') ~ '^[0-9]+(\\.[0-9]+)?$'
          THEN (s.metadata->>'monthly_revenue_usd')::numeric
          ELSE NULL
        END) AS explicit_mrr,
        MAX(CASE
          WHEN s.status IN ('active','trialing','past_due') THEN
            CASE s.plan_id
              WHEN 'starter' THEN 0
              WHEN 'growth' THEN 900
              WHEN 'scale' THEN 9900
              WHEN 'enterprise' THEN 0
              WHEN 'pro' THEN 900
              WHEN 'base' THEN 0
              ELSE 0
            END
          ELSE 0
        END)::numeric AS plan_mrr
      FROM billing_accounts ba
      LEFT JOIN subscriptions s ON s.billing_account_id = ba.id
      GROUP BY ba.tenant_id
    )
    SELECT
      rs.tenant_id,
      rs.runs_30d,
      rs.records_30d,
      COALESCE(revenue.explicit_mrr, revenue.plan_mrr, 0)::float8 AS estimated_mrr_usd
    FROM run_stats rs
    LEFT JOIN revenue ON revenue.tenant_id = rs.tenant_id
    ORDER BY rs.runs_30d DESC;
  `);

  const totalRevenue = tenantEconomics.reduce(
    (acc, row) => acc + Number(row.estimated_mrr_usd ?? 0),
    0
  );

  const usageRow = usage[0] ?? {};
  const totalRuns30d = Number(usageRow.runs_30d ?? 0);
  const estimatedCostPerRun = 0.0025;
  const totalComputeCost = totalRuns30d * estimatedCostPerRun;
  const marginProxy =
    totalRevenue > 0
      ? Number((((totalRevenue - totalComputeCost) / totalRevenue) * 100).toFixed(2))
      : null;

  const capabilities = {
    githubIssueTriage: Boolean(process.env.GITHUB_TOKEN && parseGithubRepo()),
    stripeRevenue: Boolean(process.env.STRIPE_SECRET_KEY),
    slackAlerts: Boolean(process.env.SLACK_WEBHOOK_URL),
  };

  return {
    systemHealth: systemHealth ?? null,
    activity: {
      recentRuns,
      failedRuns: recentRuns.filter((r) => r.status === "failed").slice(0, 10),
      errorSignatures,
      githubIssueTriage: issueTriage,
    },
    usage: {
      activeTenants7d: Number(usageRow.active_tenants_7d ?? 0),
      activeTenants30d: Number(usageRow.active_tenants_30d ?? 0),
      runs30d: totalRuns30d,
      records30d: Number(usageRow.records_30d ?? 0),
      apiRequests30d: Number(usageRow.api_requests_30d ?? 0),
      uiRequests30d: Number(usageRow.ui_requests_30d ?? 0),
    },
    financial: {
      estimatedComputeCostPerRunUsd: estimatedCostPerRun,
      estimatedComputeCost30dUsd: Number(totalComputeCost.toFixed(2)),
      realizedRevenue30dProxyUsd: Number(totalRevenue.toFixed(2)),
      revenuePerRunUsd: totalRuns30d > 0 ? Number((totalRevenue / totalRuns30d).toFixed(4)) : null,
      marginProxyPercent: marginProxy,
      assumptions: [
        "Revenue uses subscription metadata monthly_revenue_usd when available; otherwise plan defaults.",
        "Cost proxy currently includes compute only from run volume.",
      ],
      tenantEconomics,
    },
    tenantOverview,
    errorIntelligence: {
      top24h: errorSignatures.filter((row) => row.occurrences_24h > 0).slice(0, 10),
      top7d: errorSignatures.slice(0, 10),
      newSignatures: errorSignatures.filter(
        (row) => Date.parse(row.first_seen) > Date.now() - 24 * 60 * 60 * 1000
      ),
      regressions: errorSignatures.filter((row) => row.occurrences_24h >= 5).slice(0, 10),
    },
    alerts: persistedAlerts,
    capabilities,
  };
}

export const GET = withSecurity(
  async function GET(request: NextRequest) {
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.isAdmin) return adminCheck.error!;

    const { searchParams } = new URL(request.url);
    const days = Math.min(30, Math.max(1, Number(searchParams.get("days") ?? 7) || 7));

    try {
      const data = await buildPayload(days);
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
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.isAdmin) return adminCheck.error!;

    try {
      await ensureOperatorTables();
      const json = await request.json();
      const payload = supportSchema.parse(json);

      const ticketNumber = `OPS-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${createHash("sha1").update(randomUUID()).digest("hex").slice(0, 8).toUpperCase()}`;

      const recentRuns = await prisma.$queryRaw<Array<Record<string, unknown>>>(
        `
        SELECT id::text AS run_id, tenant_id::text AS tenant_id, status, error_message,
          COALESCE(started_at, created_at) AS started_at
        FROM reconciliation_runs
        WHERE ($1::text IS NULL OR tenant_id::text = $1::text)
          AND ($2::text IS NULL OR id::text = $2::text)
        ORDER BY COALESCE(started_at, created_at) DESC
        LIMIT 5
      `,
        payload.tenantId ?? null,
        payload.runId ?? null
      );

      const recentErrors = await prisma.$queryRaw<Array<ErrorSignatureRow>>(
        `
        SELECT
          COALESCE(metadata->>'signature', error_id::text, 'unknown_error') AS signature,
          MAX(occurred_at)::text AS last_seen,
          COUNT(*)::int AS occurrences,
          COUNT(DISTINCT tenant_id)::int AS impacted_tenants,
          COUNT(*) FILTER (WHERE occurred_at >= NOW() - interval '24 hours')::int AS occurrences_24h,
          MIN(occurred_at)::text AS first_seen,
          MAX(run_id)::text AS sample_run_id,
          MAX(tenant_id)::text AS sample_tenant_id,
          MAX(metadata->>'route') AS sample_route,
          MAX(metadata->>'module') AS sample_module,
          MAX(metadata->>'stack') AS sample_stack
        FROM operator_runtime_events
        WHERE event_type = 'error_thrown'
          AND occurred_at >= NOW() - interval '7 days'
          AND ($1::text IS NULL OR tenant_id::text = $1::text)
          AND ($2::text IS NULL OR run_id::text = $2::text)
          AND ($3::text IS NULL OR COALESCE(metadata->>'signature', error_id::text, 'unknown_error') = $3::text)
        GROUP BY 1
        ORDER BY occurrences DESC
        LIMIT 5
      `,
        payload.tenantId ?? null,
        payload.runId ?? null,
        payload.errorSignature ?? null
      );

      const linkedIssue = payload.errorSignature
        ? (
            await prisma.$queryRaw<
              Array<{ github_issue_number: number | null; github_issue_url: string | null }>
            >`
              SELECT github_issue_number, github_issue_url
              FROM operator_error_issue_links
              WHERE signature = ${payload.errorSignature}
              LIMIT 1
            `
          )[0]
        : null;

      const confidence = Math.min(
        0.98,
        0.35 +
          (recentRuns.length > 0 ? 0.2 : 0) +
          (recentErrors.length > 0 ? 0.25 : 0) +
          (linkedIssue?.github_issue_number ? 0.15 : 0)
      );

      const triage = {
        confidence,
        score: Math.round(confidence * 100),
        linkedRunCount: recentRuns.length,
        linkedErrorCount: recentErrors.length,
        linkedGithubIssue: linkedIssue?.github_issue_number ?? null,
      };

      await prisma.$executeRaw`
        INSERT INTO ops_support_tickets (
          ticket_number, user_id, subject, description, status, priority, category,
          triage_result, context, created_at, updated_at
        ) VALUES (
          ${ticketNumber}, ${adminCheck.user!.id}, ${payload.subject}, ${payload.description},
          'open',
          ${confidence >= 0.75 ? "high" : "medium"},
          ${payload.category ?? "operator"},
          ${JSON.stringify(triage)}::jsonb,
          ${JSON.stringify({
            tenantId: payload.tenantId ?? null,
            runId: payload.runId ?? null,
            errorSignature: payload.errorSignature ?? null,
            contact: payload.contact ?? null,
            recentRuns,
            recentErrors,
            linkedIssue,
          })}::jsonb,
          NOW(), NOW()
        )
      `;

      return NextResponse.json({
        success: true,
        ticketNumber,
        triage,
        linkedIssue,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({
          success: false,
          error: "Invalid payload",
          details: error.issues,
        });
      }
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : "Failed",
      });
    }
  },
  { requireAuth: true }
);
