import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Layers,
  Search,
  Trash2,
  Settings,
  ShieldCheck,
  Zap,
  Filter,
  CheckSquare,
  Database,
  ArrowRight,
  Monitor,
} from "lucide-react";

export const metadata = {
  title: "Bulk Operations | Settler",
  description: "Perform large-scale administrative actions on your reconciliation ledger.",
};

const datasets = [
  {
    id: "ds_911",
    name: "Stripe Monthly Sync 2026-03",
    count: 148291,
    status: "stable",
    integrity: "verified",
  },
  {
    id: "ds_884",
    name: "Adyen Historical Import v2",
    count: 521948,
    status: "pending",
    integrity: "unchecked",
  },
  {
    id: "ds_712",
    name: "TigerBeetle Batch P1",
    count: 120593,
    status: "stable",
    integrity: "verified",
  },
];

export default function BulkOperationsPage() {
  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-end justify-between">
        <div className="max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/70 mb-2">
            Governance & Cleanup
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Bulk Operations</h1>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed font-medium italic">
            Manage large datasets, perform schema migrations, and coordinate multi-run
            administrative actions. These operations require high-level privileges and generate
            detailed audit evidence.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="lg" className="h-12 font-bold gap-2">
            <Filter className="h-4 w-4" />
            Advanced Selection
          </Button>
          <Button
            variant="destructive"
            size="lg"
            className="h-12 font-bold gap-2 shadow-xl shadow-destructive/20 border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive hover:text-white transition-all"
          >
            <Trash2 className="h-5 w-5" />
            Purge Inactive Clusters
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Dataset Selection List */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-border/40 overflow-hidden glass shadow-2xl relative">
            <CardHeader className="bg-muted/10 pb-6 border-b border-border/40 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Layers className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg font-bold">Manage Active Clusters</CardTitle>
                    <CardDescription className="text-xs font-medium">
                      Coordinate actions across 1.2M total records
                    </CardDescription>
                  </div>
                </div>
                <div className="relative group">
                  <div className="absolute inset-0 bg-primary/10 rounded-lg blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Filter by source..."
                      className="h-10 pl-9 pr-4 rounded-xl bg-card border border-border/60 text-xs font-bold focus:ring-1 focus:ring-primary w-56 shadow-sm transition-all"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 relative z-10">
              <div className="divide-y divide-border/20 italic">
                {datasets.map((ds) => (
                  <div
                    key={ds.id}
                    className="group p-6 flex items-center justify-between hover:bg-primary/5 transition-colors cursor-pointer border-l-2 border-transparent hover:border-l-primary"
                  >
                    <div className="flex items-center gap-6">
                      <CheckSquare className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors cursor-pointer" />
                      <div className="h-12 w-12 rounded-2xl bg-muted/40 flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all">
                        <Database size={24} />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-all">
                          {ds.name}
                        </h3>
                        <div className="flex gap-4">
                          <span className="text-[10px] items-center gap-1 font-bold text-muted-foreground/60 uppercase tracking-widest">
                            {ds.count.toLocaleString()} Records
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[9px] font-black uppercase tracking-widest h-4 ${ds.integrity === "verified" ? "text-success border-success/30 bg-success/5" : "text-slate-400 border-border/60"}`}
                          >
                            {ds.integrity}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 px-4 font-bold border-l border-border/20 flex flex-col items-end gap-0.5 ml-8 group-hover:bg-white/40 dark:group-hover:bg-white/5"
                    >
                      <span className="text-[10px] font-black italic underline underline-offset-4">
                        Cluster Action
                      </span>
                      <ArrowRight
                        size={14}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
            <div className="p-4 bg-muted/20 border-t border-border/40 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 opacity-40" />
              Select records to trigger cryptographic batch verification
            </div>
          </Card>

          <footer className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-12">
            <Card className="border-border/40 bg-card/50 shadow-none border-dashed hover:border-primary/20 transition-colors">
              <CardHeader className="pb-4 border-b border-border/20">
                <div className="flex items-center gap-3">
                  <Zap className="h-4 w-4 text-primary" />
                  <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground font-black">
                    Optimization Engine
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-[10px] leading-relaxed italic text-muted-foreground font-medium mb-6 uppercase tracking-wider">
                  Batch compression reduces storage overhead by up to 85% for stable truth clusters.
                  Integrity is maintained via cold Merkle roots.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 px-4 font-bold italic underline border-primary/20 bg-primary/5 text-primary"
                >
                  Run Cluster Optimization
                </Button>
              </CardContent>
            </Card>
            <Card className="border-border/40 bg-card/50 shadow-none border-dashed hover:border-primary/20 transition-colors">
              <CardHeader className="pb-4 border-b border-border/20">
                <div className="flex items-center gap-3">
                  <Monitor className="h-4 w-4 text-primary" />
                  <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground font-black">
                    Manual Policy Apply
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-[10px] leading-relaxed italic text-muted-foreground font-medium mb-6 uppercase tracking-wider">
                  Apply matching policies to existing archived clusters without re-ingesting raw
                  events from the source adapter.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 px-4 font-bold italic underline border-primary/20 bg-primary/5 text-primary"
                >
                  Trigger Bulk Match Reprocess
                </Button>
              </CardContent>
            </Card>
          </footer>
        </div>

        {/* Action Sidebar Controls */}
        <div className="space-y-8">
          <Card className="border-primary/20 bg-primary/5 shadow-none overflow-hidden relative group h-fit">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform">
              <Settings className="h-32 w-32 text-primary" />
            </div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-[0.2em] text-primary">
                Bulk Engine
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 space-y-8 pt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">
                    Operation Sensitivity
                  </p>
                  <div className="flex gap-2">
                    <div className="flex-1 h-8 rounded-lg bg-white/40 dark:bg-white/5 border border-primary/40 flex items-center justify-center text-[10px] font-bold text-primary">
                      NORMAL
                    </div>
                    <div className="flex-1 h-8 rounded-lg bg-white/20 dark:bg-white/5 border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                      CAREFUL
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">
                    Consistency Target
                  </p>
                  <Badge
                    variant="outline"
                    className="w-full h-8 justify-center bg-white/40 dark:bg-white/5 border-primary/20 font-bold italic underline border-l-2 border-l-primary/60"
                  >
                    Quorum Verification (Strong)
                  </Badge>
                </div>
              </div>

              <div className="pt-8 border-t border-primary/20 space-y-4">
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-bold italic underline italic underline-offset-4">
                  Bulk actions are irreversible once committed to the trust graph. Always verify
                  policy snapshots in the playground first.
                </p>
                <Button
                  className="w-full h-11 font-bold shadow-2xl gap-2 shadow-primary/40"
                  variant="default"
                >
                  Commit Selected Operations
                </Button>
              </div>
            </CardContent>
          </Card>

          <section className="p-8 rounded-2xl bg-muted/10 border border-border/40 text-center space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              Last Audit Event
            </h4>
            <p className="text-xs font-bold text-foreground italic border-b border-primary/20 pb-4 italic">
              Bulk Purge Cluster: ds_441
            </p>
            <div className="flex items-center justify-center gap-4 text-[10px] font-black uppercase text-muted-foreground/60">
              <span>March 19, 01:21 UTC</span>
              <span>•</span>
              <span>Actor: scott</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
