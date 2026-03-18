/**
 * FilterBar Component
 * Advanced filtering for reconciliation data
 */
export interface FilterBarProps {
    onFilterChange?: (filters: FilterState) => void;
    className?: string;
    showProviderFilter?: boolean;
    showStatusFilter?: boolean;
    showDateRangeFilter?: boolean;
    showAmountRangeFilter?: boolean;
}
export interface FilterState {
    provider?: string[] | undefined;
    status?: string[] | undefined;
    dateRange?: {
        start?: string | undefined;
        end?: string | undefined;
    } | undefined;
    amountRange?: {
        min?: number | undefined;
        max?: number | undefined;
    } | undefined;
    search?: string | undefined;
}
export declare function FilterBar({ onFilterChange, className, showProviderFilter, showStatusFilter, showDateRangeFilter, showAmountRangeFilter }: FilterBarProps): import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=FilterBar.d.ts.map