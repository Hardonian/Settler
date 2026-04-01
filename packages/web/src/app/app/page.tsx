import Link from "next/link";
import { getDashboardStats } from "@/lib/domain/runs/runs-reader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  ShieldCheck,
  AlertCircle,
  Zap,
  ArrowRight,
  PieChart,
  History,
  Terminal,
  Server,
  Layers,
} from "lucide-react";
import ControlPlaneOverview from "@/components/ControlPlaneOverview";
import { performHealthCheck } from "@/lib/monitoring/health-check";
import { runAllAlertChecks } from "@/lib/monitoring/alerts";

const workflows = [
  {
    name: "Evidence Query",
    description: "Audit-ready trust artifacts and machine-readable evidence lineage.",
    href: "/app/evidence",
    icon: Terminal,
  },
  {
    name: "Replay Lab",
    description: "Deterministic execution replay to confirm stable output hashes.",
    href: "/app/replay",
    icon: History,
  },
  {
    name: "Truth Explorer",
    description: "Drill into proof lineage, impacted artifacts, and verification checks.",
    href: "/app/proofs",
    icon: ShieldCheck,
  },
  {
    name: "Policy Simulation",
    description: "Evaluate tolerance impacts on runtime behavior before rollout.",
    href: "/app/policies",
    icon: Zap,
  },
];

