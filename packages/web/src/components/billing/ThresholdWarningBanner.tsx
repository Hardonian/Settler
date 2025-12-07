"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
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
    <Card
      className={cn(
        "border-l-4",
        isDanger
          ? "border-red-500 bg-red-50 dark:bg-red-900/20"
          : "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20",
        className
      )}
    >
      <CardContent className="pt-6">
        <div className="flex items-start">
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="ml-auto -mt-2 -mr-2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
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
      </CardContent>
    </Card>
  );
}
