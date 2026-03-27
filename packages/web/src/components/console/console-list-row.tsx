import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Dense console list row — shared border/hover/focus rhythm for operational lists.
 */
export function ConsoleListRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card/40 p-4 transition-colors",
        "hover:border-primary/30 hover:bg-muted/15",
        "focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-ring/40 focus-within:ring-offset-2 focus-within:ring-offset-background",
        className
      )}
    >
      {children}
    </div>
  );
}
