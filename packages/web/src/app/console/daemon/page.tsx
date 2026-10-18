import { Metadata } from "next";
import { AutonomousDaemonWorkbench } from "@/components/console/AutonomousDaemonWorkbench";
import { ConsoleErrorBoundary } from "@/components/console/ErrorBoundary";

export const metadata: Metadata = {
  title: "Continuous Settlement Daemon | Settler Console",
  description:
    "Autonomous micro-settlement daemon executing continuous matching loops across TigerBeetle and relational ledgers with sub-second finality.",
};

export default function DaemonConsolePage() {
  return (
    <ConsoleErrorBoundary>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Autonomous Continuous Settlement Daemon
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Real-time control plane and telemetry cockpit for the continuous micro-settlement loop,
            distributed lease management, and circuit breaker health.
          </p>
        </div>
        <AutonomousDaemonWorkbench />
      </div>
    </ConsoleErrorBoundary>
  );
}
