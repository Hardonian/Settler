import { SLADashboard } from "@/components/console/SLADashboard";
import { ConsoleErrorBoundary } from "@/components/console/ErrorBoundary";

export default function SLAPage() {
  return (
    <ConsoleErrorBoundary>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">SLA Compliance</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Monitor service level agreement targets, track compliance metrics, and review
            performance against committed thresholds.
          </p>
        </div>
        <SLADashboard />
      </div>
    </ConsoleErrorBoundary>
  );
}
