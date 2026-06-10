/**
 * System Diagnostics Page
 *
 * Shows real runtime connectivity health sourced from /api/health.
 * No synthetic fleet metrics, no hardcoded infrastructure values.
 *
 * What this page shows:
 * - Database connectivity (live check)
 * - Supabase connectivity (live check)
 * - Runtime environment validity (live check)
 * - Links to operator surfaces and support tooling
 *
 * What this page does NOT show:
 * - CPU / memory (not available in Next.js App Router server components)
 * - Worker fleet metrics (not applicable to this deployment model)
 * - Redis or object storage ping (not exposed in health endpoint)
 */

import { headers } from "next/headers";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Database,
  Shield,
  ExternalLink,
  Info,
} from "lucide-react";
import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import { getGovernanceRecoveryHref } from "@/lib/governance/freeze-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = {
  title: "Diagnostics | Settler Console",
  description: "Runtime connectivity and environment health for your Settler workspace.",
};

type CheckStatus = "ok" | "error" | "unknown";

interface HealthCheck {
  status: CheckStatus;
  message?: string;
}

interface HealthPayload {
  overallStatus?: "healthy" | "degraded" | "unhealthy";
  checks?: Record<string, HealthCheck>;
  connectivity?: {
    checks?: Record<string, { ok?: boolean; status?: string; reason?: string }>;
    degraded_reasons?: string[];
    timestamp?: string;
  };
  traceId?: string;
  error?: string;
}

async function fetchHealth(): Promise<HealthPayload | null> {
  try {
    const h = await headers();
    const host = h.get("host") || "localhost:3000";
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const res = await fetch(`${protocol}://${host}/api/health`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as HealthPayload;
  } catch {
    return null;
  }
}

function statusIcon(status: CheckStatus | boolean | undefined) {
  if (status === true || status === "ok") {
    return <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />;
  }
  if (status === false || status === "error") {
    return <XCircle className="h-4 w-4 text-destructive" />;
  }
  return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
}

function statusBadge(status: CheckStatus | boolean | undefined) {
  if (status === true || status === "ok") {
    return (
      <Badge
        variant="outline"
        className="text-green-700 border-green-300 bg-green-50 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800"
      >
        OK
      </Badge>
    );
  }
  if (status === false || status === "error") {
    return <Badge variant="destructive">Error</Badge>;
  }
  return <Badge variant="outline">Unknown</Badge>;
}

interface CheckRowProps {
  label: string;
  description: string;
  status: CheckStatus | boolean | undefined;
  message?: string;
}

function CheckRow({ label, description, status, message }: CheckRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-border/40 last:border-0">
      <div className="flex items-start gap-3 min-w-0">
        <div className="mt-0.5">{statusIcon(status)}</div>
        <div className="min-w-0">
          <div className="text-sm font-medium">{label}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
          {message && (
            <div className="text-xs text-muted-foreground/70 mt-1 font-mono break-all">
              {message}
            </div>
          )}
        </div>
      </div>
      <div className="shrink-0">{statusBadge(status)}</div>
    </div>
  );
}

