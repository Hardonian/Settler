import { getAlertsList } from "@/lib/domain/runs/runs-reader";
import { AlertsList } from "@/components/AlertsList";
import { Bell, Search, Activity, ShieldAlert, ShieldCheck, Zap, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AlertsPage() {
  const alerts: any[] = await getAlertsList();

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const warningCount = alerts.filter((a) => a.severity === "warning").length;
  const openCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="space-y-8 pb-8">
      {/* Page Header */}
      <section className="relative overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 via-background to-background p-8 shadow-sm">
        <div className="relative z-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/70">
            Operator Intelligence
          </p>
          <div className="flex items-center gap-4 mt-3">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Live Alerts</h1>
            {openCount > 0 && (
              <Badge
                variant="destructive"
                className="h-6 px-3 bg-destructive/80 animate-pulse border-none"
              >
                {openCount} ACTIVE
              </Badge>
            )}
          </div>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground leading-relaxed">
            Monitor infrastructure-level drift and runtime reconciliation failures. Drill into
            specific runs to confirm stable output hashes and root-cause analysis.
          </p>
        </div>
        <div className="absolute -right-12 -top-12 opacity-[0.03] pointer-events-none">
          <Bell size={320} className="text-primary" />
        </div>
      </section>

      {/* Summary Matrix */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-destructive/5 border-destructive/20 shadow-none">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-[10px] uppercase font-bold tracking-wider text-destructive/80 flex justify-between">
              Critical
              <ShieldAlert className="w-3 h-3" />
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-3xl font-mono font-bold text-destructive">{criticalCount}</p>
            <p className="text-[10px] text-destructive/60 mt-1">Immediate triage required</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/5 border-amber-500/20 shadow-none">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-[10px] uppercase font-bold tracking-wider text-amber-600 flex justify-between">
              Warning
              <Zap className="w-3 h-3" />
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-3xl font-mono font-bold text-amber-600">{warningCount}</p>
            <p className="text-[10px] text-amber-600/60 mt-1">Potential drift detected</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20 shadow-none">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-[10px] uppercase font-bold tracking-wider text-primary flex justify-between">
              Health Check
              <ShieldCheck className="w-3 h-3" />
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-3xl font-mono font-bold text-primary">Normal</p>
            <p className="text-[10px] text-primary/60 mt-1">Continuous verification active</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/50 border-border/60 shadow-none">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex justify-between">
              Uptime
              <Activity className="w-3 h-3" />
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-3xl font-mono font-bold text-foreground">99.98%</p>
            <p className="text-[10px] text-muted-foreground mt-1">Last 30 days active</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-4 items-start">
        {/* Main Feed */}
        <div className="lg:col-span-3">
          <AlertsList initialAlerts={alerts} />
        </div>

        {/* Sidebar Filters & Settings */}
        <aside className="space-y-6">
          <Card className="border-border/60">
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Search className="w-4 h-4 text-primary" />
                Search & Filter
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by ID or type..."
                  className="w-full bg-muted/30 border border-border/40 rounded-lg py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all font-mono"
                />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Severity Level
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-destructive/5 text-destructive border-destructive/20 cursor-pointer hover:bg-destructive/10"
                  >
                    CRITICAL
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-amber-500/5 text-amber-600 border-amber-500/20 cursor-pointer hover:bg-amber-500/10"
                  >
                    WARNING
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-blue-500/5 text-blue-600 border-blue-500/20 cursor-pointer hover:bg-blue-500/10"
                  >
                    INFO
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Component
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-muted/60">
                    RECONCILIATION
                  </Badge>
                  <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-muted/60">
                    SYSTEM
                  </Badge>
                  <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-muted/60">
                    SCHEMA
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20 shadow-none">
            <CardContent className="p-4">
              <h3 className="text-xs font-bold text-primary mb-2 flex items-center gap-2">
                <Filter className="w-3 h-3" />
                Smart Alert Routing
              </h3>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Settler automatically routes drift events based on their affected policy context.
                Configure PagerDuty or Slack integrations in settings.
              </p>
              <button className="mt-3 text-[10px] font-bold text-primary hover:underline">
                Edit Alert Rules →
              </button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
