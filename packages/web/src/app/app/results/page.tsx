import { getMatchesList } from "@/lib/domain/runs/runs-reader";
import ResultsTable from "@/components/ResultsTable";

export const metadata = {
  title: "Transaction Results | Settler",
  description: "Reconciliation outcomes and audit-grade match evidence.",
};

export default async function ResultsPage() {
  const matches = await getMatchesList();

  return (
    <div className="space-y-8 pb-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/70 mb-2">
          Reconciliation
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Transaction Results</h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground leading-relaxed">
          Detailed reconciliation outcomes for matched, unmatched, and flagged transactions. Drill
          into specific matches to inspect SHA-256 evidence chains.
        </p>
      </div>

      <ResultsTable initialMatches={matches} />
    </div>
  );
}
