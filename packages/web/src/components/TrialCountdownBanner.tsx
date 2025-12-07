"use client";

import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
// Simple date formatting without date-fns dependency
function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "past";
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "1 day";
  if (diffDays < 7) return `${diffDays} days`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
  return `${Math.floor(diffDays / 365)} years`;
}
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

interface TrialCountdownBannerProps {
  trialEndDate: string;
  userPlan: string;
}

export function TrialCountdownBanner({ trialEndDate, userPlan }: TrialCountdownBannerProps) {
  if (userPlan !== "trial") {
    return null;
  }

  const endDate = new Date(trialEndDate);
  const now = new Date();
  const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return (
      <Banner variant="warning" className="border-red-500 bg-red-50 dark:bg-red-900/20 mb-6">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-900 dark:text-red-100">Your trial has ended</p>
              <p className="text-sm text-red-800 dark:text-red-200">
                Upgrade now to keep access to all features
              </p>
            </div>
          </div>
          <Button size="sm" asChild className="bg-red-600 hover:bg-red-700">
            <Link href="/pricing">Upgrade Now</Link>
          </Button>
        </div>
      </Banner>
    );
  }

  // Show upgrade CTA at 7 days or less
  if (daysRemaining <= 7) {
    return (
      <Banner variant="warning" className="border-amber-500 bg-amber-50 dark:bg-amber-900/20 mb-6">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-100">
                {daysRemaining} {daysRemaining === 1 ? "day" : "days"} left in your trial
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Upgrade now to keep unlimited access to all features
              </p>
            </div>
          </div>
          <Button size="sm" asChild className="bg-amber-600 hover:bg-amber-700">
            <Link href="/pricing">Upgrade to Keep Access</Link>
          </Button>
        </div>
      </Banner>
    );
  }

  // Standard countdown for more than 7 days
  return (
    <Banner variant="info" className="mb-6">
      <div className="flex items-center gap-2">
        <span className="font-semibold">Trial ends in:</span>
        <span>{formatDistanceToNow(endDate)}</span>
      </div>
    </Banner>
  );
}
