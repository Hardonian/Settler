import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual style variant
   * @default 'default'
   */
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";

  /**
   * Size variant
   * @default 'default'
   */
  size?: "default" | "sm" | "lg" | "icon";

  /**
   * Whether to render as child element (for composition)
   * @default false
   */
  asChild?: boolean;

  /**
   * Whether button takes full width of container
   * @default false
   */
  fullWidth?: boolean;

  /**
   * Loading state - shows spinner and disables button
   * @default false
   */
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      asChild = false,
      fullWidth = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const baseStyles = [
      "inline-flex items-center justify-center gap-2",
      "rounded-md text-sm font-medium",
      "ring-offset-background",
      // Enhanced transitions for all interactive properties
      "transition-[background-color,color,transform,box-shadow,border-color] duration-100 ease-out",
      // Focus styles - visible and accessible
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "focus-visible:ring-offset-background",
      // Disabled state
      "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
      // Active state with subtle scale
      "active:scale-[0.98]",
      // Respect reduced motion
      "motion-reduce:transition-none motion-reduce:active:scale-100",
    ];

    const variants = {
      default: [
        "bg-primary-600 text-white",
        "hover:bg-primary-700 hover:shadow-md",
        "active:bg-primary-800 active:shadow-sm",
        "focus-visible:ring-primary-600",
      ],
      destructive: [
        "bg-destructive text-destructive-foreground",
        "hover:bg-destructive/90 hover:shadow-md",
        "active:bg-destructive active:shadow-sm",
        "focus-visible:ring-destructive",
      ],
      outline: [
        "border-2 border-input bg-background",
        "hover:bg-accent hover:text-accent-foreground hover:border-accent",
        "active:bg-accent/80 active:border-accent",
        "focus-visible:ring-ring",
      ],
      secondary: [
        "bg-muted text-muted-foreground",
        "hover:bg-muted/80 hover:shadow-sm",
        "active:bg-muted/70",
        "focus-visible:ring-ring",
      ],
      ghost: [
        "hover:bg-accent hover:text-accent-foreground",
        "active:bg-accent/80",
        "focus-visible:ring-ring",
      ],
      link: [
        "text-primary-600 dark:text-primary-400 underline-offset-4",
        "hover:underline hover:text-primary-700 dark:hover:text-primary-300",
        "active:text-primary-800 dark:active:text-primary-200",
        "focus-visible:ring-ring focus-visible:underline",
      ],
    };

    const sizes = {
      sm: "h-9 min-h-[36px] rounded-md px-3 text-sm", // 36px - acceptable for secondary actions
      default: "h-10 min-h-[40px] px-4 py-2", // 40px - acceptable
      lg: "h-11 min-h-[44px] rounded-md px-8 text-base", // 44px - recommended tap target
      icon: "h-10 w-10 min-h-[40px] min-w-[40px]", // 40px - acceptable for icon buttons
    };

    const classes = cn(
      baseStyles,
      variants[variant],
      sizes[size],
      fullWidth && "w-full",
      className
    );

    // Loading spinner component
    const LoadingSpinner = () => (
      <svg
        className="animate-spin h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement, {
        className: cn(classes, (children.props as { className?: string })?.className),
        disabled: isDisabled,
        "aria-busy": loading,
        ...props,
      });
    }

    return (
      <button
        className={classes}
        ref={ref}
        type={props.type || "button"}
        disabled={isDisabled}
        aria-busy={loading}
        aria-disabled={isDisabled}
        {...props}
      >
        {loading && <LoadingSpinner />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
