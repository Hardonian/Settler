/**
 * SearchBar Component
 * Search functionality for reconciliation data
 */

import React, { useState, useCallback } from 'react';
import { useCompilationContext } from '../context';
import { useTelemetry } from '../hooks/useTelemetry';

export interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
  searchFields?: string[];
}

export function SearchBar({
  onSearch,
  placeholder = 'Search transactions...',
  className,
  debounceMs = 300,
  searchFields = ['id', 'providerTransactionId', 'referenceId']
}: SearchBarProps) {
  const context = useCompilationContext();
  const { track } = useTelemetry('SearchBar');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  React.useEffect(() => {
    if (debouncedQuery !== query) {
      track('search.executed', { query: debouncedQuery, length: debouncedQuery.length });
      onSearch?.(debouncedQuery);
    }
  }, [debouncedQuery, onSearch, track]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    track('search.changed', { query: value });
  }, [track]);

  const handleClear = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    track('search.cleared');
    onSearch?.('');
  }, [onSearch, track]);

  // In config mode, register widget
  if (context.mode === 'config') {
    if (!context.config.widgets) {
      context.config.widgets = {};
    }
    context.config.widgets['search-bar'] = {
      id: 'search-bar',
      type: 'filter-bar', // Reuse filter-bar type
      props: {
        placeholder,
        debounceMs,
        searchFields
      }
    };
    return null;
  }

  // UI mode
  return (
    <div className={className} data-widget="search-bar" style={{ position: 'relative' }}>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '0.75rem 2.5rem 0.75rem 1rem',
          borderRadius: '8px',
          border: '1px solid #d1d5db',
          fontSize: '1rem'
        }}
      />
      {query && (
        <button
          onClick={handleClear}
          style={{
            position: 'absolute',
            right: '0.5rem',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.25rem',
            color: '#6b7280'
          }}
          aria-label="Clear search"
        >
          ×
        </button>
      )}
    </div>
  );
}
