import {
  BarChart2,
  Clock,
  AlertCircle,
  Activity,
  Cpu,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getActiveTenantId } from "@/lib/auth/tenant";
import { getMetricsSummary, getTopMetrics } from "@/lib/metrics/repository";

async function getTenantMetrics() {
  const tenantId = await getActiveTenantId();
  if (!tenantId || tenantId === "—") {
    return { rows: [], summary: null };
  }

  try {
    const [rows, summary] = await Promise.all([
      getTopMetrics(tenantId, { kind: "slow_routes", window: "7d", limit: 10 }),
      getMetricsSummary(tenantId, "7d"),
    ]);
    return { rows: rows || [], summary };
  } catch {
    return { rows: [], summary: null };
  }
}

function LatencyBadge({ ms }: { ms: number }) {
  if (ms >= 1000) {
    return (
      <Badge variant="destructive" size="sm">
        {Math.round(ms)}ms
      </Badge>
    );
  }
  if (ms >= 500) {
    return (
      <Badge variant="warning" size="sm">
        {Math.round(ms)}ms
      </Badge>
    );
  }
  return (
    <Badge variant="success" size="sm">
      {Math.round(ms)}ms
    </Badge>
  );
}

export default async function MetricsPage() {
  const { rows, summary } = await getTenantMetrics();
  const s = (summary ?? {}) as Record<string, unknown>;
  const runsTotal = Number(s.runs_total ?? 0);
  const successRate = Number(s.success_rate ?? 0);
  const avgLatency = Number(s.avg_latency ?? 0);
  const computeTotal = Number(s.compute_total ?? 0);
  const errorCount = Number(s.errors ?? 0) + Number(s.replay_mismatches ?? 0);

  return (
    <div className="space-y-8 pb-8">
      <PageHeader
        eyebrow="Runtime Event Model"
        title="Runtime Event Signals"
        description="Event-derived route telemetry and execution metrics for operator triage (7-day window). All metrics are strictly scoped to the active tenant."
        icon={BarChart2}
        variant="hero"
      />

      {/* Tenant KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="panel shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                7d Run Success Rate
              </span>
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
            </div>
            <p className="text-2xl font-bold font-mono tabular-nums text-foreground">
              {runsTotal > 0 ? `${Math.round(successRate * 100)}%` : "—"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {runsTotal.toLocaleString()} {runsTotal === 1 ? "run" : "runs"} recorded in 7d
            </p>
          </CardContent>
        </Card>

        <Card className="panel shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Avg Route Latency
              </span>
              <Activity className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            </div>
            <p className="text-2xl font-bold font-mono tabular-nums text-foreground">
              {avgLatency > 0 ? `${Math.round(avgLatency)}ms` : "—"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Tenant API instrumentation mean
            </p>
          </CardContent>
        </Card>

        <Card className="panel shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Compute Units (7d)
              </span>
              <Cpu className="h-3.5 w-3.5 text-sky-500" aria-hidden="true" />
            </div>
            <p className="text-2xl font-bold font-mono tabular-nums text-foreground">
              {computeTotal > 0 ? computeTotal.toLocaleString() : "0"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Deterministic engine execution units
            </p>
          </CardContent>
        </Card>

        <Card className="panel shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                5xx & Drift Signals
              </span>
              <AlertTriangle
                className={`h-3.5 w-3.5 ${errorCount > 0 ? "text-amber-500" : "text-muted-foreground/50"}`}
                aria-hidden="true"
              />
            </div>
            <p
              className={`text-2xl font-bold font-mono tabular-nums ${errorCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}
            >
              {errorCount.toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Server errors & replay mismatches
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="panel shadow-sm">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" aria-hidden="true" />
              Top Slow Routes
            </CardTitle>
            <Badge variant="outline" size="sm">
              7-day window
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted/40 border border-border/60">
                <AlertCircle className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">
                No metrics collected yet
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                Route telemetry will appear here once your API endpoints begin receiving traffic.
                Metrics are captured automatically from API route instrumentation.
              </p>
            </div>
          ) : (
            <div
              className="divide-y divide-border/40"
              role="table"
              aria-label="Slow routes by average latency"
            >
              <div
                className="flex items-center justify-between px-5 py-2.5 bg-muted/20"
                role="row"
                aria-rowindex={0}
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Route
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Avg Latency
                </span>
              </div>
              {rows.map((row: any, i: number) => (
                <div
                  key={row.route}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/20 transition-colors"
                  role="row"
                  aria-rowindex={i + 1}
                >
                  <code className="text-sm text-foreground font-mono truncate max-w-[60%]">
                    {row.route}
                  </code>
                  <LatencyBadge ms={Number(row.avg_latency_ms ?? 0)} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Context note */}
      <div className="notice-strip text-muted-foreground">
        <BarChart2 className="h-4 w-4 text-muted-foreground/60 shrink-0" aria-hidden="true" />
        <p className="text-xs leading-relaxed">
          This surface reflects route-level event telemetry only. For full observability, connect an
          APM integration in{" "}
          <a href="/app/integrations" className="text-primary hover:underline font-medium">
            Integrations
          </a>
          .
        </p>
      </div>
    </div>
  );
}
