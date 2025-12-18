/**
 * Reconciliation Run Detail Page
 * Shows reconciliation matches and results
 */

import { ReconciliationMatches } from "@/components/console/ReconciliationMatches";

export default function ReconciliationPage({
  params,
}: {
  params: { runId: string };
}) {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Reconciliation Results</h1>
      <ReconciliationMatches runId={params.runId} />
    </div>
  );
}
