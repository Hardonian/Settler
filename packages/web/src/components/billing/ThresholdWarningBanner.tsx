"use client";

import React from "react";
import { Banner } from "@/components/ui/banner";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ThresholdWarningBannerProps {
  title?: string;
  message: string;
  severity?: "warning" | "danger";
  onDismiss?: () => void;
  onUpgrade?: () => void;
  className?: string;
}

export function ThresholdWarningBanner({
  title,
  message,
  severity = "warning",
  onDismiss,
  onUpgrade,
  className,
}: ThresholdWarningBannerProps) {
  const isDanger = severity === "danger";

  return (
    <Banner
      variant={isDanger ? "error" : "warning"}
      dismissible={!!onDismiss}
      className={className}
    >
      <div className="flex items-start">
        <AlertTriangle
          className={cn(
            "h-5 w-5 mt-0.5 mr-3 flex-shrink-0",
            isDanger ? "text-red-600 dark:text-red-400" : "text-yellow-600 dark:text-yellow-400"
          )}
        />
        <div className="flex-1">
          {title && (
            <h3 className="text-sm font-semibold mb-1">
              {title}
            </h3>
          )}
          <p className="text-sm">
            {message}
          </p>
          {onUpgrade && (
            <div className="mt-3">
              <Button
                onClick={onUpgrade}
                size="sm"
                variant={isDanger ? "default" : "outline"}
                className={cn(
                  isDanger && "bg-red-600 hover:bg-red-700 text-white"
                )}
              >
                Upgrade Plan
              </Button>
            </div>
          )}
        </div>
      </div>
    </Banner>
  );
}
