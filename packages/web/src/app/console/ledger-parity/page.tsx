import type { Metadata } from "next";
import Link from "next/link";
import { LedgerParityWorkbench } from "@/components/console/LedgerParityWorkbench";
import { ConsoleErrorBoundary } from "@/components/console/ErrorBoundary";
import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import { Button } from "@/components/ui/button";
import { History, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "TigerBeetle Live Parity Cockpit | Settler Console",
  description:
    "Real-time dual-ledger balance sheet parity, two-phase commit verification, and cross-ledger volume invariant monitoring.",
};

export default function LedgerParityPage() {
  return (
    <ConsoleErrorBoundary>
      <div className="space-y-6">
        <ConsolePageHeader
          title="TigerBeetle Live Parity Cockpit"
          description="Continuous verification of double-entry zero-sum invariants, 2PC pending commitments, and clearing volume parity between TigerBeetle and relational state."
          breadcrumbs={[
            { label: "Console", href: "/console" },
            { label: "Reconciliation core", href: "/console/reconciliations" },
            { label: "Ledger Parity" },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
                <Link href="/console/time-travel">
                  <History className="w-3.5 h-3.5 text-cyan-400" />
                  Time-Travel Debugger
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
                <Link href="/console/audit-dossier">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  Audit Dossier
                </Link>
              </Button>
            </div>
          }
        />
        <LedgerParityWorkbench />
      </div>
    </ConsoleErrorBoundary>
  );
}
