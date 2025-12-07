"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CostItem {
  label: string;
  amount: number;
  description?: string;
  currency?: string;
}

interface CostBreakdownCardProps {
  title?: string;
  description?: string;
  items: CostItem[];
  total: number;
  currency?: string;
  period?: string;
  className?: string;
}

export function CostBreakdownCard({
  title = "Cost Breakdown",
  description,
  items,
  total,
  currency = "USD",
  period,
  className,
}: CostBreakdownCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {period && <CardDescription className="text-xs text-gray-500">{period}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.label}</p>
                {item.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {item.description}
                  </p>
                )}
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 ml-4">
                {formatCurrency(item.amount)}
              </p>
            </div>
          ))}
        </div>
        <div className="pt-4 border-t-2 border-gray-300 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <p className="text-base font-semibold text-gray-900 dark:text-gray-100">Total</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(total)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
