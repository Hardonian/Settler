/**
 * DataTable — Reusable dense data table system
 *
 * Provides consistent search, pagination, loading, empty, and error states
 * across all operational list views. Designed to be incremental — adopt column
 * defs and let the shell handle boilerplate.
 *
 * Usage:
 *   <DataTable
 *     columns={columns}
 *     data={rows}
 *     isLoading={false}
 *     emptyState={{ title: "No runs yet", description: "..." }}
 *     searchPlaceholder="Search run ID..."
 *     pagination={{ page, pageSize, total, onPageChange }}
 *   />
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Search, ChevronLeft, ChevronRight, AlertCircle, Inbox } from "lucide-react";
import { Button } from "./button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";
import { Card, CardContent, CardHeader } from "./card";

// ─── Column Definition ────────────────────────────────────────────────────────

export interface DataTableColumn<TRow> {
  /** Unique key for this column */
  key: string;
  /** Column header label */
  header: string;
  /** Render the cell content from a row */
  cell: (row: TRow) => React.ReactNode;
  /** Optional header className */
  headerClassName?: string;
  /** Optional cell className */
  cellClassName?: string;
  /** Whether this column is sortable (UI hint only — parent handles sort logic) */
  sortable?: boolean;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface DataTablePagination {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

// ─── Empty State ──────────────────────────────────────────────────────────────

export interface DataTableEmptyState {
  title: string;
  description: string;
  /** Optional action button */
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

// ─── DataTable Props ──────────────────────────────────────────────────────────

export interface DataTableProps<TRow> {
  /** Column definitions */
  columns: DataTableColumn<TRow>[];
  /** Row data */
  data: TRow[];
  /** Key extractor for rows */
  getRowKey?: (row: TRow, index: number) => string | number;
  /** Whether data is loading */
  isLoading?: boolean;
  /** Error state message — shown instead of empty state on failure */
  error?: string | null;
  /** Empty state shown when data is empty and not loading */
  emptyState?: DataTableEmptyState;
  /** Controlled search value */
  searchValue?: string;
  /** Called when search input changes */
  onSearchChange?: (value: string) => void;
  /** Placeholder text for the search box */
  searchPlaceholder?: string;
  /** Pagination config — omit to hide pagination */
  pagination?: DataTablePagination;
  /** Optional toolbar slot rendered beside the search box */
  toolbar?: React.ReactNode;
  /** Optional title shown in the table header */
  title?: string;
  /** Optional description below the title */
  description?: string;
  /** Make rows clickable */
  onRowClick?: (row: TRow) => void;
  /** Additional className on the outer wrapper */
  className?: string;
  /** Show row count summary */
  showCount?: boolean;
}

// ─── Internal: Skeleton rows ─────────────────────────────────────────────────

function SkeletonRows({ columns, count = 5 }: { columns: number; count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <TableRow key={i} className="border-b border-border/20">
          {Array.from({ length: columns }).map((_, j) => (
            <TableCell key={j} className="px-3 py-2.5">
              <div
                className={cn(
                  "h-3.5 rounded-md bg-gradient-to-r from-muted/80 via-primary/10 to-muted/80 bg-[length:200%_100%] animate-shimmer motion-reduce:animate-none",
                  j === 0 ? "w-24" : j === columns - 1 ? "w-12 ml-auto" : "w-full max-w-[180px]"
                )}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

// ─── Internal: Empty row ─────────────────────────────────────────────────────

function EmptyRow({ columns, state }: { columns: number; state?: DataTableEmptyState }) {
  return (
    <TableRow>
      <TableCell colSpan={columns} className="h-56">
        <div className="flex flex-col items-center justify-center gap-3 text-center py-6">
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
            <Inbox className="h-7 w-7 text-muted-foreground/50" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{state?.title ?? "No data"}</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-xs leading-relaxed">
              {state?.description ?? "Nothing to display here yet."}
            </p>
          </div>
          {state?.action && (
            <Button
              variant="outline"
              size="sm"
              className="mt-1"
              onClick={state.action.onClick}
              asChild={!!state.action.href}
            >
              {state.action.href ? (
                <a href={state.action.href}>{state.action.label}</a>
              ) : (
                state.action.label
              )}
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

// ─── Internal: Error row ──────────────────────────────────────────────────────

function ErrorRow({ columns, message }: { columns: number; message: string }) {
  return (
    <TableRow>
      <TableCell colSpan={columns} className="h-40">
        <div className="flex flex-col items-center justify-center gap-2 text-center py-6">
          <AlertCircle className="h-6 w-6 text-destructive/70" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground">Something went wrong</p>
          <p className="text-xs text-muted-foreground max-w-xs">{message}</p>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ─── DataTable ────────────────────────────────────────────────────────────────

export function DataTable<TRow>({
  columns,
  data,
  getRowKey,
  isLoading = false,
  error = null,
  emptyState,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search…",
  pagination,
  toolbar,
  title,
  description,
  onRowClick,
  className,
  showCount = true,
}: DataTableProps<TRow>) {
  const hasSearch = onSearchChange !== undefined;
  const hasToolbar = hasSearch || toolbar;
  const showPagination = !!pagination;
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 0;

  return (
    <Card className={cn("overflow-hidden border-border/60 shadow-sm", className)}>
      {/* Card header — title + toolbar */}
      {(title || hasToolbar) && (
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Title + description */}
            {title && (
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-foreground leading-tight">{title}</h3>
                {description && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
                )}
              </div>
            )}

            {/* Toolbar: search + custom slot */}
            {hasToolbar && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                {hasSearch && (
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      type="search"
                      value={searchValue}
                      onChange={(e) => onSearchChange?.(e.target.value)}
                      placeholder={searchPlaceholder}
                      aria-label={searchPlaceholder}
                      className={cn(
                        "h-9 w-full sm:w-60 pl-9 pr-3 rounded-[var(--ui-radius-md)]",
                        "border border-border bg-background text-sm text-foreground",
                        "placeholder:text-muted-foreground",
                        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background",
                        "transition-colors duration-100"
                      )}
                    />
                  </div>
                )}
                {toolbar}
              </div>
            )}
          </div>
        </CardHeader>
      )}

      {/* Table */}
      <CardContent className="p-0">
        <Table stickyScroll>
          <TableHeader sticky>
            <TableRow className="border-b border-border/40 bg-muted/25 hover:bg-muted/25">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn("h-9 py-2 text-[11px] font-semibold", col.headerClassName)}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <SkeletonRows columns={columns.length} count={5} />
            ) : error ? (
              <ErrorRow columns={columns.length} message={error} />
            ) : data.length === 0 ? (
              <EmptyRow columns={columns.length} state={emptyState} />
            ) : (
              data.map((row, index) => (
                <TableRow
                  key={getRowKey ? getRowKey(row, index) : index}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "border-b border-border/20 last:border-0 transition-colors",
                    onRowClick && "cursor-pointer hover:bg-muted/50"
                  )}
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={cn("py-2.5 text-[13px] leading-snug", col.cellClassName)}
                    >
                      {col.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* Footer: count + pagination */}
      {(showCount || showPagination) && !isLoading && !error && data.length > 0 && (
        <div className="border-t border-border/40 px-4 py-3 flex items-center justify-between gap-4">
          {showCount && pagination ? (
            <p className="text-xs text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">
                {(pagination.page - 1) * pagination.pageSize + 1}–
                {Math.min(pagination.page * pagination.pageSize, pagination.total)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">
                {pagination.total.toLocaleString()}
              </span>
            </p>
          ) : showCount ? (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{data.length}</span> row
              {data.length !== 1 ? "s" : ""}
            </p>
          ) : (
            <span />
          )}

          {showPagination && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => pagination?.onPageChange(pagination.page - 1)}
                disabled={pagination?.page <= 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="px-2 text-xs text-muted-foreground">
                {pagination?.page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => pagination?.onPageChange(pagination.page + 1)}
                disabled={pagination ? pagination.page >= totalPages : true}
                aria-label="Next page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
