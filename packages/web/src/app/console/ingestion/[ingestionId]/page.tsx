/**
 * Ingestion Detail Page
 * Shows ingestion results and reconciliation matches
 */

import { IngestionDashboard } from "@/components/console/IngestionDashboard";

export default function IngestionPage({
  params,
}: {
  params: { ingestionId: string };
}) {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Ingestion Details</h1>
      <IngestionDashboard ingestionId={params.ingestionId} />
    </div>
  );
}
