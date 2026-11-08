import Link from "next/link";
import { getRunsList, RunListItem } from "@/lib/domain/runs/runs-reader";
import { getActiveTenantId } from "@/lib/auth/tenant";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, ArrowRight, ExternalLink } from "lucide-react";

async function getRuns(): Promise<RunListItem[]> {
  try {
    const tenantId = await getActiveTenantId();
    if (!tenantId || tenantId === "—") return [];
    return await getRunsList(tenantId, 50);
  } catch (err) {
    console.error("[MismatchesPage] Error fetching runs:", err);
    return [];
  }
}

export default async function MismatchesPage() {
  const runs = await getRuns();
  const mismatches = runs.filter(
    (run) =>
      run.status !== "completed" ||
      (run.unmatched_records ?? 0) > 0 ||
      (run.unresolved_exceptions ?? 0) > 0 ||
      run.summary_state === "review_needed"
  );

  const totalUnmatchedRecords = mismatches.reduce((s, r) => s + (r.unmatched_records ?? 0), 0);
  const totalUnresolvedExceptions = mismatches.reduce(
    (s, r) => s + (r.unresolved_exceptions ?? 0),
    0
  );

  return (
    <div className="space-y-8 pb-8">
      <PageHeader
        eyebrow="Exception Triage"
        title="Detected Mismatches"
        description="Reconciliation runs with unmatched records, unresolved exceptions, or non-terminal execution status requiring operator adjudication."
        icon={AlertTriangle}
        variant="hero"
        actions={
          <Link
            href="/app/runs"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            All Runs
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        }
      />

      {/* Summary KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="panel shadow-none">
          <CardContent className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Runs Flagged
            </p>
            <p className="text-2xl font-bold font-mono tabular-nums mt-1">
              {mismatches.length.toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Out of {runs.length.toLocaleString()} recent runs
            </p>
          </CardContent>
        </Card>
        <Card className="panel shadow-none">
          <CardContent className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Unmatched Records
            </p>
            <p className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-1">
              {totalUnmatchedRecords.toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Source or target discrepancies
            </p>
          </CardContent>
        </Card>
        <Card className="panel shadow-none">
          <CardContent className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Unresolved Exceptions
            </p>
            <p className="text-2xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400 mt-1">
              {totalUnresolvedExceptions.toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Awaiting operator sign-off</p>
          </CardContent>
        </Card>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/40 text-left border-b border-border/60">
            <tr>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Run ID
              </th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Created
              </th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">
                Unmatched
              </th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">
                Exceptions
              </th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {mismatches.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500/70 mb-2" />
                  <p className="text-sm font-semibold text-foreground">No mismatches detected</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    All recent reconciliation runs completed cleanly without unmatched records.
                  </p>
                </td>
              </tr>
            ) : (
              mismatches.map((row) => (
                <tr key={row.run_id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-foreground">
                    {row.run_id}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        row.status === "failed"
                          ? "destructive"
                          : row.summary_state === "review_needed"
                            ? "warning"
                            : "secondary"
                      }
                      size="sm"
                    >
                      {row.summary_state === "review_needed" ? "review needed" : row.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">
                    {(row.unmatched_records ?? 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">
                    {(row.unresolved_exceptions ?? 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/app/runs/${row.run_id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      Inspect Run
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
