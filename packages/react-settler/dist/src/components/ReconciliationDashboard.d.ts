/**
 * ReconciliationDashboard
 * Main wrapper component for reconciliation workflows
 */
import { ReactNode } from 'react';
import { CompilationProviderProps } from '../context';
export interface ReconciliationDashboardProps extends Omit<CompilationProviderProps, 'children'> {
    children: ReactNode;
    className?: string;
}
export declare function ReconciliationDashboard({ children, mode, config, className }: ReconciliationDashboardProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ReconciliationDashboard.d.ts.map