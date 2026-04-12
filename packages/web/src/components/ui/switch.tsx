/**
 * Switch Component
 *
 * A toggle switch component for boolean inputs.
 * Uses a native checkbox with role="switch" for maximum accessibility and linter compatibility.
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ checked = false, onCheckedChange, disabled, className, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        role="switch"
        ref={ref}
        disabled={disabled}
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer appearance-none items-center rounded-full transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "before:inline-block before:h-4 before:w-4 before:transform before:rounded-full before:bg-background before:transition-transform before:content-['']",
          checked ? "bg-primary before:translate-x-6" : "bg-muted/60 before:translate-x-1",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        {...props}
      />
    );
  }
);

Switch.displayName = "Switch";
