/**
 * Urgency Indicators
 *
 * Usage warnings, upgrade prompts, and urgency signals.
 */

"use client";

import { AlertTriangle, TrendingUp, Zap, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function UsageWarning({
  current,
  limit,
  type = "usage",
}: {
  current: number;
  limit: number;
  type?: "usage" | "quota" | "rate";
}) {
  const percentage = (current / limit) * 100;
  const isWarning = percentage >= 80;
  const isCritical = percentage >= 95;

  if (!isWarning) return null;

  return (
    <Card
      className={`border-2 ${
        isCritical
          ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
          : "border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20"
      }`}
    >
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <AlertTriangle
            className={`w-5 h-5 mt-0.5 ${
              isCritical ? "text-red-600 dark:text-red-400" : "text-yellow-600 dark:text-yellow-400"
            }`}
          />
          <div className="flex-1">
            <div className="font-medium text-foreground dark:text-white mb-1">
              {isCritical ? "Critical" : "Warning"}:{" "}
              {type === "usage" ? "Usage" : type === "quota" ? "Quota" : "Rate"} Limit
            </div>
            <div className="text-sm text-muted-foreground dark:text-muted-foreground mb-3">
              You've used {current.toLocaleString()} of {limit.toLocaleString()} (
              {percentage.toFixed(1)}%)
            </div>
            <div className="w-full bg-slate-200 dark:bg-muted rounded-full h-2 mb-3">
              <div
                className={`h-2 rounded-full transition-all ${
                  isCritical ? "bg-red-600" : "bg-yellow-600"
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
                role="progressbar"
                aria-valuenow={percentage}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <Link href="/console/billing">
              <Button size="sm" variant={isCritical ? "destructive" : "default"}>
                Upgrade Plan
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function UpgradePrompt({
  feature,
  currentTier,
  recommendedTier,
}: {
  feature: string;
  currentTier: string;
  recommendedTier: string;
}) {
  return (
    <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="flex-1">
            <div className="font-medium text-foreground dark:text-white mb-1">Unlock {feature}</div>
            <div className="text-sm text-muted-foreground dark:text-muted-foreground mb-3">
              Upgrade from <strong>{currentTier}</strong> to <strong>{recommendedTier}</strong> to
              access this feature
            </div>
            <Link href="/console/billing">
              <Button size="sm">
                View Plans
                <TrendingUp className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function LimitedTimeBadge({ expiresAt }: { expiresAt: Date }) {
  const now = new Date();
  const diffMs = expiresAt.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffMs <= 0) return null;

  let text: string;
  if (diffDays > 0) {
    text = `${diffDays}d left`;
  } else if (diffHours > 0) {
    text = `${diffHours}h left`;
  } else {
    text = "Expiring soon";
  }

  return (
    <Badge variant="destructive" className="animate-pulse">
      <AlertTriangle className="w-3 h-3 mr-1" />
      {text}
    </Badge>
  );
}
