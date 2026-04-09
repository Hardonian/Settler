/**
 * Meaningful Changes Page
 */

import { MeaningfulChangesFeed } from "@/components/console/MeaningfulChangesFeed";
import { ConsoleErrorBoundary } from "@/components/console/ErrorBoundary";

export const dynamic = "force-dynamic";

export default function MeaningfulChangesPage() {
  return (
    <ConsoleErrorBoundary>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">What Changed</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Meaningful changes ranked by impact, urgency, and confidence.
          </p>
        </div>
        <MeaningfulChangesFeed />
      </div>
    </ConsoleErrorBoundary>
  );
}
