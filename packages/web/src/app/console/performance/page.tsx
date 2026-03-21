/**
 * Performance Monitor Page
 *
 * Full page view of API performance metrics.
 */

import { PerformanceMonitor } from "@/components/console/PerformanceMonitor";

export default function PerformancePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Performance</h1>
        <p className="text-muted-foreground">API performance, latency, and throughput metrics.</p>
      </div>
      <PerformanceMonitor />
    </div>
  );
}
