/**
 * Shared Empty State Components
 * 
 * Consistent empty states across the application.
 * Re-exports from canonical ui/empty-state location.
 */

'use client';

// Re-export canonical EmptyState and RetryButton from ui
export { EmptyState, RetryButton } from '@/components/ui/empty-state';
export type { EmptyStateProps, RetryButtonProps } from '@/components/ui/empty-state';

import { Inbox, Search, AlertCircle } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

export function NoResultsEmptyState({ 
  searchQuery,
  entityName = 'items'
}: { 
  searchQuery?: string;
  entityName?: string;
}) {
  return (
    <EmptyState
      icon={<Search className="w-12 h-12" />}
      title="No results found"
      description={
        searchQuery
          ? `No ${entityName} match "${searchQuery}". Try adjusting your search or filters.`
          : `No ${entityName} found matching your criteria.`
      }
    />
  );
}

export function NoDataEmptyState({ 
  entityName,
  actionLabel,
  actionHref
}: { 
  entityName: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <EmptyState
      icon={<Inbox className="w-12 h-12" />}
      title={`No ${entityName} yet`}
      description={`Get started by creating your first ${entityName.toLowerCase()}.`}
      action={actionLabel && actionHref ? {
        label: actionLabel,
        onClick: () => {},
        href: actionHref,
      } : undefined}
    />
  );
}

export function ErrorEmptyState({ 
  message,
  onRetry
}: { 
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      icon={<AlertCircle className="w-12 h-12 text-red-500" />}
      title="Unable to load data"
      description={message || 'An error occurred while loading. Please try again.'}
      action={onRetry ? {
        label: 'Try Again',
        onClick: onRetry,
      } : undefined}
    />
  );
}
