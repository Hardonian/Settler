/**
 * StatCard Component
 *
 * Reusable KPI / metric card for dashboards and summary strips.
 * Renders a labeled numeric value with optional trend, icon, description,
 * and call-to-action link.
 *
 * Usage:
 *   <StatCard label="Matched rows" value="1,204" tone="success" />
 *   <StatCard label="API Calls" value="12.4K" description="Last 7 days" href="/console/usage" linkLabel="View details" />
 */

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "./card";

export interface StatCardProps {
  /** Short uppercase label above the value */
  label: string;
  /** The primary metric value (already formatted) */
  value: string | number;
  /** Optional supporting text below the value */
  description?: string;
  /** Semantic color tone */
  tone?: "default" | "success" | "warning" | "danger" | "info";
  /** Optional icon rendered beside the label */
  icon?: LucideIcon;
  /** Optional link destination */
  href?: string;
  /** Link label text (defaults to "View details") */
  linkLabel?: string;
  /** Additional className on the root card */
  className?: string;
}

const toneClasses: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "text-foreground",
  success: "text-green-600 dark:text-green-400",
  warning: "text-amber-600 dark:text-amber-400",
  danger: "text-red-600 dark:text-red-400",
  info: "text-blue-600 dark:text-blue-400",
};

export function StatCard({
  label,
  value,
  description,
  tone = "default",
  icon: Icon,
  href,
  linkLabel = "View details",
  className,
}: StatCardProps) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="pb-1 pt-5 px-5">
        <div className="flex items-center gap-1.5">
          {Icon && (
            <Icon
              className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0"
              aria-hidden="true"
            />
          )}
          <span className="label-muted">{label}</span>
        </div>
        <div className={cn("text-3xl font-bold tracking-tight tabular-nums mt-1", toneClasses[tone])}>
          {value}
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 space-y-3">
        {description && (
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        )}
        {href && (
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
          >
            {linkLabel}
            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
