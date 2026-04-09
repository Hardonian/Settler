/**
 * MobileDashboard Component
 * Mobile-optimized reconciliation dashboard
 */
import type { ReconciliationTransaction, ReconciliationException } from "@settler/protocol";
export interface MobileDashboardProps {
    transactions: ReconciliationTransaction[];
    exceptions: ReconciliationException[];
    onTransactionSelect?: (tx: ReconciliationTransaction) => void;
    onExceptionResolve?: (exc: ReconciliationException) => void;
    className?: string;
}
/**
 * Mobile-optimized dashboard with responsive design
 */
export declare function MobileDashboard({ transactions, exceptions, onTransactionSelect, onExceptionResolve, className, }: MobileDashboardProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=MobileDashboard.d.ts.map