/**
 * Support Page
 * 
 * Full support page with ticket creation and management.
 */

import { SupportWidget } from '@/components/console/SupportWidget';
import { ConsoleErrorBoundary } from '@/components/console/ErrorBoundary';

export default function SupportPage() {
  return (
    <ConsoleErrorBoundary>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Support
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Get help with Settler. Create a support ticket and we'll get back to you soon.
          </p>
        </div>

        <SupportWidget />
      </div>
    </ConsoleErrorBoundary>
  );
}
