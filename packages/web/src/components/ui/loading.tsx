import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Size variant
   * @default 'default'
   */
  size?: "sm" | "default" | "lg";

  /**
   * Loading text
   */
  text?: string;

  /**
   * Whether to show spinner
   * @default true
   */
  showSpinner?: boolean;

  /**
   * Full screen loading overlay
   * @default false
   */
  fullScreen?: boolean;
}

const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
  (
    { className, size = "default", text, showSpinner = true, fullScreen = false, ...props },
    ref
  ) => {
    const sizeClasses = {
      sm: "h-4 w-4",
      default: "h-6 w-6",
      lg: "h-8 w-8",
    };

    const content = (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center gap-2",
          fullScreen && "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm",
          className
        )}
        {...props}
      >
        {showSpinner && (
          <Loader2
            className={cn("animate-spin text-primary-600 dark:text-primary-400", sizeClasses[size])}
            aria-hidden="true"
          />
        )}
        {text && (
          <p className="text-sm text-muted-foreground leading-relaxed" aria-live="polite">
            {text}
          </p>
        )}
        {!text && showSpinner && (
          <span className="sr-only" aria-live="polite">
            Loading...
          </span>
        )}
      </div>
    );

    return content;
  }
);
Loading.displayName = "Loading";

export { Loading };
