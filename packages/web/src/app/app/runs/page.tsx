import { getRunsList } from "@/lib/domain/runs/runs-reader";
import { getActiveTenantId } from "@/lib/auth/tenant";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Play,
  History,
  ShieldCheck,
  Search,
  Filter,
  ArrowRight,
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
  const runs = await getRunsList(tenantId || "—", 20);

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/40 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <Database className="h-3.5 w-3.5" />
              Total Throughput
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold font-mono">1.28M</span>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-widest">
              Transactions Matched
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
            <span className="text-2xl font-bold font-mono text-success">99.98%</span>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-widest">
              Across All Policies
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              Avg Execution Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold font-mono">12.4s</span>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-widest">
              Per 100k Records
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/40 shadow-sm overflow-hidden glass">
        <CardHeader className="pb-4 border-b border-border/40 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <History className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg font-bold">Execution History</CardTitle>
                <CardDescription className="font-medium">
                  Browse and inspect past reconciliation outcomes
                </CardDescription>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search run ID or policy..."
                className="h-10 pl-10 pr-4 rounded-xl bg-muted/40 border-none text-sm font-medium focus:ring-1 focus:ring-primary w-72 transition-all"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/20 border-b border-border/40">
                <TableHead className="w-[140px]">Run ID</TableHead>
                <TableHead>Policy</TableHead>
                <TableHead>Matched Content</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Executed At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => (
                <TableRow
                  key={run.run_id}
                  className="group border-b border-border/20 last:border-0 hover:bg-primary/5 transition-colors"
                >
                  <TableCell className="font-mono text-xs font-bold text-primary group-hover:underline cursor-pointer">
                    #{run.run_id.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 flex-shrink-0 bg-primary/5 rounded-lg flex items-center justify-center">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-foreground">{run.policy}</span>
                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                          v2.4 {run.manual ? "• Manual" : "• Scheduled"}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-bold text-foreground">
                    {(run.matched_records ?? 0).toLocaleString()} records
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={(run.confidence ?? 1) * 100}
                        indicatorClassName={
                          (run.confidence ?? 1) >= 0.98
                            ? "bg-success"
                            : (run.confidence ?? 1) >= 0.9
                              ? "bg-warning"
                              : "bg-destructive"
                        }
                        className="h-1 max-w-[60px]"
                      />
                      <span
                        className={`text-xs font-bold ${(run.confidence ?? 1) >= 0.98 ? "text-success" : (run.confidence ?? 1) >= 0.9 ? "text-warning" : "text-destructive"}`}
                      >
                        {Math.round((run.confidence ?? 1) * 100)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                    {new Date(run.created_at).toLocaleString([], {
                      month: "short",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-8 group-hover:bg-primary group-hover:text-primary-foreground font-bold"
                      >
                        <Link href={`/app/runs/${run.run_id}`}>
                          Inspect
                          <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {runs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-4 opacity-40">
                      <History className="h-12 w-12" />
                      <p className="text-sm font-bold italic tracking-tight">
                        No reconciliation runs have been executed yet.
                      </p>
                      <Button asChild variant="outline" size="sm">
                        <Link href="/console/playground">Execute your first run</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
            <Button
              variant="outline"
              className="font-semibold gap-2"
              asChild
            >
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
