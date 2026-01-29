/**
 * Value Moment Upgrade Prompt Component
 * Shows upgrade prompts at key value moments (first reconciliation, etc.)
 */

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Sparkles, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface ValueMoment {
  id: string;
  title: string;
  description: string;
  cta: string;
  ctaLink: string;
  dismissible: boolean;
}

const VALUE_MOMENTS: Record<string, ValueMoment> = {
  first_reconciliation: {
    id: "first_reconciliation",
    title: "🎉 You've completed your first reconciliation!",
    description:
      "You're seeing the power of Settler. Upgrade to Commercial to unlock unlimited reconciliations, advanced features, and priority support.",
    cta: "Upgrade to Commercial",
    ctaLink: "/pricing",
    dismissible: true,
  },
  approaching_limit: {
    id: "approaching_limit",
    title: "You're approaching your usage limit",
    description:
      "You've used 80% of your monthly limit. Upgrade to Commercial for 100x more capacity and unlimited growth.",
    cta: "Upgrade Now",
    ctaLink: "/pricing",
    dismissible: true,
  },
  high_usage: {
    id: "high_usage",
    title: "You're a power user!",
    description:
      "You're using Settler heavily. Upgrade to Commercial to unlock advanced features, better performance, and priority support.",
    cta: "Upgrade to Commercial",
    ctaLink: "/pricing",
    dismissible: true,
  },
};

export function ValueMomentUpgradePrompt() {
  const pathname = usePathname();
  const [activeMoment, setActiveMoment] = useState<ValueMoment | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Check for value moments based on current page and user actions
    checkValueMoments();
  }, [pathname]);

  const checkValueMoments = async () => {
    try {
      // Check if user just completed first reconciliation
      if (pathname?.includes("/console/receipts") || pathname?.includes("/console/usage")) {
        const response = await fetch("/api/user/value-moments");
        if (response.ok) {
          const data = await response.json();
          if (data.moment && !dismissed.has(data.moment)) {
            setActiveMoment(VALUE_MOMENTS[data.moment] || null);
          }
        }
      }
    } catch (error: unknown) {
      // Silently fail
    }
  };

  const handleDismiss = () => {
    if (activeMoment) {
      setDismissed(new Set([...dismissed, activeMoment.id]));
      setActiveMoment(null);
      
      // Persist dismissal
      localStorage.setItem(
        `dismissed_value_moment_${activeMoment.id}`,
        Date.now().toString()
      );
    }
  };

  if (!activeMoment) {
    return null;
  }

  return (
    <Card className="mb-6 border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="mt-1">
              <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg text-slate-900 dark:text-white">
                {activeMoment.title}
              </CardTitle>
              <CardDescription className="mt-2 text-slate-700 dark:text-slate-300">
                {activeMoment.description}
              </CardDescription>
            </div>
          </div>
          {activeMoment.dismissible && (
            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              aria-label="Dismiss"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            asChild
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Link href={activeMoment.ctaLink}>
              {activeMoment.cta}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/pricing">View Pricing</Link>
          </Button>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <Zap className="h-3 w-3" />
          <span>14-day free trial • No credit card required</span>
        </div>
      </CardContent>
    </Card>
  );
}
