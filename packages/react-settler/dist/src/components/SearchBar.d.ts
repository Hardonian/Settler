/**
 * SearchBar Component
 * Search functionality for reconciliation data
 */
export interface SearchBarProps {
    onSearch?: (query: string) => void;
    placeholder?: string;
    className?: string;
    debounceMs?: number;
    searchFields?: string[];
}
export declare function SearchBar({ onSearch, placeholder, className, debounceMs, searchFields }: SearchBarProps): import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=SearchBar.d.ts.map