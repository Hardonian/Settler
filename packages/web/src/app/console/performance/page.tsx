/**
 * Performance Monitor Page
 * 
 * Full page view of API performance metrics.
 */

import { PerformanceMonitor } from '@/components/console/PerformanceMonitor';

export default function PerformancePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Performance
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          API performance, latency, and throughput metrics.
        </p>
      </div>
      <PerformanceMonitor />
    </div>
  );
}
