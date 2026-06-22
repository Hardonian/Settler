/**
 * SearchBar Component
 * Search functionality for reconciliation data
 */
import React from "react";
export interface SearchBarProps {
    onSearch?: (query: string) => void;
    placeholder?: string;
    className?: string;
    debounceMs?: number;
    searchFields?: string[];
}
export declare function SearchBar({ onSearch, placeholder, className, debounceMs, searchFields, }: SearchBarProps): React.JSX.Element | null;
//# sourceMappingURL=SearchBar.d.ts.map