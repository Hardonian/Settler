/**
 * ReconciliationDashboard
 * Main wrapper component for reconciliation workflows
 */

import { ReactNode } from 'react';
import { CompilationProvider, CompilationProviderProps } from '../context';

export interface ReconciliationDashboardProps extends Omit<CompilationProviderProps, 'children'> {
  children: ReactNode;
  className?: string;
}

export function ReconciliationDashboard({
  children,
  mode,
  config,
  className
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
