/**
 * ReconciliationDashboard
 * Main wrapper component for reconciliation workflows
 */
import { ReactNode } from 'react';
import { CompilationMode, ReconciliationConfig } from '@settler/protocol';
export interface ReconciliationDashboardProps {
    children: ReactNode;
    mode?: CompilationMode;
    config?: Partial<ReconciliationConfig>;
    className?: string;
}
export declare function ReconciliationDashboard({ children, mode, config, className }: ReconciliationDashboardProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ReconciliationDashboard.d.ts.map