export default async function DiagnosticsPage() {
  const health = await fetchHealth();

  const fetchFailed = !health;
  const overallStatus = health?.overallStatus ?? "unknown";
  const checks = health?.checks ?? {};
  const connChecks = health?.connectivity?.checks ?? {};
  const degradedReasons = health?.connectivity?.degraded_reasons ?? [];
  const ts = health?.connectivity?.timestamp ?? null;

  const envOk = checks.env?.status === "ok";

  return (
    <div className="space-y-6 pb-12">
      <ConsolePageHeader
        title="Diagnostics"
        description="Runtime connectivity health for your Settler workspace. All checks source from live API calls — no synthetic values."
      />

      {fetchFailed && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="pt-6 flex items-start gap-3">
            <XCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-destructive">Health endpoint unreachable</p>
              <p className="text-xs text-muted-foreground mt-1">
                The diagnostics page could not fetch{" "}
                <code className="text-[11px]">/api/health</code>. The app itself is running if you
                see this page, but the health check circuit failed. Check your environment variables
                and Supabase configuration.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overall status banner */}
      {!fetchFailed && (
        <Card
          className={
            overallStatus === "healthy"
              ? "border-green-300 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800/40"
              : overallStatus === "degraded"
                ? "border-yellow-300 bg-yellow-50/50 dark:bg-yellow-950/20 dark:border-yellow-700/40"
                : "border-destructive/40 bg-destructive/5"
          }
        >
          <CardContent className="pt-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Activity
                className={`h-5 w-5 ${overallStatus === "healthy" ? "text-green-600 dark:text-green-400" : overallStatus === "degraded" ? "text-yellow-600 dark:text-yellow-400" : "text-destructive"}`}
              />
              <div>
                <p className="text-sm font-semibold">
                  {overallStatus === "healthy"
                    ? "All connectivity checks passed"
                    : overallStatus === "degraded"
                      ? "Some connectivity checks degraded"
                      : "Connectivity checks failed"}
                </p>
                {ts && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Checked at {new Date(ts).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            <Badge
              variant={
                overallStatus === "healthy"
                  ? "outline"
                  : overallStatus === "degraded"
                    ? "warning"
                    : "destructive"
              }
              className={
                overallStatus === "healthy"
                  ? "text-green-700 border-green-300 dark:text-green-400 dark:border-green-800"
                  : ""
              }
            >
              {overallStatus.toUpperCase()}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Degraded reasons */}
      {degradedReasons.length > 0 && (
        <Card className="border-yellow-300/60 bg-yellow-50/30 dark:bg-yellow-950/10">
          <CardContent className="pt-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Degraded signals
            </p>
            <ul className="space-y-1">
              {degradedReasons.map((r, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 mt-0.5 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Runtime checks */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-2 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-semibold">Connectivity checks</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Live checks run on each page load against your configured environment.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              {fetchFailed ? (
                <p className="text-sm text-muted-foreground py-4">
                  Health endpoint unreachable — checks unavailable.
                </p>
              ) : (
                <>
                  <CheckRow
                    label="Environment variables"
                    description="Required Supabase and app environment variables are present."
                    status={envOk ? "ok" : "error"}
                    message={checks.env?.message}
                  />
                  <CheckRow
                    label="Database (Prisma/PostgreSQL)"
                    description="Prisma can reach the configured database endpoint."
                    status={connChecks.database ? connChecks.database.ok : checks.database?.status}
                    message={connChecks.database?.reason || checks.database?.message}
                  />
                  <CheckRow
                    label="Supabase connectivity"
                    description="Supabase client can reach the configured project."
                    status={connChecks.supabase ? connChecks.supabase.ok : checks.supabase?.status}
                    message={connChecks.supabase?.reason || checks.supabase?.message}
                  />
                  <CheckRow
                    label="Runtime environment"
                    description="App runtime can read its required configuration."
                    status={
                      connChecks.runtime_env ? connChecks.runtime_env.ok : envOk ? "ok" : "error"
                    }
                    message={connChecks.runtime_env?.reason}
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* Scope note */}
          <Card className="border-border/30 bg-muted/20">
            <CardContent className="pt-6 flex items-start gap-3">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="text-xs text-muted-foreground leading-relaxed space-y-2">
                <p>
                  <strong className="font-medium text-foreground">Scope of these checks:</strong>{" "}
                  connectivity checks validate that the app can reach its core dependencies. They do
                  not surface application-layer metrics (CPU, memory, queue depth) — those are
                  available in your infrastructure provider console.
                </p>
                <p>
                  Worker-level metrics, cache state, and fleet telemetry are not exposed here
                  because this deployment model does not provide application-layer resource
                  visibility via the web runtime. If you need infrastructure observability, consult
                  your Vercel / host dashboard.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: operator surfaces */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-semibold">Operator surfaces</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Evidence-backed observability surfaces with query-backed truth.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-between" asChild>
                <Link href="/console/operator-digest">
                  <span>Operator digest</span>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-between" asChild>
                <Link href="/console/runs">
                  <span>Run history</span>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-between" asChild>
                <Link href="/console/admin/tenants">
                  <span>Tenant observability</span>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-between" asChild>
                <Link href={getGovernanceRecoveryHref()}>
                  <span>Governance controls</span>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-between" asChild>
                <Link href="/status">
                  <span>Public status page</span>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-between" asChild>
                <Link href="/console/audit-trail">
                  <span>Audit trail</span>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-semibold">Support & reporting</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-between" asChild>
                <Link href="/console/report-issue">
                  <span>Report an issue</span>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-between" asChild>
                <Link href="/console/support">
                  <span>Support inbox (admin)</span>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
