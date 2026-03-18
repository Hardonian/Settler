/**
 * Freeze-Aware Button Component
 * Automatically disables and shows truthful messaging when system is frozen
 */

import React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";

export interface FreezeBlockedButtonProps extends ButtonProps {
  /** Whether the system is frozen (from useGovernanceState) */
  isFrozen: boolean;
  /** Optional custom message when blocked */
  frozenMessage?: string;
  /** Reason for freeze */
  freezeReason?: string | null;
}

/**
 * Button that proactively disables when tenant is frozen
 * Shows clear visual indication and explanation
 */
export const FreezeBlockedButton = React.forwardRef<HTMLButtonElement, FreezeBlockedButtonProps>(
  (
    {
      isFrozen,
      frozenMessage = "Action blocked by tenant freeze",
      freezeReason,
      disabled,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isFrozen;
    const tooltipMessage = isFrozen ? [frozenMessage, freezeReason].filter(Boolean).join(": ") : "";

    const button = (
      <Button
        ref={ref}
        disabled={isDisabled}
        className={cn(isFrozen && "opacity-60 cursor-not-allowed", className)}
        {...props}
      >
        {isFrozen && <Lock className="mr-2 h-4 w-4" aria-hidden="true" />}
        {children}
      </Button>
    );

    if (isFrozen && tooltipMessage) {
      return (
        <Tooltip content={tooltipMessage} side="top">
          {button}
        </Tooltip>
      );
    }

    return button;
  }
);

FreezeBlockedButton.displayName = "FreezeBlockedButton";
