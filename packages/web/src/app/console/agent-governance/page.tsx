import { Metadata } from "next";
import { AgentGovernanceWorkbench } from "@/components/console/AgentGovernanceWorkbench";
import { ConsoleErrorBoundary } from "@/components/console/ErrorBoundary";

export const metadata: Metadata = {
  title: "AI Agent Governance | Settler Console",
  description:
    "Human-in-the-loop review, mathematical evidence proofs, and cryptographic policy token signing for autonomous agents.",
};

export default function AgentGovernancePage() {
  return (
    <ConsoleErrorBoundary>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            AI Agent Governance & Policy Signoff
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Autonomous background agents are bounded to draft-only job requests. Review mathematical
            proofs, inspect payload diffs, and authorize execution with cryptographically signed
            policy tokens.
          </p>
        </div>
        <AgentGovernanceWorkbench />
      </div>
    </ConsoleErrorBoundary>
  );
}
