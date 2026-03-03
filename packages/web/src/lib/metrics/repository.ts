import { prisma } from "@/shared/db/prismaClient";

export type MetricsWindow = "24h" | "7d" | "30d";
export type MetricsBucket = "hour" | "day";

const WINDOW_SQL: Record<MetricsWindow, string> = {
  "24h": "24 hours",
  "7d": "7 days",
  "30d": "30 days",
};

const GROUP_BY_SQL = {
  status: "status",
  route: "route",
  policy: "policy_id",
} as const;

function toWindow(window: string | null): MetricsWindow {
  if (window === "24h" || window === "30d") return window;
  return "7d";
}

export async function getMetricsSummary(tenantId: string, windowParam: string | null) {
  const window = toWindow(windowParam);
  const interval = WINDOW_SQL[window];

  const [runs] = await prisma.$queryRaw<Array<Record<string, unknown>>>(
    `
    SELECT
      COUNT(*)::int AS runs_total,
      COALESCE(AVG(CASE WHEN status = 'succeeded' THEN 1 ELSE 0 END), 0) AS success_rate,
      COALESCE(AVG(CASE WHEN replay_ok = true THEN 1 ELSE 0 END), 0) AS replay_verified_rate
    FROM run_metrics
    WHERE tenant_id = $1
      AND created_at >= NOW() - INTERVAL '${interval}'
  `,
    tenantId
  );

  const [requests] = await prisma.$queryRaw<Array<Record<string, unknown>>>(
    `
    SELECT
      COALESCE(AVG(latency_ms),0) AS avg_latency,
      COALESCE(AVG(CASE WHEN rate_limited THEN 1 ELSE 0 END),0) AS rate_limited_rate,
      COALESCE(AVG(CASE WHEN cache_hit THEN 1 ELSE 0 END),0) AS cache_hit_rate
    FROM request_metrics
    WHERE tenant_id = $1
      AND created_at >= NOW() - INTERVAL '${interval}'
  `,
    tenantId
  );

  const [economics] = await prisma.$queryRaw<Array<Record<string, unknown>>>(
    `
    SELECT
      COALESCE(SUM(compute_units),0) AS compute_total,
      COALESCE(SUM(cas_io_units),0) AS cas_io_total,
      COALESCE(AVG(compute_units),0) AS compute_avg_per_run,
      COALESCE(AVG(cas_io_units),0) AS cas_io_avg_per_run
    FROM economic_metrics
    WHERE tenant_id = $1
      AND created_at >= NOW() - INTERVAL '${interval}'
  `,
    tenantId
  );

  const [alerts] = await prisma.$queryRaw<Array<Record<string, unknown>>>(
    `
    SELECT
      (SELECT COUNT(*)::int FROM drift_metrics d WHERE d.tenant_id = $1 AND d.created_at >= NOW() - INTERVAL '${interval}' AND d.replay_verification = false) AS replay_mismatches,
      (SELECT COUNT(*)::int FROM policy_metrics p WHERE p.tenant_id = $1 AND p.created_at >= NOW() - INTERVAL '${interval}' AND p.budget_overrun_count > 0) AS budget_overruns,
      (SELECT COUNT(*)::int FROM request_metrics r WHERE r.tenant_id = $1 AND r.created_at >= NOW() - INTERVAL '${interval}' AND r.status_code >= 500) AS errors
  `,
    tenantId
  );

  return { ...runs, ...requests, ...economics, ...alerts, window };
}

export async function getMetricsTimeseries(
  tenantId: string,
  params: { metric: string; bucket: MetricsBucket; window: string | null; groupBy: string }
) {
  const window = toWindow(params.window);
  const interval = WINDOW_SQL[window];
  const bucket = params.bucket === "day" ? "day" : "hour";
  const groupColumn = GROUP_BY_SQL[params.groupBy as keyof typeof GROUP_BY_SQL] ?? "status";

  if (params.metric === "latency_p95") {
    return prisma.$queryRaw<Array<Record<string, unknown>>>(
      `
      SELECT date_trunc('${bucket}', created_at) AS bucket,
             route AS group_value,
             percentile_cont(0.50) WITHIN GROUP (ORDER BY latency_ms) AS p50,
             percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms) AS p95
      FROM request_metrics
      WHERE tenant_id = $1
        AND created_at >= NOW() - INTERVAL '${interval}'
      GROUP BY 1,2
      ORDER BY 1 ASC
    `,
      tenantId
    );
  }

  if (params.metric === "compute_units") {
    return prisma.$queryRaw<Array<Record<string, unknown>>>(
      `
      SELECT date_trunc('${bucket}', created_at) AS bucket,
             run_id AS group_value,
             SUM(compute_units) AS value,
             SUM(cas_io_units) AS cas_io_units
      FROM economic_metrics
      WHERE tenant_id = $1
        AND created_at >= NOW() - INTERVAL '${interval}'
      GROUP BY 1,2
      ORDER BY 1 ASC
    `,
      tenantId
    );
  }

  return prisma.$queryRaw<Array<Record<string, unknown>>>(
    `
    SELECT date_trunc('${bucket}', created_at) AS bucket,
           ${groupColumn} AS group_value,
           COUNT(*)::int AS value
    FROM run_metrics
    WHERE tenant_id = $1
      AND created_at >= NOW() - INTERVAL '${interval}'
    GROUP BY 1,2
    ORDER BY 1 ASC
  `,
    tenantId
  );
}

export async function getTopMetrics(
  tenantId: string,
  params: { kind: string; window: string | null; limit: number }
) {
  const window = toWindow(params.window);
  const interval = WINDOW_SQL[window];

  if (params.kind === "expensive_runs") {
    return prisma.$queryRaw<Array<Record<string, unknown>>>(
      `
      SELECT run_id, SUM(compute_units + cas_io_units) AS total_units
      FROM economic_metrics
      WHERE tenant_id = $1
        AND created_at >= NOW() - INTERVAL '${interval}'
      GROUP BY run_id
      ORDER BY total_units DESC
      LIMIT $2
    `,
      tenantId,
      params.limit
    );
  }

  if (params.kind === "denied_policies") {
    return prisma.$queryRaw<Array<Record<string, unknown>>>(
      `
      SELECT policy_id, SUM(deny_count + budget_overrun_count) AS deny_events
      FROM policy_metrics
      WHERE tenant_id = $1
        AND created_at >= NOW() - INTERVAL '${interval}'
      GROUP BY policy_id
      ORDER BY deny_events DESC
      LIMIT $2
    `,
      tenantId,
      params.limit
    );
  }

  return prisma.$queryRaw<Array<Record<string, unknown>>>(
    `
    SELECT route, AVG(latency_ms) AS avg_latency_ms, MAX(latency_ms) AS max_latency_ms
    FROM request_metrics
    WHERE tenant_id = $1
      AND created_at >= NOW() - INTERVAL '${interval}'
    GROUP BY route
    ORDER BY avg_latency_ms DESC
    LIMIT $2
  `,
    tenantId,
    params.limit
  );
}
