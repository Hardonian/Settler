import { BulkOperations } from "@/components/console/BulkOperations";
import { ConsoleErrorBoundary } from "@/components/console/ErrorBoundary";

export default function BulkOperationsPage() {
  return (
    <ConsoleErrorBoundary>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Bulk Operations
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Execute batch actions across reconciliation runs, receipts, and data records. Monitor
            progress and review results.
          </p>
        </div>
        <BulkOperations />
      </div>
    </ConsoleErrorBoundary>
  );
}
