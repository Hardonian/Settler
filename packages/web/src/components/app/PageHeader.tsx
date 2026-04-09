/**
 * PageHeader — Shared operator app page header primitive.
 *
 * Handles eyebrow / title / description / actions in a consistent
 * layout across all /app/* pages. Supports an optional decorative
 * background icon, an optional hero variant with gradient backdrop,
 * and slot for action buttons on the right.
 *
 * Usage:
 *   <PageHeader
 *     eyebrow="Operator Intelligence"
 *     title="Live Alerts"
 *     description="Monitor infrastructure-level drift and reconciliation failures."
 *     icon={Bell}
 *     actions={<Button>New Run</Button>}
 *   />
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

export interface PageHeaderProps {
  /** Small uppercase eyebrow label above the title */
  eyebrow?: string;
  /** Main page title */
  title: string;
  /** Supplementary description below the title */
  description?: string;
  /** Optional Lucide icon — renders large and decorative in the background */
  icon?: LucideIcon;
  /** Action buttons / controls rendered on the right (desktop) or below description (mobile) */
  actions?: React.ReactNode;
  /** Visual variant — 'default' is a plain header, 'hero' adds gradient backdrop */
  variant?: "default" | "hero";
  /** Additional className applied to the outer wrapper */
  className?: string;
  /** Additional content rendered below the description */
  children?: React.ReactNode;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  actions,
  variant = "default",
  className,
  children,
}: PageHeaderProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden",
        variant === "hero"
          ? "rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 via-background to-background p-6 sm:p-8 shadow-sm"
          : "pb-6",
        className
      )}
    >
      {/* Decorative background icon */}
      {Icon && variant === "hero" && (
        <div
          className="pointer-events-none absolute -right-10 -top-10 opacity-[0.03] select-none"
          aria-hidden="true"
        >
          <Icon size={280} className="text-primary" />
        </div>
      )}

      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Text block */}
        <div className="max-w-3xl min-w-0">
          {eyebrow && (
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary/70">
              {eyebrow}
            </p>
          )}
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h1>
          {description && (
            <p className="mt-3 max-w-2xl text-base text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
          {children && <div className="mt-3">{children}</div>}
        </div>

        {/* Actions */}
        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </section>
  );
}
