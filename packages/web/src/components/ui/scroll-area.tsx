"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * ScrollArea Component
 *
 * A wrapper for scrollable content that leverages the global premium scrollbar styles
 * defined in globals.css. Provides a consistent, polished look for containers
 * with overflow.
 */
const ScrollArea = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("relative h-full w-full overflow-auto", className)} {...props}>
      {children}
    </div>
  )
);
ScrollArea.displayName = "ScrollArea";

export { ScrollArea };
