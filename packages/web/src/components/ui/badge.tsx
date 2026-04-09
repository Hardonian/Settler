import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Visual style variant
   * @default 'default'
   */
  variant?:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "success"
    | "warning"
    | "info"
    | "processing";

  /**
   * Size variant
   * @default 'default'
   */
  size?: "sm" | "default" | "lg";
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variants = {
      default: "border-transparent bg-primary-600 text-white hover:bg-primary-700",
      secondary: "border-transparent bg-muted text-muted-foreground hover:bg-muted/80",
      destructive:
        "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90",
      outline: "border-border text-foreground bg-transparent hover:bg-accent",
      success: "border-transparent bg-success/15 text-success border border-success/25",
      warning: "border-transparent bg-warning/15 text-warning border border-warning/25",
      info: "border-transparent bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25",
      processing:
        "border-transparent bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25 animate-pulse",
    };

    const sizes = {
      sm: "px-1.5 py-0.5 text-xs",
      default: "px-2.5 py-0.5 text-xs",
      lg: "px-3 py-1 text-sm",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full border font-semibold",
          "transition-colors",
          "leading-[1.4] whitespace-normal break-words",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge };
