import { getMatchesList } from "@/lib/domain/runs/runs-reader";
import ResultsTable from "@/components/ResultsTable";
import { PageHeader } from "@/components/app/PageHeader";
import { TableProperties } from "lucide-react";

export const metadata = {
  title: "Transaction Results | Settler",
  description: "Reconciliation outcomes and audit-grade match evidence.",
};

export default async function ResultsPage() {
  const matches = await getMatchesList();

  return (
    <div className="space-y-8 pb-8">
      <PageHeader
        eyebrow="Reconciliation"
        title="Transaction Results"
        description="Detailed reconciliation outcomes for matched, unmatched, and flagged transactions. Drill into specific matches to inspect SHA-256 evidence chains."
        icon={TableProperties}
        variant="hero"
      />
      <ResultsTable initialMatches={matches} />
    </div>
  );
}
