import type { Metadata } from "next";
import Link from "next/link";
import { AutonomousDaemonWorkbench } from "@/components/console/AutonomousDaemonWorkbench";
import { ConsoleErrorBoundary } from "@/components/console/ErrorBoundary";
import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import { Button } from "@/components/ui/button";
import { Scale, History } from "lucide-react";

export const metadata: Metadata = {
  title: "Continuous Settlement Daemon | Settler Console",
  description:
    "Autonomous micro-settlement daemon executing continuous matching loops across TigerBeetle and relational ledgers with sub-second finality.",
};

export default function DaemonConsolePage() {
  return (
    <ConsoleErrorBoundary>
      <div className="space-y-6">
        <ConsolePageHeader
          title="Autonomous Continuous Settlement Daemon"
          description="Real-time control plane and telemetry cockpit for the continuous micro-settlement loop, distributed lease management, and circuit breaker health."
          breadcrumbs={[
            { label: "Console", href: "/console" },
            { label: "Control Plane", href: "/console/control-plane" },
            { label: "Settlement Daemon" },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
                <Link href="/console/ledger-parity">
                  <Scale className="w-3.5 h-3.5 text-emerald-400" />
                  Ledger Parity
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
                <Link href="/console/time-travel">
                  <History className="w-3.5 h-3.5 text-cyan-400" />
                  Time-Travel
                </Link>
              </Button>
            </div>
          }
        />
        <AutonomousDaemonWorkbench />
      </div>
    </ConsoleErrorBoundary>
  );
}
