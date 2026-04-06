import { headers } from "next/headers";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { AnimatedHero } from "@/components/AnimatedHero";
import ControlPlaneOverview from "@/components/ControlPlaneOverview";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle, Server } from "lucide-react";

export const metadata = {
  title: "System Status | Settler",
  description:
    "Point-in-time connectivity for core dependencies. No historical uptime or SLA figures are shown here.",
};

type StatusPayload = {
  overallStatus?: string;
  systems?: Array<{ name?: string; status?: string }>;
  connectivity?: {
    checks?: Record<
      string,
      { ok?: boolean; status?: string; reason?: string }
    >;
    degraded_reasons?: string[];
    timestamp?: string;
  };
  error?: string;
};

async function fetchStatus(): Promise<StatusPayload | null> {
  const h = await headers();
  const host = h.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  try {
    const res = await fetch(`${protocol}://${host}/api/status`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as StatusPayload;
  } catch {
    return null;
  }
}

function checkUiStatus(ok: boolean | undefined): "healthy" | "degraded" {
  return ok ? "healthy" : "degraded";
}

export default async function StatusPage() {
  const status = await fetchStatus();
  const ts = status?.connectivity?.timestamp ?? new Date().toISOString();
  const checks = status?.connectivity?.checks;
  const dbOk = checks?.database?.ok === true;
  const sbOk = checks?.supabase?.ok === true;
  const envOk = checks?.runtime_env?.ok === true;

  const hasConnectivity = Boolean(checks);
  const overallHealthy = hasConnectivity && dbOk && sbOk && envOk;

  const healthData = hasConnectivity
    ? {
        status: overallHealthy ? ("healthy" as const) : ("degraded" as const),
        checks: {
          database: {
            status: checkUiStatus(dbOk),
            timestamp: ts,
            ...(checks?.database?.reason ? { error: checks.database.reason } : {}),
          },
          supabase: {
            status: checkUiStatus(sbOk),
            timestamp: ts,
            ...(checks?.supabase?.reason ? { error: checks.supabase.reason } : {}),
          },
          "runtime-env": {
            status: checkUiStatus(envOk),
            timestamp: ts,
            ...(checks?.runtime_env?.reason ? { error: checks.runtime_env.reason } : {}),
          },
        },
        timestamp: ts,
      }
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <AnimatedHero
        badge="System connectivity"
        title="Dependency reachability"
        description="This page shows point-in-time checks for database, Supabase, and required runtime configuration. It does not publish uptime percentages, regional failover maps, incident timelines, or vendor recovery commitments unless separately verified and linked."
      />

      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto -mt-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-border/40 shadow-xl overflow-hidden glass">
              <CardHeader className="bg-primary/5 pb-6 border-b border-border/40">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                      <Activity className="h-6 w-6 text-primary" />
                      Current connectivity
                    </CardTitle>
                    <CardDescription className="font-medium mt-1">
                      Live probes only — not a historical availability or incident record.
                    </CardDescription>
                  </div>
                  <Badge
                    className={
                      overallHealthy
                        ? "bg-success/10 text-success border-success/20 px-3 py-1 font-bold text-sm uppercase tracking-wider"
                        : "bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-500/25 px-3 py-1 font-bold text-sm uppercase tracking-wider"
                    }
                  >
                    {hasConnectivity
                      ? overallHealthy
                        ? "Dependencies reachable"
                        : "Degraded"
                      : "Unavailable"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-10">
                <ControlPlaneOverview health={healthData} />
                {!hasConnectivity && status?.error && (
                  <p className="mt-4 text-sm text-amber-700 dark:text-amber-400">{status.error}</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                  <Server className="h-4 w-4" />
                  What we intentionally do not show here
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
                  <li>Historical uptime or SLA attainment (requires external monitoring and contract)</li>
                  <li>RPO/RTO or durability claims (see canonical claims registry in docs)</li>
                  <li>Multi-region failover or edge topology maps (deployment-specific; not inferred)</li>
                  <li>Compliance certifications (only listed when audit-backed)</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="border-border/40">
              <CardHeader className="pb-4 border-b border-border/40">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Operator note
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-sm text-muted-foreground">
                <p>
                  For go-live verification, use the canonical path in{" "}
                  <span className="font-mono text-xs">docs/launch/canonical-go-live-path.md</span>{" "}
                  (preflight, env validation, deploy, smoke, rollback).
                </p>
                <p className="text-xs font-mono bg-muted/50 rounded-md p-3">
                  GET /api/status — aggregate + connectivity
                  <br />
                  GET /api/status/health — connectivity JSON (probe contract)
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
