import { getRunsList } from "@/lib/domain/runs/runs-reader";
import { getActiveTenantId } from "@/lib/auth/tenant";
import Link from "next/link";
import { 
  Play, 
  History, 
  Terminal, 
  ShieldCheck, 
  ArrowRight,
  Database
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Replay Lab | Settler",
  description: "Deterministic execution replay and hash-diff inspection.",
};

export default async function ReplayPage() {
  const tenantId = await getActiveTenantId();
  const runs = await getRunsList(tenantId || "—", 15);

  return (
    <div className="space-y-8 pb-8">
      <div className="max-w-4xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/70 mb-2">
          Verifiable Infrastructure
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Replay Lab
        </h1>
        <p className="mt-4 text-base text-muted-foreground leading-relaxed">
          Validate determinism with point-in-time execution replay. 
          The Replay Lab allows you to reconstruct any historical 
          reconciliation run using the exact snapshot of data and rules at the time of execution.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-border/40 bg-card/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
               <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                 <History className="h-4 w-4" />
                 Replay Queue
               </h2>
               <Link href="/app/runs" className="text-xs font-bold text-primary hover:underline">
                 View History →
               </Link>
            </div>

            <div className="space-y-3">
              {runs.map((run) => (
                <div key={run.run_id} className="flex items-center justify-between p-4 rounded-xl border border-border/40 hover:bg-muted/30 transition-all group">
                   <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                         <Play className="h-5 w-5 fill-current" />
                      </div>
                      <div>
                         <p className="text-sm font-bold text-foreground font-mono">#{run.run_id.slice(0, 8)}</p>
                         <p className="text-xs text-muted-foreground">
                           {run.policy} • {new Date(run.created_at).toLocaleTimeString()}
                         </p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="text-right mr-4 hidden sm:block">
                         <p className="text-[10px] font-bold text-muted-foreground opacity-60 uppercase tracking-widest mb-0.5">Status</p>
                         <p className="text-[10px] font-mono font-bold text-foreground">
                           {run.status_label}
                         </p>
                      </div>
                      <Button variant="default" size="sm" asChild className="h-8 rounded-lg font-bold gap-2">
                         <Link href={`/app/runs/${run.run_id}`}>
                           Replay
                           <ArrowRight className="h-3.5 w-3.5" />
                         </Link>
                      </Button>
                   </div>
                </div>
              ))}
              {runs.length === 0 && (
                <p className="text-sm text-center py-12 text-muted-foreground italic">No historical runs available for replay.</p>
              )}
            </div>
          </CardContent>
        </Card>
...

        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5 shadow-none overflow-hidden relative">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <Terminal className="h-20 w-20 text-primary" />
             </div>
             <CardContent className="p-6 relative z-10">
                <h3 className="text-sm font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                   <ShieldCheck className="h-4 w-4" />
                   Trusted Replay
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold mb-4">
                  Settler guarantees determinism. Replay results are cryptographically checked against 
                  the original execution fingerprint stored in the immutable trust log.
                </p>
                <div className="space-y-3">
                   <div className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1" />
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Hash-Diff Inspection</p>
                   </div>
                   <div className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1" />
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Snapshot Verification</p>
                   </div>
                   <div className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1" />
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Evidence Export</p>
                   </div>
                </div>
             </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/30">
             <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                   <Database className="h-4 w-4 text-muted-foreground" />
                   <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">Snapshot Depth</h3>
                </div>
                <div className="space-y-4">
                   <div>
                      <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase mb-1.5">
                         <span>Snapshot Storage</span>
                         <span className="text-foreground">84%</span>
                      </div>
                      <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                         <div className="h-full bg-primary w-[84%]" />
                      </div>
                   </div>
                   <p className="text-[10px] text-muted-foreground italic">
                     Historical snapshots are archived after 90 days.
                   </p>
                </div>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
