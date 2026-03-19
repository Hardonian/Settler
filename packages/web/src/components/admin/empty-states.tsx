/**
 * Empty State Components
 * 
 * Re-exports from canonical ui/empty-state location.
 */

'use client';

// Re-export canonical EmptyState and RetryButton from ui
export { EmptyState, RetryButton } from '@/components/ui/empty-state';
export type { EmptyStateProps, RetryButtonProps } from '@/components/ui/empty-state';

// Specialized admin empty states - re-export for convenience
export { NoResultsEmptyState } from '@/components/shared/empty-state';
export { NoExceptionsEmptyState } from './NoExceptionsEmptyState';
export { NoRunsEmptyState } from './NoRunsEmptyState';
export { NoAuditEmptyState } from './NoAuditEmptyState';
