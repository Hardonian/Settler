/**
 * Reconciliation View Page
 *
 * Shows reconciliation results. Supports runId query param for workflow continuity.
 */

"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ReconciliationView } from "@/components/console/ReconciliationView";
import { ConsoleErrorBoundary } from "@/components/console/ErrorBoundary";

export default function ReconciliationViewPage() {
  const searchParams = useSearchParams();
  const runId = searchParams.get("runId");

  return (
    <ConsoleErrorBoundary>
      <div className="space-y-8">
        {/* Back navigation when coming from run detail */}
        {runId && (
          <div>
            <Link href={`/console/runs/${runId}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Run Detail
              </Button>
            </Link>
          </div>
        )}

        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Reconciliation Results
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {runId
              ? "Results from this reconciliation run, ranked by impact."
              : "View reconciliation results ranked by impact."}
          </p>
        </div>
        <ReconciliationView reconciliationId={runId || undefined} />
      </div>
    </ConsoleErrorBoundary>
  );
}
