/**
 * Feature Flags Policy Page
 */

import { FeatureFlagsPolicy } from '@/components/console/FeatureFlagsPolicy';
import { ConsoleErrorBoundary } from '@/components/console/ErrorBoundary';

export const dynamic = 'force-dynamic';

export default function FeatureFlagsPolicyPage() {
  return (
    <ConsoleErrorBoundary>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Feature Flags
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage business policy controls (alert thresholds, sensitivity, export permissions).
          </p>
        </div>
        <FeatureFlagsPolicy />
      </div>
    </ConsoleErrorBoundary>
  );
}
