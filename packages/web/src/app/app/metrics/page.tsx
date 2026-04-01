import { headers } from "next/headers";
import { BarChart2, Clock, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

async function getTop() {
  const h = await headers();
  const host = h.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const res = await fetch(
    `${protocol}://${host}/api/v1/metrics/top?kind=slow_routes&window=7d&limit=10`,
    {
      headers: { authorization: h.get("authorization") || "" },
      cache: "no-store",
    }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.rows || [];
}

function LatencyBadge({ ms }: { ms: number }) {
  if (ms >= 1000) {
    return <Badge variant="destructive" size="sm">{Math.round(ms)}ms</Badge>;
  }
  if (ms >= 500) {
    return <Badge variant="warning" size="sm">{Math.round(ms)}ms</Badge>;
  }
  return <Badge variant="success" size="sm">{Math.round(ms)}ms</Badge>;
}

export default async function MetricsPage() {
  const rows = await getTop();

  return (
    <div className="space-y-8 pb-8">
      <PageHeader
        eyebrow="Runtime Event Model"
        title="Runtime Event Signals"
        description="Event-derived route telemetry for operator triage. This surface focuses on top slow routes and should be read as partial runtime event visibility — not a full observability stack."
        icon={BarChart2}
        variant="hero"
      />

      <Card className="panel shadow-sm">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" aria-hidden="true" />
              Top Slow Routes
            </CardTitle>
            <Badge variant="outline" size="sm">7-day window</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted/40 border border-border/60">
                <AlertCircle className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">No metrics collected yet</h3>
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
          This surface reflects route-level event telemetry only. For full observability, connect
          an APM integration in{" "}
          <a href="/app/integrations" className="text-primary hover:underline font-medium">
            Integrations
          </a>
          .
        </p>
      </div>
    </div>
  );
}
