import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  /**
   * Size variant
   * @default 'default'
   */
  size?: "sm" | "default" | "lg";

  /**
   * Whether the input has an error state
   */
  error?: boolean;

  /**
   * Error message to display (for accessibility)
   */
  errorMessage?: string;

  /**
   * Helper text to display below input
   */
  helperText?: string;

  /**
   * Left icon element
   */
  leftIcon?: React.ReactNode;

  /**
   * Right icon element
   */
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      size = "default",
      error,
      errorMessage,
      helperText,
      leftIcon,
      rightIcon,
      id,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId();
    const errorId = error && errorMessage ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;
    const describedBy = [errorId, helperId, ariaDescribedBy].filter(Boolean).join(" ") || undefined;

    const sizeClasses = {
      sm: "h-9 text-sm px-3",
      default: "h-10 text-sm px-3",
      lg: "h-11 text-base px-4",
    };

    const inputClasses = cn(
      "flex w-full rounded-md border bg-background text-foreground",
      "ring-offset-background",
      "file:border-0 file:bg-transparent file:text-sm file:font-medium",
      "placeholder:text-muted-foreground",
      // Enhanced transitions
      "transition-[border-color,background-color,color,box-shadow] duration-200 ease-out",
      // Focus styles - improved contrast
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "focus-visible:ring-offset-background",
      // Hover state
      "hover:border-accent-foreground/50",
      // Disabled state
      "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted",
      // Size
      sizeClasses[size],
      // Error state
      error && "border-destructive focus-visible:ring-destructive hover:border-destructive",
      !error && "border-input",
      // Icon spacing
      leftIcon && "pl-10",
      rightIcon && "pr-10",
      // Respect reduced motion
      "motion-reduce:transition-none",
      className
    );

    const inputElement = (
      <input
        type={type}
        id={inputId}
        className={inputClasses}
        ref={ref}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy}
        {...props}
      />
    );

    const wrapperContent = (
      <>
        {leftIcon && (
          <div
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          >
            {leftIcon}
          </div>
        )}
        {inputElement}
        {rightIcon && (
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          >
            {rightIcon}
          </div>
        )}
      </>
    );

    return (
      <div className="w-full">
        {leftIcon || rightIcon ? (
          <div className="relative w-full">{wrapperContent}</div>
        ) : (
          inputElement
        )}
        {error && errorMessage && (
          <p
            id={errorId}
            className="mt-1.5 text-sm text-destructive font-medium"
            role="alert"
            aria-live="polite"
          >
            {errorMessage}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="mt-1.5 text-sm text-muted-foreground">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
