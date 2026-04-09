/**
 * Milestone Celebration Component
 *
 * Displays celebratory acknowledgment when users reach important milestones,
 * such as first reconciliation, API key creation, etc.
 */

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, X, Sparkles, Trophy, Zap, Key, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export type MilestoneType =
  | "first_api_key"
  | "first_reconciliation"
  | "first_receipt_parsed"
  | "first_feature_flag"
  | "ten_reconciliations"
  | "hundred_reconciliations";

interface MilestoneConfig {
  icon: typeof CheckCircle2;
  title: string;
  description: string;
  ctaLabel: string;
  ctaUrl: string;
  color: "green" | "blue" | "purple" | "amber";
}

const MILESTONE_CONFIGS: Record<MilestoneType, MilestoneConfig> = {
  first_api_key: {
    icon: Key,
    title: "First API Key Created!",
    description:
      "You've created your first API key. You can now start using Settler APIs in your applications.",
    ctaLabel: "View API Keys",
    ctaUrl: "/console/api-keys",
    color: "blue",
  },
  first_reconciliation: {
    icon: RefreshCw,
    title: "First Reconciliation Complete!",
    description:
      "Congratulations! You've completed your first reconciliation. You're now saving time on manual matching.",
    ctaLabel: "View Results",
    ctaUrl: "/dashboard/jobs",
    color: "green",
  },
  first_receipt_parsed: {
    icon: Zap,
    title: "First Receipt Parsed!",
    description:
      "You've successfully parsed your first receipt. Settler extracted all the key information automatically.",
    ctaLabel: "View Receipts",
    ctaUrl: "/console/receipts",
    color: "purple",
  },
  first_feature_flag: {
    icon: Sparkles,
    title: "First Feature Flag Created!",
    description:
      "You've created your first feature flag. Start controlling feature rollouts programmatically.",
    ctaLabel: "Manage Flags",
    ctaUrl: "/console/feature-flags",
    color: "amber",
  },
  ten_reconciliations: {
    icon: Trophy,
    title: "10 Reconciliations Complete!",
    description: "You've completed 10 reconciliations. You're becoming a power user!",
    ctaLabel: "View Dashboard",
    ctaUrl: "/dashboard",
    color: "green",
  },
  hundred_reconciliations: {
    icon: Trophy,
    title: "100 Reconciliations Complete!",
    description:
      "Amazing! You've completed 100 reconciliations. You're saving hours of manual work every week.",
    ctaLabel: "View Dashboard",
    ctaUrl: "/dashboard",
    color: "green",
  },
};

interface MilestoneCelebrationProps {
  milestone: MilestoneType;
  onDismiss?: () => void;
  autoDismissAfter?: number; // milliseconds, default 10000 (10 seconds)
}

export function MilestoneCelebration({
  milestone,
  onDismiss,
  autoDismissAfter = 10000,
}: MilestoneCelebrationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const router = useRouter();
  const config = MILESTONE_CONFIGS[milestone];
  const Icon = config.icon;

  useEffect(() => {
    if (autoDismissAfter > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoDismissAfter);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [autoDismissAfter]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
    // Store dismissal in localStorage
    if (typeof window !== "undefined") {
      const dismissed = JSON.parse(localStorage.getItem("settler_milestones_dismissed") || "[]");
      if (!dismissed.includes(milestone)) {
        dismissed.push(milestone);
        localStorage.setItem("settler_milestones_dismissed", JSON.stringify(dismissed));
      }
    }
  };

  const handleCTAClick = () => {
    router.push(config.ctaUrl);
    handleDismiss();
  };

  if (!isVisible) {
    return null;
  }

  const colorClasses = {
    green: {
      border: "border-green-500",
      bg: "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",
      iconBg: "bg-green-500",
      text: "text-green-900 dark:text-green-300",
      textSecondary: "text-green-800 dark:text-green-200",
      button: "bg-green-600 hover:bg-green-700 text-white",
      buttonOutline: "border-green-300 text-green-700 dark:text-green-300",
    },
    blue: {
      border: "border-blue-500",
      bg: "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20",
      iconBg: "bg-blue-500",
      text: "text-blue-900 dark:text-blue-300",
      textSecondary: "text-blue-800 dark:text-blue-200",
      button: "bg-blue-600 hover:bg-blue-700 text-white",
      buttonOutline: "border-blue-300 text-blue-700 dark:text-blue-300",
    },
    purple: {
      border: "border-purple-500",
      bg: "bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20",
      iconBg: "bg-purple-500",
      text: "text-purple-900 dark:text-purple-300",
      textSecondary: "text-purple-800 dark:text-purple-200",
      button: "bg-purple-600 hover:bg-purple-700 text-white",
      buttonOutline: "border-purple-300 text-purple-700 dark:text-purple-300",
    },
    amber: {
      border: "border-amber-500",
      bg: "bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20",
      iconBg: "bg-amber-500",
      text: "text-amber-900 dark:text-amber-300",
      textSecondary: "text-amber-800 dark:text-amber-200",
      button: "bg-amber-600 hover:bg-amber-700 text-white",
      buttonOutline: "border-amber-300 text-amber-700 dark:text-amber-300",
    },
  };

  const colors = colorClasses[config.color];

  return (
    <Card
      className={`${colors.border} ${colors.bg} shadow-lg mb-6 animate-in slide-in-from-top-4 duration-500`}
    >
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div
              className={`w-12 h-12 rounded-full ${colors.iconBg} flex items-center justify-center animate-pulse`}
            >
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className={`w-5 h-5 ${colors.text}`} />
              <h3 className={`text-lg font-semibold ${colors.text}`}>{config.title}</h3>
            </div>
            <p className={`${colors.textSecondary} mb-4`}>{config.description}</p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleCTAClick} size="sm" className={colors.button}>
                {config.ctaLabel}
              </Button>
              <Button
                onClick={handleDismiss}
                variant="outline"
                size="sm"
                className={colors.buttonOutline}
              >
                Dismiss
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className={`flex-shrink-0 ${colors.text} hover:opacity-70`}
            aria-label="Dismiss milestone celebration"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
