/**
 * DataLoader Component
 *
 * Reusable component for handling loading, error, and empty states
 * when fetching data with React Query.
 */

"use client";

import { ReactNode } from "react";
import { Loader2, AlertCircle, Inbox } from "lucide-react";

export interface DataLoaderProps<T> {
  /**
   * Query result from React Query hook
   */
  query: {
    data?: T;
    isLoading: boolean;
    isError: boolean;
    error?: Error | null;
    isFetching?: boolean;
  };
  /**
   * Render function for the data
   */
  children: (data: T) => ReactNode;
  /**
   * Custom loading component
   */
  loadingComponent?: ReactNode;
  /**
   * Custom error component
   */
  errorComponent?: (error: Error) => ReactNode;
  /**
   * Custom empty state component
   */
  emptyComponent?: ReactNode;
  /**
   * Function to check if data is empty
   */
  isEmpty?: (data: T) => boolean;
  /**
   * Show loading state even when data exists (for refetching)
   */
  showRefetching?: boolean;
}

export function DataLoader<T>({
  query,
  children,
  loadingComponent,
  errorComponent,
  emptyComponent,
  isEmpty,
  showRefetching = false,
}: DataLoaderProps<T>) {
  const { data, isLoading, isError, error, isFetching } = query;

  // Loading state
  if (isLoading || (showRefetching && isFetching && !data)) {
    return (
      loadingComponent || (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-electric-cyan mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      )
    );
  }

  // Error state
  if (isError) {
    return (
      errorComponent?.(error as Error) || (
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400 mb-4" />
          <p className="text-red-600 dark:text-red-400 font-semibold mb-2">Error loading data</p>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            {error instanceof Error ? error.message : "An unexpected error occurred"}
          </p>
        </div>
      )
    );
  }

  // Empty state
  if (data !== undefined && isEmpty && isEmpty(data)) {
    return (
      emptyComponent || (
        <div className="flex flex-col items-center justify-center py-12">
          <Inbox className="w-8 h-8 text-slate-400 dark:text-slate-500 mb-4" />
          <p className="text-slate-600 dark:text-slate-400">No data available</p>
        </div>
      )
    );
  }

  // Success state - render children with data
  if (data !== undefined) {
    return (
      <>
        {showRefetching && isFetching && (
          <div className="absolute top-4 right-4">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-electric-cyan" />
          </div>
        )}
        {children(data)}
      </>
    );
  }

  // Fallback (shouldn't happen)
  return null;
}
