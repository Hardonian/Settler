import type { ReconciliationTransaction, ReconciliationException } from "@settler/protocol";
export interface StripeAppProps {
    accountId: string;
    transactions?: ReconciliationTransaction[];
    exceptions?: ReconciliationException[];
    onExport?: (format: string, data: unknown[]) => void;
}
/**
 * Stripe Connect App Wrapper
 * Optimized for Stripe dashboard integration
 */
export declare function StripeApp({ accountId, transactions, exceptions, onExport, }: StripeAppProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=stripe.d.ts.map