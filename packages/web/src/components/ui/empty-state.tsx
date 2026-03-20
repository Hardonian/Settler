/**
 * Empty State Component
 *
 * Displays an empty state with optional actions (click or link).
 * Used for empty lists, no results, filtered-out data, and first-time-user prompts.
 */

"use client";

import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { Button } from "./button";
import { AlertCircle, RefreshCw } from "lucide-react";

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: "default" | "outline" | "ghost";
}

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  /** Concise hint about what will appear here once the system is active */
  hint?: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
}

function EmptyStateButton({ label, onClick, href, variant = "default" }: EmptyStateAction) {
  if (href) {
    return (
      <Button asChild variant={variant} className="min-w-[120px]">
        <Link href={href}>{label}</Link>
      </Button>
    );
  }
  return (
    <Button onClick={onClick} variant={variant} className="min-w-[120px]">
      {label}
    </Button>
  );
}

export function EmptyState({
  icon: Icon = AlertCircle,
  title,
  description,
  hint,
  action,
  secondaryAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-12 text-center ${className}`}
      role="status"
    >
      <div className="mb-4 rounded-2xl bg-muted/20 border border-border/60 p-5">
        <Icon className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>

      <p className="text-sm text-muted-foreground mb-1 max-w-md leading-relaxed">{description}</p>

      {hint && (
        <p className="text-xs text-muted-foreground/70 mb-6 max-w-sm leading-relaxed">{hint}</p>
      )}

      {!hint && <div className="mb-6" />}

      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {action && <EmptyStateButton {...action} />}
          {secondaryAction && <EmptyStateButton variant="outline" {...secondaryAction} />}
        </div>
      )}
    </div>
  );
}

/**
 * Retry Button Component
 * Standardized retry button with loading state
 */
export interface RetryButtonProps {
  onRetry: () => void;
  isLoading?: boolean;
  label?: string;
}

export function RetryButton({ onRetry, isLoading = false, label = 'Try again' }: RetryButtonProps) {
  return (
    <Button
      onClick={onRetry}
      disabled={isLoading}
      variant="outline"
      className="min-w-[120px]"
    >
      {isLoading ? (
        <>
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          Retrying...
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          {label}
        </>
      )}
    </Button>
  );
}
