/**
 * Receipts Hash View Page
 */

import { ReceiptsHashView } from '@/components/console/ReceiptsHashView';
import { ConsoleErrorBoundary } from '@/components/console/ErrorBoundary';

export const dynamic = 'force-dynamic';

export default function ReceiptsHashPage() {
  return (
    <ConsoleErrorBoundary>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Receipts
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Tamper-evident receipts with hash chain integrity verification.
          </p>
        </div>
        <ReceiptsHashView />
      </div>
    </ConsoleErrorBoundary>
  );
}
