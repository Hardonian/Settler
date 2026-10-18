import type { Metadata } from "next";
import { TimeTravelDebuggerWorkbench } from "@/components/console/TimeTravelDebuggerWorkbench";
import { ConsoleErrorBoundary } from "@/components/console/ErrorBoundary";

export const metadata: Metadata = {
  title: "Time-Travel Forensic Financial Debugger | Settler Console",
  description:
    "Interactive microsecond timeline scrubber reconstructing exact dual-ledger balances and SMT-256 state transitions at any historical epoch.",
};

export default function TimeTravelPage() {
  return (
    <ConsoleErrorBoundary>
      <div className="space-y-6">
        <TimeTravelDebuggerWorkbench />
      </div>
    </ConsoleErrorBoundary>
  );
}
