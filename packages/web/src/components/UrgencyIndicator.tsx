"use client";

import { useState, useEffect } from "react";
import { Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface UrgencyIndicatorProps {
  className?: string;
  variant?: "subtle" | "prominent";
}

export function UrgencyIndicator({ className, variant = "subtle" }: UrgencyIndicatorProps) {
  const [mounted, setMounted] = useState(false);
  const [recentSignups, setRecentSignups] = useState(5);
  const [minutesAgo, setMinutesAgo] = useState(3);

  useEffect(() => {
    setMounted(true);
    // Simulate recent signups (for demo - in production, fetch from API)
    // Use stable values to avoid hydration mismatches
    setRecentSignups(Math.floor(Math.random() * 5) + 3); // 3-7 signups
    setMinutesAgo(Math.floor(Math.random() * 5) + 1); // 1-5 minutes
  }, []);

  if (!mounted) return null;

  if (variant === "prominent") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 px-4 py-2 rounded-lg",
          "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20",
          "border border-amber-200 dark:border-amber-800",
          "text-amber-800 dark:text-amber-200",
          className
        )}
        role="status"
        aria-live="polite"
      >
        <Zap className="w-4 h-4 animate-pulse" />
        <span className="text-sm font-medium">
          <span className="font-bold">{recentSignups} companies</span> signed up in the last {minutesAgo} minutes
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Clock className="w-4 h-4" />
      <span>
        <span className="font-semibold">{recentSignups} signups</span> in the last hour
      </span>
    </div>
  );
}
