/**
 * Empty State Components
 * 
 * Consistent empty states for admin dashboard.
 */

'use client';

import { FileSearch, AlertCircle, Inbox, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
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
  return (
    <Card className={className}>
      <CardContent className="pt-12 pb-12">
        <div className="flex flex-col items-center text-center">
          {icon && (
            <div className="mb-4 text-slate-400 dark:text-slate-500">
              {icon}
            </div>
          )}
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            {title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-4">
            {description}
          </p>
          {action && (
            <Button onClick={action.onClick} size="sm">
              {action.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function NoResultsEmptyState({ searchQuery }: { searchQuery?: string }) {
  return (
    <EmptyState
      icon={<Search className="w-12 h-12" />}
      title="No results found"
      description={
        searchQuery
          ? `No items match "${searchQuery}". Try adjusting your search or filters.`
          : 'No items found matching your criteria.'
      }
    />
  );
}

export function NoExceptionsEmptyState() {
  return (
    <EmptyState
      icon={<AlertCircle className="w-12 h-12" />}
      title="No exceptions"
      description="The exception queue is empty. Exceptions appear here when mismatches are flagged for review."
    />
  );
}

export function NoRunsEmptyState() {
  return (
    <EmptyState
      icon={<FileSearch className="w-12 h-12" />}
      title="No runs yet"
      description="No reconciliation runs recorded. Trigger a run via the API or CLI to get started."
    />
  );
}

export function NoAuditEmptyState() {
  return (
    <EmptyState
      icon={<Inbox className="w-12 h-12" />}
      title="No audit entries"
      description="No audit trail entries found for the selected filters."
    />
  );
}
