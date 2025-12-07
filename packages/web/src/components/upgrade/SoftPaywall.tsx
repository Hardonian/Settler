"use client";

import { useState } from "react";
import { X, Lock, Zap, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SoftPaywallProps {
  feature: string;
  description: string;
  upgradeMessage?: string;
  currentPlan: string;
  requiredPlan: string;
  onUpgrade?: () => void;
  onDismiss?: () => void;
  variant?: "modal" | "banner" | "inline";
}

export function SoftPaywall({
  feature,
  description,
  upgradeMessage,
  currentPlan,
  requiredPlan,
  onUpgrade,
  onDismiss,
  variant = "modal",
}: SoftPaywallProps) {
  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (dismissed && variant !== "banner") return null;

  const content = (
    <div className="relative">
      {variant !== "banner" && onDismiss && (
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
            <Lock className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-slate-900 dark:text-white">{feature}</h3>
            <Badge variant="outline" className="text-xs">
              {requiredPlan} Only
            </Badge>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{description}</p>
          {upgradeMessage && (
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-4">
              {upgradeMessage}
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button
              asChild
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              onClick={onUpgrade}
            >
              <Link href="/pricing">Upgrade to {requiredPlan}</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handleDismiss}>
              Maybe Later
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  if (variant === "modal") {
    return (
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20">
        <CardContent className="pt-6">{content}</CardContent>
      </Card>
    );
  }

  if (variant === "banner") {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-blue-200 dark:border-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">{content}</div>
      </div>
    );
  }

  return <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border">{content}</div>;
}

interface UpgradeNudgeProps {
  reason: "usage_limit" | "feature_lock" | "expansion_opportunity";
  currentValue?: number;
  limitValue?: number;
  featureName?: string;
  onUpgrade: () => void;
  onDismiss?: () => void;
}

export function UpgradeNudge({
  reason,
  currentValue,
  limitValue,
  featureName,
  onUpgrade,
  onDismiss,
}: UpgradeNudgeProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const messages = {
    usage_limit: {
      title: "You're approaching your limit",
      description: `You've used ${currentValue} of ${limitValue} this month. Upgrade to continue without limits.`,
      icon: TrendingUp,
    },
    feature_lock: {
      title: "Unlock this feature",
      description: `${featureName} is available on higher plans. Upgrade to access it.`,
      icon: Lock,
    },
    expansion_opportunity: {
      title: "Ready to scale?",
      description: "You're using Settler regularly. Upgrade to unlock more features and higher limits.",
      icon: Zap,
    },
  };

  const message = messages[reason];
  const Icon = message.icon;

  return (
    <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">{message.title}</CardTitle>
              <CardDescription className="mt-1">{message.description}</CardDescription>
            </div>
          </div>
          {onDismiss && (
            <button
              onClick={() => {
                setDismissed(true);
                onDismiss();
              }}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <Button
            asChild
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            onClick={onUpgrade}
          >
            <Link href="/pricing">View Plans</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={onDismiss}>
            Not Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
