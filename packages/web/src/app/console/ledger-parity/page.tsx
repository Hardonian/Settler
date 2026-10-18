import { Metadata } from "next";
import { LedgerParityWorkbench } from "@/components/console/LedgerParityWorkbench";
import { ConsoleErrorBoundary } from "@/components/console/ErrorBoundary";

export const metadata: Metadata = {
  title: "TigerBeetle Live Parity Cockpit | Settler Console",
  description:
    "Real-time dual-ledger balance sheet parity, two-phase commit verification, and cross-ledger volume invariant monitoring.",
};

export default function LedgerParityPage() {
  return (
    <ConsoleErrorBoundary>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            TigerBeetle Live Parity Cockpit
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Continuous verification of double-entry zero-sum invariants, 2PC pending commitments,
            and clearing volume parity between TigerBeetle and relational state.
          </p>
        </div>
        <LedgerParityWorkbench />
      </div>
    </ConsoleErrorBoundary>
  );
}
