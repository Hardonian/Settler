"use client";

import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { X } from "lucide-react";
import { useState } from "react";

interface UsageUpgradeBannerProps {
  currentUsage: number;
  limit: number;
  planType: string;
  metricType?: "reconciliations" | "playground_runs" | "exports";
}

export function UsageUpgradeBanner({
  currentUsage,
  limit,
  planType,
  metricType = "reconciliations",
}: UsageUpgradeBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  // Only show for free/trial plans
  if (planType !== "free" && planType !== "trial") {
    return null;
  }

  // Only show if limit is not unlimited
  if (limit === Infinity || limit === -1) {
    return null;
  }

  const percentage = (currentUsage / limit) * 100;

  // Only show if 80% or more used
  if (percentage < 80 || dismissed) {
    return null;
  }

  const metricLabel =
    metricType === "reconciliations"
      ? "reconciliations"
      : metricType === "playground_runs"
        ? "playground runs"
        : "exports";

  return (
    <Banner
      variant={percentage >= 95 ? "warning" : "info"}
      className="border-amber-500 bg-amber-50 dark:bg-amber-900/20"
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex-1">
          <p className="font-semibold text-amber-900 dark:text-amber-100">
            {percentage >= 95 ? "Almost out of " + metricLabel : "Running out of " + metricLabel}
          </p>
          <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
            You've used {currentUsage.toLocaleString()} of {limit.toLocaleString()} {metricLabel}{" "}
            this month ({Math.round(percentage)}% used).
          </p>
          {percentage >= 95 && (
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1 font-medium">
              Upgrade now to unlock unlimited {metricLabel}.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Button size="sm" asChild className="bg-amber-600 hover:bg-amber-700">
            <Link href="/pricing">Upgrade to Commercial</Link>
          </Button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-amber-200 dark:hover:bg-amber-800 rounded"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Banner>
  );
}
