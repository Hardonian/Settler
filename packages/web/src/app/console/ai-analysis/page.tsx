/**
 * Analysis Page
 */

import { AnalysisPanel } from '@/components/console/AIAnalysisPanel';
import { ConsoleErrorBoundary } from '@/components/console/ErrorBoundary';

export const dynamic = 'force-dynamic';

export default function AnalysisPage() {
  return (
    <ConsoleErrorBoundary>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Analysis
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Advanced analysis for deeper insights. Available on Pro and Enterprise tiers.
          </p>
        </div>
        <AnalysisPanel />
      </div>
    </ConsoleErrorBoundary>
  );
}
