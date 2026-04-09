/**
 * Empty State Components
 *
 * Re-exports from canonical ui/empty-state location.
 */

"use client";

import { FileSearch, AlertCircle, Inbox, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// Re-export canonical EmptyState and RetryButton from ui
export { EmptyState, RetryButton } from "@/components/ui/empty-state";
export type { EmptyStateProps, RetryButtonProps } from "@/components/ui/empty-state";

/**
 * No Results - Generic search with no results
 */
export function NoResultsEmptyState({ searchQuery }: { searchQuery?: string }) {
  return (
    <Card>
      <CardContent className="pt-12 pb-12">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 text-muted-foreground dark:text-muted-foreground">
            <Search className="w-12 h-12" />
          </div>
          <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">
            No results found
          </h3>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground max-w-sm mb-4">
            {searchQuery
              ? `No items match "${searchQuery}". Try adjusting your search or filters.`
              : "No items found matching your criteria."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * No Exceptions - Exception queue is empty
 */
export function NoExceptionsEmptyState() {
  return (
    <Card>
      <CardContent className="pt-12 pb-12">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 text-muted-foreground dark:text-muted-foreground">
            <AlertCircle className="w-12 h-12" />
          </div>
          <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">
            No exceptions
          </h3>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground max-w-sm mb-4">
            The exception queue is empty. Exceptions appear here when mismatches are flagged for
            review.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * No Runs - No reconciliation runs yet
 */
export function NoRunsEmptyState() {
  return (
    <Card>
      <CardContent className="pt-12 pb-12">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 text-muted-foreground dark:text-muted-foreground">
            <FileSearch className="w-12 h-12" />
          </div>
          <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">
            No runs yet
          </h3>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground max-w-sm mb-4">
            No reconciliation runs recorded. Trigger a run via the API or CLI to get started.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * No Audit - No audit trail entries
 */
export function NoAuditEmptyState() {
  return (
    <Card>
      <CardContent className="pt-12 pb-12">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 text-muted-foreground dark:text-muted-foreground">
            <Inbox className="w-12 h-12" />
          </div>
          <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">
            No audit entries
          </h3>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground max-w-sm mb-4">
            No audit trail entries found for the selected filters.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
