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
      sm: "max-w-screen-sm", // 640px
      md: "max-w-screen-md", // 768px
      lg: "max-w-screen-lg", // 1024px
      xl: "max-w-7xl", // 1280px (matches Tailwind's 7xl)
      "2xl": "max-w-[1400px]", // 1400px (from tokens)
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
