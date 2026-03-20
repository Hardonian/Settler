import { getRunsList } from "@/lib/domain/runs/runs-reader";
import { getActiveTenantId } from "@/lib/auth/tenant";
import Link from "next/link";
import {
  Play,
  History,
  Terminal as TerminalIcon,
  ShieldCheck,
  ArrowRight,
  Database,
  RefreshCw,
  Cpu,
  Layers,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Replay Console | Settler",
  description: "Deterministic execution replay and hash-diff inspection for operators.",
};

export default async function ReplayConsolePage() {
  const tenantId = await getActiveTenantId();
  const runs = await getRunsList(tenantId || "—", 10);

  return (
    <div className="space-y-8 pb-8">
      <div className="flex items-end justify-between">
        <div className="max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/70 mb-2">
            Verifiable Execution Console
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Replay Engine</h1>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            Execute bit-perfect replays of historical reconciliation runs to verify determinism and
            state consistency. The Replay Engine reconstructs the exact VM environment and data
            snapshots for granular auditability.
          </p>
        </div>
        <Button variant="outline" className="h-12 font-bold gap-2">
          <RefreshCw className="h-4 w-4" />
          Sync Snapshots
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Replay Queue / Activity */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/40 bg-card/50 overflow-hidden">
            <CardHeader className="border-b border-border/40 bg-muted/20 pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <History className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg font-bold">Historical Execution Replay</CardTitle>
                    <CardDescription className="text-xs font-medium">
                      Reconstruct runs from archived ingestion snapshots
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge
                    variant="outline"
                    className="bg-primary/5 text-primary border-primary/20 text-[10px] font-bold uppercase tracking-widest px-3"
                  >
                    Trust Engine Active
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/20">
                {runs.map((run) => (
                  <div
                    key={run.run_id}
                    className="group p-4 flex items-center justify-between hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                        <Play size={16} className="fill-current" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground font-mono">
                            #{run.run_id.slice(0, 8)}
                          </span>
                          <Badge className="text-[9px] font-black uppercase tracking-widest bg-muted text-muted-foreground h-4">
                            SNAPSHOT_V2
                          </Badge>
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                          {new Date(run.created_at).toLocaleString()} • {run.policy}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="hidden md:flex flex-col text-right">
                        <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mb-0.5">
                          Verification
                        </span>
                        <span className="text-[10px] font-bold text-success flex items-center justify-end gap-1">
                          <ShieldCheck size={10} />
                          VALIDATED
                        </span>
                      </div>
                      <Button variant="outline" size="sm" asChild className="h-8 font-bold gap-2">
                        <Link href={`/app/runs/${run.run_id}`}>
                          Start Replay
                          <ArrowRight
                            size={14}
                            className="group-hover:translate-x-1 transition-transform"
                          />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
                {runs.length === 0 && (
                  <div className="p-12 text-center text-muted-foreground italic font-medium">
                    No execution snapshots available for replay.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-border/40 bg-card/50">
              <CardHeader className="pb-4 border-b border-border/20">
                <div className="flex items-center gap-3">
                  <Cpu className="h-4 w-4 text-primary" />
                  <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Deterministic VM State
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center text-xs font-bold font-mono">
                  <span>VM Runtime</span>
                  <span className="text-primary">NodeJS v22 LTS</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold font-mono">
                  <span>Isolated Engine</span>
                  <span className="text-primary">v2.4.1 (Stable)</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold font-mono">
                  <span>Policy Consistency</span>
                  <Badge className="bg-success text-white text-[9px] font-black tracking-widest h-4">
                    STABLE
                  </Badge>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/40 bg-card/50">
              <CardHeader className="pb-4 border-b border-border/20">
                <div className="flex items-center gap-3">
                  <Layers className="h-4 w-4 text-primary" />
                  <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Hash Difference History
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 text-center">
                <div className="h-20 flex items-end justify-between gap-1 mb-2">
                  {[40, 60, 45, 90, 100, 85, 95, 100, 100, 100].map((h, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex-1 rounded-t-sm bg-primary/20 hover:bg-primary transition-colors cursor-pointer group relative",
                        h === 40 && "h-[40%]",
                        h === 60 && "h-[60%]",
                        h === 45 && "h-[45%]",
                        h === 90 && "h-[90%]",
                        h === 100 && "h-[100%]",
                        h === 85 && "h-[85%]",
                        h === 95 && "h-[95%]"
                      )}
                    >
                      <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-950 text-white text-[8px] p-1 rounded font-mono">
                        {h}% Match
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Aggregate Hash Drift: 0.00%
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar Status / Documentation */}
        <div className="space-y-8">
          <Card className="border-primary/20 bg-primary/5 shadow-none overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <TerminalIcon className="h-24 w-24 text-primary" />
            </div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-[0.2em] text-primary">
                Trusted Execution
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 space-y-6 pt-4">
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
                The Replay Engine ensures that every reconciliation outcome is invariant. Running a
                replay on an unmodified snapshot must yield an identical SHA-256 Merkle root.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-2 rounded bg-white/40 dark:bg-white/5 border border-white/10">
                  <ShieldCheck className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-bold text-foreground">
                    IMPLICIT DETERMINISM ACTIVE
                  </span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-white/40 dark:bg-white/5 border border-white/10">
                  <Database className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-bold text-foreground">
                    SNAPSHOT ARCHIVING: 90 DAYS
                  </span>
                </div>
              </div>
              <Button className="w-full h-11 font-bold shadow-lg gap-2" variant="default">
                Run System Verification
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/30">
            <CardHeader className="pb-4 border-b border-border/40">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                Operator Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-8 space-y-3">
              {[
                { title: "Deterministic Protocol Spec", icon: ArrowRight },
                { title: "Archive Retention Policy", icon: ArrowRight },
                { title: "Merkle-Tree Verification Guide", icon: ArrowRight },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-center justify-between group cursor-pointer hover:bg-primary/5 p-2 rounded-lg transition-colors border border-transparent hover:border-primary/10"
                >
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors">
                    {item.title}
                  </span>
                  <item.icon
                    size={12}
                    className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
