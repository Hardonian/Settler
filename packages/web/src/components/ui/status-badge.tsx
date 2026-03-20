/**
 * StatusBadge Component
 *
 * Semantic status badge with optional icon for run/entity lifecycle states.
 * Provides consistent status rendering across all operational pages.
 *
 * Usage:
 *   <StatusBadge status="completed" />
 *   <StatusBadge status="running" label="In progress" />
 *   <StatusBadge status="failed" size="lg" />
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  Pause,
  MinusCircle,
  type LucideIcon,
} from "lucide-react";

export type StatusType =
  | "completed"
  | "success"
  | "healthy"
  | "running"
  | "processing"
  | "in_progress"
  | "pending"
  | "queued"
  | "draft"
  | "failed"
  | "error"
  | "danger"
  | "warning"
  | "degraded"
  | "review_needed"
  | "paused"
  | "disabled"
  | "unknown"
  | "neutral";

export interface StatusBadgeProps {
  /** Semantic status type */
  status: StatusType;
  /** Override the default label */
  label?: string;
  /** Size variant */
  size?: "sm" | "default" | "lg";
  /** Show the status icon */
  showIcon?: boolean;
  /** Additional className */
  className?: string;
}

interface StatusConfig {
  label: string;
  icon: LucideIcon;
  classes: string;
  iconClasses?: string;
}

const statusMap: Record<StatusType, StatusConfig> = {
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    classes: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  },
  success: {
    label: "Success",
    icon: CheckCircle2,
    classes: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  },
  healthy: {
    label: "Healthy",
    icon: CheckCircle2,
    classes: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  },
  running: {
    label: "Running",
    icon: Loader2,
    classes: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    iconClasses: "animate-spin",
  },
  processing: {
    label: "Processing",
    icon: Loader2,
    classes: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    iconClasses: "animate-spin",
  },
  in_progress: {
    label: "In Progress",
    icon: Loader2,
    classes: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    iconClasses: "animate-spin",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    classes: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  },
  queued: {
    label: "Queued",
    icon: Clock,
    classes: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  },
  draft: {
    label: "Draft",
    icon: MinusCircle,
    classes: "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    classes: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  },
  error: {
    label: "Error",
    icon: XCircle,
    classes: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  },
  danger: {
    label: "Critical",
    icon: XCircle,
    classes: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  },
  warning: {
    label: "Warning",
    icon: AlertTriangle,
    classes: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  },
  degraded: {
    label: "Degraded",
    icon: AlertTriangle,
    classes: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  },
  review_needed: {
    label: "Review Needed",
    icon: AlertTriangle,
    classes: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  },
  paused: {
    label: "Paused",
    icon: Pause,
    classes: "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20",
  },
  disabled: {
    label: "Disabled",
    icon: MinusCircle,
    classes: "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20",
  },
  unknown: {
    label: "Unknown",
    icon: MinusCircle,
    classes: "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20",
  },
  neutral: {
    label: "Neutral",
    icon: MinusCircle,
    classes: "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20",
  },
};

const sizeClasses = {
  sm: "px-1.5 py-0.5 text-[11px] gap-1",
  default: "px-2 py-0.5 text-xs gap-1.5",
  lg: "px-2.5 py-1 text-sm gap-1.5",
};

const iconSizeClasses = {
  sm: "w-3 h-3",
  default: "w-3.5 h-3.5",
  lg: "w-4 h-4",
};

export function StatusBadge({
  status,
  label,
  size = "default",
  showIcon = true,
  className,
}: StatusBadgeProps) {
  const config = statusMap[status] ?? statusMap.unknown;
  const Icon = config.icon;
  const displayLabel = label ?? config.label;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium leading-none whitespace-nowrap",
        config.classes,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && (
        <Icon
          className={cn(iconSizeClasses[size], "flex-shrink-0", config.iconClasses)}
          aria-hidden="true"
        />
      )}
      {displayLabel}
    </span>
  );
}
