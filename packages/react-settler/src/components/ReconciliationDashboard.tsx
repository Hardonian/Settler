/**
 * ReconciliationDashboard
 * Main wrapper component for reconciliation workflows
 */

import { ReactNode } from "react";
import { CompilationProvider } from "../context";
import { CompilationMode, ReconciliationConfig } from "@settler/protocol";

export interface ReconciliationDashboardProps {
  children: ReactNode;
  mode?: CompilationMode;
  config?: Partial<ReconciliationConfig>;
  className?: string;
}

export function ReconciliationDashboard({
  children,
  mode,
  config,
  className,
}: ReconciliationDashboardProps) {
  return (
    <CompilationProvider
      {...(mode !== undefined ? { mode } : {})}
      {...(config !== undefined ? { config } : {})}
    >
      <div className={className} data-reconciliation-dashboard>
        {children}
      </div>
    </CompilationProvider>
  );
}
