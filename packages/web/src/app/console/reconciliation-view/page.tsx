/**
 * Reconciliation View Page
 */

import { ReconciliationView } from '@/components/console/ReconciliationView';
import { ConsoleErrorBoundary } from '@/components/console/ErrorBoundary';

export const dynamic = 'force-dynamic';

export default function ReconciliationViewPage() {
  return (
    <ConsoleErrorBoundary>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Reconciliation
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            View reconciliation results ranked by impact.
          </p>
        </div>
        <ReconciliationView />
      </div>
    </ConsoleErrorBoundary>
  );
}
