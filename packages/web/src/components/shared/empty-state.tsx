/**
 * Shared Empty State Components
 * 
 * Consistent empty states across the application.
 */

'use client';

import { Inbox, Search, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    href?: string;
  };
  className?: string;
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action,
  className 
}: EmptyStateProps) {
  const actionContent = action?.href ? (
    <Button asChild size="sm">
      <a href={action.href}>{action.label}</a>
    </Button>
  ) : action ? (
    <Button onClick={action.onClick} size="sm">
      {action.label}
    </Button>
  ) : null;

  return (
    <Card className={className}>
      <CardContent className="pt-12 pb-12">
        <div className="flex flex-col items-center text-center">
          {icon && (
            <div className="mb-4 text-slate-400 dark:text-slate-500" aria-hidden="true">
              {icon}
            </div>
          )}
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            {title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-4">
            {description}
          </p>
          {actionContent}
        </div>
      </CardContent>
    </Card>
  );
}

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
