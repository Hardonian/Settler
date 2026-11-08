import { getAlertsList } from "@/lib/domain/runs/runs-reader";
import { AlertsList } from "@/components/AlertsList";
import { Bell, Activity, ShieldAlert, ShieldCheck, Zap, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/app/PageHeader";
import Link from "next/link";

export default async function AlertsPage() {
  const alerts: any[] = await getAlertsList();

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const warningCount = alerts.filter((a) => a.severity === "warning").length;
  const openCount = alerts.filter((a) => !a.acknowledged).length;
  const ackCount = alerts.filter((a) => a.acknowledged).length;

  return (
    <div className="space-y-8 pb-8">
      <PageHeader
        eyebrow="Operator Intelligence"
        title="Live Alerts"
        description="Monitor infrastructure-level drift and runtime reconciliation failures. Drill into specific runs to confirm stable output hashes and root-cause analysis."
        icon={Bell}
        variant="hero"
        actions={
          openCount > 0 ? (
            <Badge variant="destructive" className="h-6 px-3 animate-pulse">
              {openCount} ACTIVE
            </Badge>
          ) : undefined
        }
      />

      {/* Summary Matrix */}
      <div className="stat-strip">
        <Card className="panel bg-destructive/5 border-destructive/20 shadow-none">
          <CardContent className="p-4 pt-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-destructive/80">
                Critical
              </p>
              <ShieldAlert className="w-3 h-3 text-destructive/60" aria-hidden="true" />
            </div>
            <p className="kpi-value text-destructive">{criticalCount}</p>
            <p className="text-[10px] text-destructive/60 mt-1">Immediate triage required</p>
          </CardContent>
        </Card>

        <Card className="panel bg-amber-500/5 border-amber-500/20 shadow-none">
          <CardContent className="p-4 pt-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
                Warning
              </p>
              <Zap className="w-3 h-3 text-amber-500/60" aria-hidden="true" />
            </div>
            <p className="kpi-value text-amber-600 dark:text-amber-400">{warningCount}</p>
            <p className="text-[10px] text-amber-600/60 mt-1">Potential drift detected</p>
          </CardContent>
        </Card>

        <Card className="panel bg-primary/5 border-primary/20 shadow-none">
          <CardContent className="p-4 pt-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                Health Check
              </p>
              <ShieldCheck className="w-3 h-3 text-primary/60" aria-hidden="true" />
            </div>
            <p className="kpi-value text-primary">{criticalCount > 0 ? "Degraded" : "Normal"}</p>
            <p className="text-[10px] text-primary/60 mt-1">Continuous verification active</p>
          </CardContent>
        </Card>

        <Card className="panel shadow-none">
          <CardContent className="p-4 pt-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Acknowledged
              </p>
              <Activity className="w-3 h-3 text-muted-foreground/60" aria-hidden="true" />
            </div>
            <p className="kpi-value">{ackCount}</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Out of {alerts.length} recorded events
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-4 items-start">
        {/* Main Feed */}
        <div className="lg:col-span-3">
          <AlertsList initialAlerts={alerts} />
        </div>

        {/* Sidebar Context */}
        <aside className="space-y-4">
          <Card className="panel bg-primary/5 border-primary/20 shadow-none">
            <CardContent className="p-4">
              <h3 className="text-xs font-bold text-primary mb-2 flex items-center gap-1.5">
                <Filter className="w-3 h-3" aria-hidden="true" />
                Smart Alert Routing
              </h3>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Settler automatically routes drift events based on their affected policy context.
                Configure PagerDuty or Slack integrations in settings.
              </p>
              <Link
                href="/app/rules"
                className="inline-block mt-3 text-[10px] font-bold text-primary hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
              >
                Edit Alert Rules →
              </Link>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
