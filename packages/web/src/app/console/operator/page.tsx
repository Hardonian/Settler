import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Layers,
  ShieldCheck,
  Zap,
  Globe,
  Cpu,
  Terminal,
  Search,
  HardDrive,
} from "lucide-react";
import ControlPlaneOverview from "@/components/ControlPlaneOverview";

export const metadata = {
  title: "Operator Console | Settler",
  description: "Real-time fleet monitoring and control-plane health for Settler infrastructure.",
};

export default function OperatorPage() {
  const healthData = {
    status: "healthy",
    checks: {
      database: { status: "healthy", latency: 4, timestamp: new Date().toISOString() },
      reconciliation: { status: "healthy", latency: 12, timestamp: new Date().toISOString() },
      "trust-graph": { status: "healthy", latency: 8, timestamp: new Date().toISOString() },
      storage: { status: "healthy", timestamp: new Date().toISOString() },
    },
    timestamp: new Date().toISOString(),
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-end justify-between">
        <div className="max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/70 mb-2">
            Infrastructure Fleet Control
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground italic">
            Operator Interface
          </h1>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            Direct access to the Settler control plane. Monitor engine orchestration, agent health,
            and global synchronization state across your multi-region reconciliation deployment.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Fleet Integrity Card */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-border/40 shadow-xl overflow-hidden glass border-l-4 border-l-primary/60">
            <CardHeader className="bg-primary/5 pb-6 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg font-bold">Orchestration Health</CardTitle>
                    <CardDescription className="text-xs font-medium">
                      Global control-plane status and latency
                    </CardDescription>
                  </div>
                </div>
                <Badge className="bg-success/10 text-success border-success/20 px-3 py-1 font-bold text-xs uppercase tracking-widest">
                  FLEET NOMINAL
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <ControlPlaneOverview health={healthData} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-border/40 bg-card/50">
              <CardHeader className="pb-4 border-b border-border/20">
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-primary" />
                  <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Regional Synchronization
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {[
                  { region: "US-EAST-1", status: "In-Sync", RTT: "4ms" },
                  { region: "EU-WEST-2", status: "In-Sync", RTT: "62ms" },
                  { region: "AP-SOUTH-1", status: "Lagged", RTT: "241ms", warning: true },
                ].map((item) => (
                  <div key={item.region} className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-muted-foreground">
                      {item.region}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-mono opacity-60">RTT: {item.RTT}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-black tracking-widest h-5 ${item.warning ? "text-warning border-warning/30 bg-warning/5 animate-pulse" : "text-success border-success/30 bg-success/5"}`}
                      >
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="border-border/40 bg-card/50">
              <CardHeader className="pb-4 border-b border-border/20">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <HardDrive className="h-4 w-4 text-primary" />
                  <CardTitle className="text-xs font-bold uppercase tracking-widest">
                    Proof Persistence
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase">
                      <span>S3 Cold Archive</span>
                      <span className="text-primary tracking-widest">94% EFFICIENCY</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[94%]" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase">
                      <span>Redis Mirror Lag</span>
                      <span className="text-primary tracking-widest">0.02ms</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[2%]" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar Diagnostics */}
        <div className="space-y-8">
          <Card className="border-border/40 bg-card/50 shadow-none overflow-hidden h-full flex flex-col">
            <CardHeader className="bg-muted/10 border-b border-border/20 relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-10 -mr-6 -mt-6">
                <Terminal className="h-24 w-24 text-primary" />
              </div>
              <div className="relative z-10 flex flex-col space-y-1">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-primary">
                  Live Diagnostics
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Active Orchestrator Nodes
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-2 py-1 rounded bg-success/5 border border-success/20 text-success"
                      >
                        <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                        <span className="text-[10px] font-mono font-bold tracking-tight text-success uppercase italic">
                          NODE-0{i}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2 pt-4">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Recent Fleet Events
                  </p>
                  <div className="space-y-3 font-mono text-[10px] leading-relaxed text-muted-foreground bg-slate-950 p-4 rounded-xl border border-white/5">
                    <p>
                      <span className="text-primary">02:31:12</span> [PROG] Deploy V2.4.1 Fleet
                      wide...
                    </p>
                    <p>
                      <span className="text-primary">02:35:01</span> [FLEET] NODE-01 Rollout
                      Verified.
                    </p>
                    <p>
                      <span className="text-primary">02:35:45</span> [FLEET] NODE-02 Rollout
                      Verified.
                    </p>
                    <p>
                      <span className="text-success">02:38:00</span> [SUCCESS] Health Gradients
                      Balanced.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border/40 space-y-4">
                <div className="flex items-center justify-between group cursor-pointer hover:bg-primary/5 p-2 rounded-lg transition-colors">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors flex items-center gap-2">
                    <Search size={14} className="opacity-40" />
                    View Full Diagnostics
                  </span>
                </div>
                <div className="flex items-center justify-between group cursor-pointer hover:bg-primary/5 p-2 rounded-lg transition-colors">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors flex items-center gap-2">
                    <Layers size={14} className="opacity-40" />
                    Memory Snapshot
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <section className="p-6 rounded-2xl bg-primary/5 border border-primary/10 flex flex-col items-center text-center space-y-4">
            <Cpu className="h-10 w-10 text-primary opacity-40" />
            <h4 className="text-sm font-bold tracking-tight italic">Engine Version: 2.4.1</h4>
            <p className="text-[10px] text-muted-foreground font-medium max-w-[200px] leading-relaxed italic uppercase tracking-widest">
              High-integrity reconciliation core v2.4.1 is verified for production workloads.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
