/**
 * Alerts View Page
 */

import { AlertsView } from '@/components/console/AlertsView';
import { ConsoleErrorBoundary } from '@/components/console/ErrorBoundary';

export const dynamic = 'force-dynamic';

export default function AlertsViewPage() {
  return (
    <ConsoleErrorBoundary>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Alerts
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Intelligent alerts with explanations and threshold tracking.
          </p>
        </div>
        <AlertsView />
      </div>
    </ConsoleErrorBoundary>
  );
}
