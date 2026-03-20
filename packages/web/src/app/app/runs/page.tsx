import { getRunsList, getRunsSparklineData, getRunsPageStats } from "@/lib/domain/runs/runs-reader";
import { getActiveTenantId } from "@/lib/auth/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RunsDataTable } from "@/components/runs/RunsDataTable";
import {
  Play,
  ShieldCheck,
  Filter,
  Database,
  Clock,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Reconciliation Runs | Settler",
  description:
    "View and manage historical reconciliation executions and their cryptographic proofs.",
};

export default async function AppRunsPage() {
  const tenantId = await getActiveTenantId();
  const tid = tenantId || "—";

  const [runs, sparkline, stats] = await Promise.all([
    getRunsList(tid, 50),
    getRunsSparklineData(tid, 14),
    getRunsPageStats(tid),
  ]);

  const totalMatchedDisplay =
    stats && stats.totalMatched > 0
      ? stats.totalMatched.toLocaleString()
      : runs.length > 0
        ? runs.reduce((s, r) => s + (r.matched_records ?? 0), 0).toLocaleString()
        : "—";

  const avgConfDisplay =
    stats?.avgConfidence != null
      ? `${(stats.avgConfidence * 100).toFixed(2)}%`
      : runs.length > 0
        ? `${Math.round(
            (runs.reduce((s, r) => s + (r.confidence ?? 1), 0) / runs.length) * 100
          )}%`
        : "—";

  const totalRunsDisplay = stats ? stats.totalRuns.toLocaleString() : runs.length.toLocaleString();

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-end justify-between">
        <div className="max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/70 mb-2">
            Execution Ledger
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Reconciliation Runs</h1>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            A comprehensive history of all reconciliation jobs executed within your tenant. Each run
            includes a deterministic proof capsule and full lineage tracking for audit readiness.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="lg" className="h-12 font-bold gap-2">
            <Filter className="h-4 w-4" />
            Filter Results
          </Button>
          <Button
            variant="default"
            size="lg"
            className="h-12 font-bold gap-2 shadow-xl ring-1 ring-primary/20"
            asChild
          >
            <Link href="/console/playground">
              <Play className="h-4 w-4" />
              New Run
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats cards — real data, no hard-coded values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/40 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <Database className="h-3.5 w-3.5" />
              Total Runs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold font-mono">{totalRunsDisplay}</span>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-widest">
              Reconciliation Jobs
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5" />
              Avg Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold font-mono text-success">{avgConfDisplay}</span>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-widest">
              Across All Policies
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              Total Matched
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold font-mono">{totalMatchedDisplay}</span>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-widest">
              Records Reconciled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* DataTable — real data, client-side search, sparkline in toolbar */}
      <RunsDataTable runs={runs} sparkline={sparkline} />

      <section className="rounded-2xl p-8 relative overflow-hidden border border-primary/15 bg-gradient-to-br from-primary/8 via-card to-card shadow-sm">
        <div className="absolute right-0 top-0 p-8 opacity-[0.04] pointer-events-none">
          <ShieldCheck className="h-64 w-64 text-primary" />
        </div>
        <div className="relative z-10 max-w-2xl space-y-5">
          <Badge className="bg-primary/10 text-primary border-primary/30 font-semibold tracking-[0.15em] uppercase px-3 py-1 h-auto text-xs">
            Audit Ready
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Automated Evidence Generation
          </h2>
          <p className="text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-5">
            Every run generates a cryptographically signed output bundle. Send directly to auditors
            to prove mathematical correctness without exposing raw transaction data.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button className="font-semibold gap-2 shadow-sm">
              Configure Evidence Protocols
            </Button>
            <Button variant="outline" className="font-semibold gap-2" asChild>
              <Link href="/app/proofs">
                Explore Proof Graph
                <ExternalLink size={13} />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
