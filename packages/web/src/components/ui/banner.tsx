"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { ReactNode, useState } from "react";

interface BannerProps {
  children: ReactNode;
  variant?: "info" | "warning" | "error" | "success";
  className?: string;
  dismissible?: boolean;
}

export function Banner({
  children,
  variant = "info",
  className,
  dismissible = false,
}: BannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  const variantStyles = {
    info: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100",
    warning: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100",
    error: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100",
    success: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100",
  };
  
  const roleMap = {
    info: "status",
    warning: "alert",
    error: "alert",
    success: "status",
  } as const;

  return (
    <div
      className={cn(
        "border rounded-lg p-4 mb-6",
        variantStyles[variant],
        className
      )}
      role={roleMap[variant]}
      aria-live={variant === "error" || variant === "warning" ? "assertive" : "polite"}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">{children}</div>
        {dismissible && (
          <button
            onClick={() => setDismissed(true)}
            className="flex-shrink-0 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
            aria-label="Dismiss banner"
            type="button"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
