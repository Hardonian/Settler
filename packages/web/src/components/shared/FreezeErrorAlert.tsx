/**
 * FreezeErrorAlert Component
 *
 * Consistent error handling for freeze-blocked actions across operator surfaces.
 * Provides clear messaging, governance context, and recovery paths.
 *
 * USAGE:
 * - Display after a mutation returns 423 LOCKED
 * - Pass freeze state from API error response
 * - Shows scope, reason, timestamp, and recovery guidance
 */

"use client";

import { Lock, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export interface FreezeErrorAlertProps {
  /** Freeze reason from governance state */
  reason?: string | null;
  /** Freeze scope (e.g., "tenant", "global") */
  scope?: string;
  /** When freeze was initiated */
  frozenAt?: string;
  /** Optional recovery path or next action */
  recoveryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  /** Show minimal version (no card wrapper) */
  minimal?: boolean;
  /** Custom className */
  className?: string;
}

export function FreezeErrorAlert({
  reason,
  scope = "tenant",
  frozenAt,
  recoveryAction,
  minimal = false,
  className = "",
}: FreezeErrorAlertProps) {
  const formattedDate = frozenAt
    ? new Date(frozenAt).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  const content = (
    <div className="flex items-start gap-3">
      <Lock className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-semibold text-red-900 dark:text-red-100 mb-1">
          Action blocked by tenant freeze
        </p>
        {reason && (
          <p className="text-sm text-red-800 dark:text-red-200 mb-2">
            <strong>Reason:</strong> {reason}
          </p>
        )}
        <div className="text-xs text-red-700 dark:text-red-300 space-y-1">
          {scope && (
            <p>
              <strong>Scope:</strong> {scope}
            </p>
          )}
          {formattedDate && (
            <p>
              <strong>Frozen at:</strong> {formattedDate}
            </p>
          )}
        </div>
        {recoveryAction && (
          <div className="mt-3">
            {recoveryAction.href ? (
              <Link href={recoveryAction.href}>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-800 border-red-300 hover:bg-red-50 dark:text-red-200 dark:border-red-700"
                >
                  <Info className="w-4 h-4 mr-2" />
                  {recoveryAction.label}
                </Button>
              </Link>
            ) : recoveryAction.onClick ? (
              <Button
                variant="outline"
                size="sm"
                onClick={recoveryAction.onClick}
                className="text-red-800 border-red-300 hover:bg-red-50 dark:text-red-200 dark:border-red-700"
              >
                <Info className="w-4 h-4 mr-2" />
                {recoveryAction.label}
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );

  if (minimal) {
    return (
      <div
        className={`p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg ${className}`}
      >
        {content}
      </div>
    );
  }

  return (
    <Card
      className={`border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10 ${className}`}
    >
      <CardContent className="pt-6">{content}</CardContent>
    </Card>
  );
}

/**
 * Inline freeze error message for displaying within existing components
 */
export function InlineFreezeError({
  reason,
  className = "",
}: {
  reason?: string | null;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 text-sm text-red-800 dark:text-red-200 ${className}`}>
      <Lock className="w-4 h-4" />
      <span>{reason || "This action is blocked while the tenant is frozen."}</span>
    </div>
  );
}
