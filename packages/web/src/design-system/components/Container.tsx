import * as React from "react";
import { cn } from "@/lib/utils";

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Maximum width variant
   * @default 'xl'
   */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";

  /**
   * Padding variant
   * @default 'default'
   */
  padding?: "none" | "sm" | "default" | "lg";

  /**
   * Whether to center the container
   * @default true
   */
  center?: boolean;
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, maxWidth = "xl", padding = "default", center = true, children, ...props }, ref) => {
    const maxWidthClasses = {
      sm: "max-w-screen-sm",
      md: "max-w-screen-md",
      lg: "max-w-screen-lg",
      xl: "max-w-screen-xl",
      "2xl": "max-w-[1400px]",
      full: "max-w-full",
    };

    const paddingClasses = {
      none: "",
      sm: "px-4",
      default: "px-4 sm:px-6 lg:px-8",
      lg: "px-6 sm:px-8 lg:px-12",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "w-full",
          maxWidthClasses[maxWidth],
          paddingClasses[padding],
          center && "mx-auto",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Container.displayName = "Container";

export { Container };
