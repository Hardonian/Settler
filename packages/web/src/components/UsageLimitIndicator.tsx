"use client";

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AlertCircle, Zap } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface UsageLimitIndicatorProps {
  current: number;
  limit: number | "unlimited";
  type: "reconciliations" | "playground_runs" | "cookbooks";
  userPlan?: "free" | "trial" | "commercial" | "enterprise";
  period?: "day" | "month";
  className?: string;
}

export function UsageLimitIndicator({
  current,
  limit,
  type,
  userPlan = "free",
  period = "month",
  className,
}: UsageLimitIndicatorProps) {
  // Don't show for unlimited or paid users
  if (limit === "unlimited" || userPlan === "commercial" || userPlan === "enterprise") {
    return null;
  }

  const percentage = (current / limit) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  const getTypeLabel = () => {
    switch (type) {
      case "reconciliations":
        return "reconciliations";
      case "playground_runs":
        return "playground runs";
      case "cookbooks":
        return "cookbooks";
      default:
        return "items";
    }
  };

  const getPeriodLabel = () => {
    return period === "day" ? "today" : "this month";
  };

  if (isAtLimit) {
    return (
      <div
        className={cn(
          "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4",
          className
        )}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <div>
              <p className="font-semibold text-red-900 dark:text-red-300">Usage Limit Reached</p>
              <p className="text-sm text-red-700 dark:text-red-400">
                You&apos;ve used all {limit} {getTypeLabel()} {getPeriodLabel()}
              </p>
            </div>
          </div>
          <Button asChild size="sm" className="bg-red-600 hover:bg-red-700">
            <Link href="/pricing">Upgrade for Unlimited</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isNearLimit) {
    return (
      <div
        className={cn(
          "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4",
          className
        )}
      >
        <div className="flex items-center justify-between flex-wrap gap-4 mb-3">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-300">Approaching Limit</p>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                {current} of {limit} {getTypeLabel()} used {getPeriodLabel()}
              </p>
            </div>
          </div>
        </div>
        <Progress value={percentage} className="mb-3" />
        <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
          <Link href="/pricing">Upgrade for Unlimited</Link>
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3",
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {getTypeLabel().charAt(0).toUpperCase() + getTypeLabel().slice(1)} {getPeriodLabel()}
        </span>
        <span className="text-sm font-semibold text-slate-900 dark:text-white">
          {current} / {limit}
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}