export default async function AppPage() {
  const stats = await getDashboardStats();

  // Fetch real health status directly from monitoring libs
  let healthData: any;
  try {
    const health = await performHealthCheck();
    const alerts = await runAllAlertChecks();
    
    // Transform checks array to object for component compatibility
    const checksObj: Record<string, any> = {};
    health.checks.forEach((c: any) => {
      checksObj[c.service] = {
        status: c.status,
        latency: c.latency,
        error: c.error,
        details: c.details,
        timestamp: health.timestamp,
      };
    });

    healthData = {
      status: health.overall,
      checks: checksObj,
      alerts: alerts.filter((a: any) => !a.resolved),
      timestamp: health.timestamp,
    };
  } catch {
    // Health check logic failed — fall through to unknown state
    healthData = {
      status: "unknown",
      checks: {
        database: { status: "unknown", timestamp: new Date().toISOString() },
        reconciliation: { status: "unknown", timestamp: new Date().toISOString() },
      },
      timestamp: new Date().toISOString(),
    };
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 via-background to-background p-8 shadow-sm glass">
        <div className="relative z-10">
          <p className="section-eyebrow text-primary/70">
            Control Plane
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground">
            Deterministic Reconciliation Dashboard
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground leading-relaxed">
            Infrastructure-grade oversight for your financial flows. Monitor integrity scores,
            investigate drift events, and trigger deterministic replays across isolated tenants.
          </p>
        </div>
        <div className="absolute -right-12 -top-12 opacity-[0.03] pointer-events-none noise-overlay">
          <Activity size={320} className="text-primary" />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Real Metrics Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="stat-strip">
            {/* Integrity Score */}
            <Card className="panel bg-background/50">
              <CardContent className="p-4 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Integrity</p>
                  <ShieldCheck className="w-3 h-3 text-primary/60" aria-hidden="true" />
                </div>
                <p className="kpi-value text-primary">{stats?.metrics?.integrity_score ?? 100}%</p>
                <Progress
                  value={stats?.metrics?.integrity_score ?? 100}
                  className="h-1 mt-2"
                  indicatorClassName="bg-primary"
                />
              </CardContent>
            </Card>

            {/* Total Runs */}
            <Card className="panel bg-background/50">
              <CardContent className="p-4 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Runs</p>
                  <PieChart className="w-3 h-3 text-muted-foreground/60" aria-hidden="true" />
                </div>
                <p className="kpi-value">{stats?.metrics?.total_runs ?? 0}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Aggregate lifetime</p>
              </CardContent>
            </Card>

            {/* Mismatches */}
            <Card className="panel bg-destructive/5 border-destructive/20">
              <CardContent className="p-4 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-destructive/80">Mismatches</p>
                  <AlertCircle className="w-3 h-3 text-destructive/60" aria-hidden="true" />
                </div>
                <p className="kpi-value text-destructive">{stats?.metrics?.unmatched_runs ?? 0}</p>
                <p className="text-[10px] text-destructive/60 mt-1">Requires triage</p>
              </CardContent>
            </Card>

            {/* Pending Exceptions */}
            <Card className={`panel ${(stats?.metrics?.pending_exceptions ?? 0) > 0 ? "bg-amber-500/5 border-amber-500/20" : "bg-background/50"}`}>
              <CardContent className="p-4 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${(stats?.metrics?.pending_exceptions ?? 0) > 0 ? "text-amber-600" : "text-muted-foreground"}`}>Exceptions</p>
                  <Zap className={`w-3 h-3 ${(stats?.metrics?.pending_exceptions ?? 0) > 0 ? "text-amber-500/60" : "text-muted-foreground/60"}`} aria-hidden="true" />
                </div>
                <p className={`kpi-value ${(stats?.metrics?.pending_exceptions ?? 0) > 0 ? "text-amber-600 dark:text-amber-400" : ""}`}>
                  {stats?.metrics?.pending_exceptions ?? 0}
                </p>
                {(stats?.metrics?.pending_exceptions ?? 0) > 0 ? (
                  <Link
                    href="/console/exceptions"
                    className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold hover:underline flex items-center gap-1 mt-1"
                  >
                    <AlertCircle className="w-3 h-3" />
                    Triage now →
                  </Link>
                ) : (
                  <p className="text-[10px] text-muted-foreground mt-1">All resolved</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="panel shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <History className="w-4 h-4 text-primary" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription className="text-xs">Latest reconciliation results and state changes</CardDescription>
                </div>
                <Link
                  href="/app/runs"
                  className="text-xs font-semibold text-primary hover:underline hover:translate-x-0.5 transition-transform flex items-center gap-1 focus-visible:ring-2 ring-primary ring-offset-2 rounded-sm"
                >
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-4 p-0">
              {stats?.recent && stats.recent.length > 0 ? (
                <div className="divide-y divide-border/30">
                  {stats.recent.map((run: any) => (
                    <Link
                      key={run.id}
                      href={`/console/runs/${run.id}`}
                      className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors animate-fade-in group focus-visible:bg-muted/50 outline-none"
                    >
                      <div className="flex gap-4 items-center min-w-0">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${run.status.includes("completed") && !run.status.includes("mismatch") ? "bg-success" : run.status.includes("mismatch") || run.status === "failed" ? "bg-destructive" : "bg-primary"}`}
                        />
                        <div className="truncate">
                          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                            {run.description}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {run.id.slice(0, 12)}...
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <Badge variant="outline" className="text-[10px] bg-muted/20">
                          {run.status.replace(/_/g, " ")}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(run.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No recent run activity found for this tenant.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Status & Workflows */}
        <div className="space-y-6">
          <Card className="panel shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Server className="w-4 h-4 text-primary" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <ControlPlaneOverview health={healthData} />
            </CardContent>
          </Card>

          <section>
            <h2 className="section-eyebrow mb-4 px-1">
              Critical Workflows
            </h2>
            <div className="grid gap-3">
              {workflows.map((workflow) => (
                <Link
                  key={workflow.name}
                  href={workflow.href}
                  className="group relative flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md active:scale-[0.98] focus-visible:ring-2 ring-primary ring-offset-2"
                >
                  <div className="rounded-lg bg-primary/5 p-2 group-hover:bg-primary/10 transition-colors">
                    <workflow.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-foreground">{workflow.name}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                      {workflow.description}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </section>

          <Card className="bg-primary/5 border-primary/20 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Integration Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect your upstream adapters (Stripe, Shopify, TigerBeetle) to trigger live
                reconciliation jobs.
              </p>
              <Link
                href="/app/connections"
                className="mt-3 inline-flex text-xs font-bold text-primary hover:underline"
              >
                Manage Adapters →
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
