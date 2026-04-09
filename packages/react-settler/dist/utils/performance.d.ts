/**
 * Performance Utilities
 * Optimizations for reconciliation components
 */
import { ReconciliationTransaction } from "@settler/protocol";
/**
 * Memoized filter function
 */
export declare function useFilteredTransactions(transactions: ReconciliationTransaction[], filters: {
    provider?: string[];
    status?: string[];
    dateRange?: {
        start?: string;
        end?: string;
    };
    amountRange?: {
        min?: number;
        max?: number;
    };
    search?: string;
}): ReconciliationTransaction[];
/**
 * Memoized sort function
 */
export declare function useSortedTransactions(transactions: ReconciliationTransaction[], sortBy?: keyof ReconciliationTransaction, sortOrder?: "asc" | "desc"): ReconciliationTransaction[];
/**
 * Debounce hook
 */
export declare function useDebounce<T>(value: T, delay: number): T;
//# sourceMappingURL=performance.d.ts.map