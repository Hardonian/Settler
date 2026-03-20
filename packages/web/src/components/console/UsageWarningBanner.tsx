/**
 * Usage Warning Banner Component
 * Displays warnings when user approaches usage limits
 */

"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface UsageWarning {
  type: string;
  current: number;
  limit: number | "unlimited";
  percentage: number;
  severity: "info" | "warning" | "critical";
  message: string;
}

export function UsageWarningBanner() {
  const [warnings, setWarnings] = useState<UsageWarning[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/console/usage/warnings")
      .then((res) => res.json())
      .then((data) => {
        if (data.warnings) {
          setWarnings(data.warnings);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading || warnings.length === 0) {
    return null;
  }

  // Show only the most critical warning
  const criticalWarning = warnings.find((w) => w.severity === "critical");
  const warningToShow = criticalWarning || warnings[0];

  if (!warningToShow || dismissed.has(warningToShow.type)) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(new Set([...dismissed, warningToShow.type]));
  };

  return (
    <Alert
      className={`mb-4 ${
        warningToShow.severity === "critical"
          ? "border-red-500 bg-red-50 dark:bg-red-900/20"
          : warningToShow.severity === "warning"
          ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
          : "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <AlertTriangle
            className={`h-5 w-5 mt-0.5 ${
              warningToShow.severity === "critical"
                ? "text-red-600 dark:text-red-400"
                : warningToShow.severity === "warning"
                ? "text-yellow-600 dark:text-yellow-400"
                : "text-blue-600 dark:text-blue-400"
            }`}
          />
          <div className="flex-1">
            <AlertTitle
              className={
                warningToShow.severity === "critical"
                  ? "text-red-900 dark:text-red-300"
                  : warningToShow.severity === "warning"
                  ? "text-yellow-900 dark:text-yellow-300"
                  : "text-blue-900 dark:text-blue-300"
              }
            >
              Usage Limit Warning
            </AlertTitle>
            <AlertDescription
              className={
                warningToShow.severity === "critical"
                  ? "text-red-800 dark:text-red-400"
                  : warningToShow.severity === "warning"
                  ? "text-yellow-800 dark:text-yellow-400"
                  : "text-blue-800 dark:text-blue-400"
              }
            >
              {warningToShow.message}
            </AlertDescription>
            {warningToShow.severity === "critical" && (
              <div className="mt-3">
                <Button asChild size="sm" className="bg-red-600 hover:bg-red-700">
                  <Link href="/pricing">Upgrade Now</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-muted-foreground/60 hover:text-muted-foreground dark:hover:text-muted-foreground/40"
          aria-label="Dismiss warning"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </Alert>
  );
}
