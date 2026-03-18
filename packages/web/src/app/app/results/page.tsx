import ResultsTable from "@/components/ResultsTable";

export default function ResultsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Reconciliation
        </p>
        <h1 className="text-2xl font-semibold text-foreground">Transaction Results</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Reconciliation outcomes for matched, mismatched, and flagged transactions.
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <ResultsTable />
      </div>
    </div>
  );
}
