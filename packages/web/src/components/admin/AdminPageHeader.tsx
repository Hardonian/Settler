/**
 * AdminPageHeader — Shared admin page header primitive.
 *
 * Wraps the app-level PageHeader with admin-appropriate defaults
 * (no hero gradient — admin surfaces use a more subdued, operational aesthetic).
 * Accepts the same props as PageHeader.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

export interface AdminPageHeaderProps {
  /** Small uppercase eyebrow label above the title */
  eyebrow?: string;
  /** Main page title */
  title: string;
  /** Supplementary description below the title */
  description?: string;
  /** Optional Lucide icon shown alongside the title */
  icon?: LucideIcon;
  /** Action buttons / controls rendered on the right */
  actions?: React.ReactNode;
  /** Additional className applied to the outer wrapper */
  className?: string;
  /** Meta/status info rendered below the description */
  children?: React.ReactNode;
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  actions,
  className,
  children,
}: AdminPageHeaderProps) {
  return (
    <div className={cn("border-b border-border/60 bg-card/30 px-6 py-5 sm:px-8", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 max-w-2xl">
          {eyebrow && (
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
              {eyebrow}
            </p>
          )}
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10"
                aria-hidden="true"
              >
                <Icon className="h-4 w-4 text-primary" />
              </div>
            )}
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {title}
            </h1>
          </div>
          {description && (
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
          )}
          {children && <div className="mt-2">{children}</div>}
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2 shrink-0 pt-1">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
