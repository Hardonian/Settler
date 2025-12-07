"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface SuccessCelebrationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "first_job" | "first_reconciliation" | "first_export" | "onboarding_complete";
  metrics?: {
    timeSaved?: number;
    transactionsMatched?: number;
    accuracy?: number;
  };
  planType?: string;
}

const celebrationMessages = {
  first_job: {
    title: "🎉 Your First Job is Created!",
    description: "You're on your way to automated reconciliation",
    cta: "Run Your First Reconciliation",
    ctaLink: "/playground",
  },
  first_reconciliation: {
    title: "🚀 First Reconciliation Complete!",
    description: "Great job! You've successfully matched transactions",
    cta: "View Results",
    ctaLink: "/dashboard/jobs",
  },
  first_export: {
    title: "📊 Export Created Successfully!",
    description: "Your reconciliation report is ready",
    cta: "View All Reports",
    ctaLink: "/dashboard/jobs",
  },
  onboarding_complete: {
    title: "✨ Onboarding Complete!",
    description: "You're all set to use Settler to its full potential",
    cta: "Explore Features",
    ctaLink: "/dashboard",
  },
};

export function SuccessCelebration({
  open,
  onOpenChange,
  type,
  metrics,
  planType,
}: SuccessCelebrationProps) {
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    // Show upgrade prompt for free/trial users after first success
    if (open && (type === "first_reconciliation" || type === "onboarding_complete")) {
      if (planType === "free" || planType === "trial") {
        setTimeout(() => setShowUpgrade(true), 2000);
      }
    }
  }, [open, type, planType]);

  const message = celebrationMessages[type];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full">
              <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">{message.title}</DialogTitle>
          <DialogDescription className="text-center mt-2">{message.description}</DialogDescription>
        </DialogHeader>

        {metrics && (
          <div className="space-y-3 py-4">
            {metrics.timeSaved && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    {metrics.timeSaved} hours saved
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">This month so far</p>
                </div>
              </div>
            )}

            {metrics.transactionsMatched && (
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900 dark:text-green-100">
                    {metrics.transactionsMatched.toLocaleString()} transactions matched
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    High accuracy matching
                  </p>
                </div>
              </div>
            )}

            {metrics.accuracy && (
              <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-semibold text-purple-900 dark:text-purple-100">
                    {metrics.accuracy}% accuracy
                  </p>
                  <p className="text-xs text-purple-700 dark:text-purple-300">Excellent results</p>
                </div>
              </div>
            )}
          </div>
        )}

        {showUpgrade && (planType === "free" || planType === "trial") && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mt-4">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
              Unlock unlimited reconciliations
            </p>
            <p className="text-xs text-amber-800 dark:text-amber-200 mb-3">
              Upgrade to Commercial to remove limits and access all features.
            </p>
            <Button size="sm" asChild className="w-full bg-amber-600 hover:bg-amber-700">
              <Link href="/pricing">View Plans</Link>
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button asChild>
            <Link href={message.ctaLink}>{message.cta}</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
