/**
 * Freeze-Aware Section Component
 * Shows freeze badge and messaging for page sections affected by freeze
 */

import React from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FreezeAwareSectionProps {
  /** Whether the system is frozen */
  isFrozen: boolean;
  /** Freeze reason */
  freezeReason?: string | null;
  /** Section title */
  title?: string;
  /** Custom message when frozen */
  frozenMessage?: string;
  /** Children content */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

/**
 * Wraps a section with freeze state indication
 * Shows badge when frozen without completely disabling the section
 */
export function FreezeAwareSection({
  isFrozen,
  freezeReason,
  title,
  frozenMessage = "Write operations limited by tenant freeze",
  children,
  className,
}: FreezeAwareSectionProps) {
  return (
    <div className={cn("relative", className)}>
      {isFrozen && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-start gap-2">
            <Lock className="h-4 w-4 flex-shrink-0 text-amber-700 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900">
                {title && <span className="font-semibold">{title}: </span>}
                {frozenMessage}
              </p>
              {freezeReason && (
                <p className="text-xs text-amber-700 mt-1">Reason: {freezeReason}</p>
              )}
            </div>
          </div>
        </div>
      )}
      <div className={cn(isFrozen && "opacity-90")}>{children}</div>
    </div>
  );
}
