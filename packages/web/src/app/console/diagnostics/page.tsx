import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Terminal as TerminalIcon,
  Search,
  RefreshCw,
  ShieldCheck,
  Zap,
  Server,
  Cloud,
  Database,
  SearchCode,
  Globe,
} from "lucide-react";

export const metadata = {
  title: "System Diagnostics | Settler",
  description: "Deep-level infrastructure health and cryptographic integrity monitoring.",
};

export default function DiagnosticsPage() {
  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-end justify-between">
        <div className="max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/70 mb-2">
            System Observability
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Diagnostics</h1>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            Real-time health telemetry across the reconciliation fleet. Monitor resource usage,
            worker health, and the cryptographic consistency of distributed trust nodes.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="lg" className="h-12 font-bold gap-2">
            <RefreshCw className="h-4 w-4" />
            Full System Re-Scan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Resource Telemetry */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-border/40 overflow-hidden glass border-l-4 border-l-primary/60">
            <CardHeader className="bg-muted/10 pb-6 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg font-bold italic underline">
                      Resource Real-time Telemetry
                    </CardTitle>
                    <CardDescription className="text-xs font-medium">
                      Performance metrics for active reconciliation workers
                    </CardDescription>
                  </div>
                </div>
                <Badge className="bg-success text-white font-black tracking-widest text-[9px] h-6 px-3">
                  ALL SYSTEMS NOMINAL
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-12">
              <div className="grid grid-cols-2 gap-12">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                      Fleet Heap Memory
                    </span>
                    <span className="text-sm font-bold font-mono">4.12 GB / 64 GB</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[6.4%]" />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium italic">
                    Peak utilization during batch match: 12.8 GB
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                      Orchestration CPU
                    </span>
                    <span className="text-sm font-bold font-mono">1.2% / 100%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[1.2%]" />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium italic underline italic">
                    Worker auto-scaling active (Min: 4, Max: 64)
                  </p>
                </div>
              </div>

              <div className="pt-8 border-t border-border/20 space-y-6">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Cloud className="h-4 w-4 text-primary" />
                  Infrastructure Layer Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: "Redis Mesh Connection", status: "Healthy", ping: "0.2ms" },
                    { label: "Postgres Connection Pool", status: "Available", ping: "1.4ms" },
                    { label: "Object Store Persistence", status: "Verified", ping: "—" },
                    { label: "Global Auth Node (Edge)", status: "Active", ping: "18ms" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="p-4 rounded-xl border border-border/40 bg-muted/20 flex items-center justify-between"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">
                          {item.label}
                        </span>
                        <span className="text-xs font-bold font-mono text-primary uppercase italic underline">
                          {item.status}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground/60">
                        {item.ping}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/50 overflow-hidden">
            <CardHeader className="pb-4 border-b border-border/40">
              <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-[0.2em] text-muted-foreground">
                <SearchCode className="h-4 w-4" />
                Recent Anomaly Traces
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/20 italic">
                {[
                  {
                    id: "TR-921",
                    time: "14:21:05",
                    detail: "Signature mismatch on ingestion packet retry [REF: sk_921]",
                    lvl: "Warn",
                  },
                  {
                    id: "TR-884",
                    time: "12:05:12",
                    detail: "Worker NODE-14 garbage collection took > 200ms",
                    lvl: "Info",
                  },
                ].map((trace) => (
                  <div
                    key={trace.id}
                    className="p-4 flex items-center justify-between group hover:bg-primary/5 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-bold text-muted-foreground/60 font-mono">
                        {trace.time}
                      </span>
                      <span className="text-xs font-medium text-foreground">{trace.detail}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-black tracking-widest h-5 ${trace.lvl === "Warn" ? "text-warning border-warning/30 bg-warning/5" : "text-primary border-primary/30 bg-primary/5"}`}
                    >
                      TRACE_{trace.lvl.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-muted/10 text-center border-t border-border/20">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary"
                >
                  Clear Diagnostics Buffer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-8">
          <Card className="border-border/40 bg-slate-950 shadow-2xl relative overflow-hidden group h-fit">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="pb-4">
              <div className="p-2 rounded-lg bg-primary/20 text-primary w-fit mb-4">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <CardTitle className="text-white text-lg font-bold italic underline">
                Integrity Health Check
              </CardTitle>
              <CardDescription className="text-slate-400 font-medium">
                Verify the cryptographic consistency of the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-2">
                    <Globe size={14} className="opacity-40" />
                    Trust Graph Sync
                  </span>
                  <span className="text-primary font-mono italic underline">100% OK</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-2">
                    <Database size={14} className="opacity-40" />
                    Archive Retention
                  </span>
                  <span className="text-primary font-mono italic underline">VERIFIED</span>
                </div>
              </div>
              <div className="pt-6 border-t border-white/5 space-y-4">
                <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase tracking-widest italic underline pb-4 italic">
                  Manual verification triggers a full scan of all Merkle roots for the current
                  tenant. This process may take several minutes.
                </p>
                <Button className="w-full h-11 font-bold shadow-2xl gap-2 shadow-primary/40 group-hover:ring-2 ring-primary/40 transition-all">
                  Exert System Pressure Test
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/50">
            <CardHeader className="pb-4 border-b border-border/20">
              <div className="flex items-center gap-3">
                <TerminalIcon className="h-4 w-4 text-primary" />
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Operator Toolbox
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3 pt-6">
              <Button
                variant="outline"
                className="w-full h-10 text-xs font-bold justify-between group hover:border-primary/40 transition-all"
              >
                <span>Export Health Report</span>
                <RefreshCw
                  size={12}
                  className="text-muted-foreground group-hover:text-primary transition-colors"
                />
              </Button>
              <Button
                variant="outline"
                className="w-full h-10 text-xs font-bold justify-between group hover:border-primary/40 transition-all"
              >
                <span>Flush Engine Cache</span>
                <RefreshCw
                  size={12}
                  className="text-muted-foreground group-hover:text-primary transition-colors"
                />
              </Button>
              <Button
                variant="outline"
                className="w-full h-10 text-xs font-bold justify-between group hover:border-primary/40 transition-all"
              >
                <span>Provision New Worker</span>
                <Server
                  size={12}
                  className="text-muted-foreground group-hover:text-primary transition-colors"
                />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
