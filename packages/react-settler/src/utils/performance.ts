/**
 * Performance Utilities
 * Optimizations for reconciliation components
 */

import { useMemo, useState, useEffect } from 'react';
import {
  ReconciliationTransaction
} from '@settler/protocol';

/**
 * Memoized filter function
 */
export function useFilteredTransactions(
  transactions: ReconciliationTransaction[],
  filters: {
    provider?: string[];
    status?: string[];
    dateRange?: { start?: string; end?: string };
    amountRange?: { min?: number; max?: number };
    search?: string;
  }
) {
  return useMemo(() => {
    return transactions.filter(tx => {
      // Provider filter
      if (filters.provider && filters.provider.length > 0) {
        if (!filters.provider.includes(tx.provider)) {
          return false;
        }
      }

      // Status filter
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(tx.status)) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateRange) {
        const txDate = new Date(tx.date);
        if (filters.dateRange.start && txDate < new Date(filters.dateRange.start)) {
          return false;
        }
        if (filters.dateRange.end && txDate > new Date(filters.dateRange.end)) {
          return false;
        }
      }

      // Amount range filter
      if (filters.amountRange) {
        if (filters.amountRange.min !== undefined && tx.amount.value < filters.amountRange.min) {
          return false;
        }
        if (filters.amountRange.max !== undefined && tx.amount.value > filters.amountRange.max) {
          return false;
        }
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const searchableText = [
          tx.id,
          tx.providerTransactionId,
          tx.referenceId,
          tx.provider,
          tx.status
        ].filter(Boolean).join(' ').toLowerCase();

        if (!searchableText.includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, filters]);
}

/**
 * Memoized sort function
 */
export function useSortedTransactions(
  transactions: ReconciliationTransaction[],
  sortBy?: keyof ReconciliationTransaction,
  sortOrder: 'asc' | 'desc' = 'asc'
) {
  return useMemo(() => {
    if (!sortBy) {
      return transactions;
    }

    const sorted = [...transactions].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];

      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });

    return sorted;
  }, [transactions, sortBy, sortOrder]);
}

/**
 * Debounce hook
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
