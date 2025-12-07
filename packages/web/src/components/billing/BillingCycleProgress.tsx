"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface BillingCycleProgressProps {
  periodStart: Date;
  periodEnd: Date;
  currentDate?: Date;
  className?: string;
}

export function BillingCycleProgress({
  periodStart,
  periodEnd,
  currentDate = new Date(),
  className,
}: BillingCycleProgressProps) {
  const totalDays = Math.ceil(
    (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysElapsed = Math.ceil(
    (currentDate.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysRemaining = totalDays - daysElapsed;
  const percentage = (daysElapsed / totalDays) * 100;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>Billing Cycle</CardTitle>
        <CardDescription>
          Current billing period: {formatDate(periodStart)} - {formatDate(periodEnd)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Progress</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {daysElapsed} of {totalDays} days
            </span>
          </div>
          <Progress value={percentage} className="h-3" />
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Days Remaining</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{daysRemaining}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">Next Billing Date</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {formatDate(periodEnd)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
