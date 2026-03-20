/**
 * PageHeader — Standardized app page header
 *
 * Provides consistent visual hierarchy across all operational pages:
 * - Optional eyebrow label
 * - Page title (h1)
 * - Optional description
 * - Optional action buttons in a right-aligned slot
 * - Optional breadcrumb / back link
 *
 * Usage:
 *   <PageHeader
 *     eyebrow="Execution Ledger"
 *     title="Reconciliation Runs"
 *     description="A complete history of all reconciliation jobs executed within your tenant."
 *     actions={<Button>New Run</Button>}
 *   />
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  /** Short uppercase category label above the title */
  eyebrow?: string;
  /** Main page heading */
  title: string;
  /** Supporting description below the title */
  description?: string;
  /** Action buttons rendered right-aligned on desktop, stacked below on mobile */
  actions?: React.ReactNode;
  /** Extra content below description (e.g. alert banners, quick-filters) */
  children?: React.ReactNode;
  /** Additional className */
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("pb-2", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary/70">
              {eyebrow}
            </p>
          )}
          <h1 className="text-3xl font-bold tracking-tight text-foreground leading-tight">
            {title}
          </h1>
          {description && (
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>

      {children && <div className="mt-4">{children}</div>}
    </header>
  );
}
