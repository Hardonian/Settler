"use client";

import React from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface UsageBarProps {
  current: number;
  limit: number;
  label: string;
  unit?: string;
  showPercentage?: boolean;
  className?: string;
  warningThreshold?: number; // Percentage (0-100) at which to show warning
  dangerThreshold?: number; // Percentage (0-100) at which to show danger
}

export function UsageBar({
  current,
  limit,
  label,
  unit = "",
  showPercentage = true,
  className,
  warningThreshold = 80,
  dangerThreshold = 95,
}: UsageBarProps) {
  const percentage = limit > 0 ? Math.min((current / limit) * 100, 100) : 0;
  const isUnlimited = limit === -1;

  const getProgressColor = () => {
    if (isUnlimited) return "bg-green-500";
    if (percentage >= dangerThreshold) return "bg-red-500";
    if (percentage >= warningThreshold) return "bg-yellow-500";
    return "bg-blue-500";
  };

  const formatValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-gray-600 dark:text-gray-400">
          {isUnlimited ? (
            <span className="text-green-600 dark:text-green-400">Unlimited</span>
          ) : (
            <>
              {formatValue(current)} / {formatValue(limit)} {unit}
              {showPercentage && (
                <span className="ml-2 text-gray-500">({percentage.toFixed(0)}%)</span>
              )}
            </>
          )}
        </span>
      </div>
      {!isUnlimited && (
        <Progress
          value={percentage}
          className="h-2"
          indicatorClassName={getProgressColor()}
        />
      )}
      {percentage >= warningThreshold && !isUnlimited && (
        <p className="text-xs text-yellow-600 dark:text-yellow-400">
          {percentage >= dangerThreshold
            ? "⚠️ You're approaching your limit. Consider upgrading."
            : "⚠️ You're using a significant portion of your quota."}
        </p>
      )}
    </div>
  );
}
