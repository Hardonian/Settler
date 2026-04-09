/**
 * Skeleton Loader Component
 *
 * Provides consistent loading states with shimmer effects.
 * Used to indicate content is loading while maintaining layout.
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Variant style
   * @default 'default'
   */
  variant?: "default" | "circular" | "rectangular" | "text";

  /**
   * Animation style
   * @default 'pulse'
   */
  animation?: "pulse" | "wave" | "none";

  /**
   * Width (can be Tailwind class or CSS value)
   */
  width?: string;

  /**
   * Height (can be Tailwind class or CSS value)
   */
  height?: string;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  (
    { className, variant = "default", animation = "pulse", width, height, style, ...props },
    ref
  ) => {
    const variantClasses = {
      default: "rounded-md",
      circular: "rounded-full",
      rectangular: "rounded-none",
      text: "rounded",
    };

    const animationClasses = {
      pulse: "animate-pulse",
      wave: "animate-shimmer",
      none: "",
    };

    const baseClasses = [
      "bg-muted",
      variantClasses[variant],
      animation !== "none" && animationClasses[animation],
      // Respect reduced motion
      "motion-reduce:animate-none",
    ];

    const customStyle: React.CSSProperties = {
      ...style,
      ...(width && {
        width:
          width.includes("px") || width.includes("%") || width.includes("rem") ? width : undefined,
      }),
      ...(height && {
        height:
          height.includes("px") || height.includes("%") || height.includes("rem")
            ? height
            : undefined,
      }),
    };

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          width && !customStyle.width && width,
          height && !customStyle.height && height,
          className
        )}
        style={customStyle}
        aria-busy="true"
        aria-live="polite"
        {...props}
      />
    );
  }
);
Skeleton.displayName = "Skeleton";

/**
 * Skeleton Text - Multiple lines of skeleton text
 */
export interface SkeletonTextProps extends Omit<SkeletonProps, "variant"> {
  /**
   * Number of lines
   * @default 3
   */
  lines?: number;

  /**
   * Whether last line is shorter
   * @default true
   */
  lastLineShort?: boolean;
}

export const SkeletonText = React.forwardRef<HTMLDivElement, SkeletonTextProps>(
  ({ lines = 3, lastLineShort = true, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            variant="text"
            className={cn("h-4", index === lines - 1 && lastLineShort && "w-3/4")}
          />
        ))}
      </div>
    );
  }
);
SkeletonText.displayName = "SkeletonText";

/**
 * Skeleton Card - Full card skeleton
 */
export interface SkeletonCardProps extends SkeletonProps {
  /**
   * Show avatar
   * @default false
   */
  showAvatar?: boolean;

  /**
   * Show footer
   * @default false
   */
  showFooter?: boolean;
}

export const SkeletonCard = React.forwardRef<HTMLDivElement, SkeletonCardProps>(
  ({ showAvatar = false, showFooter = false, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("rounded-lg border bg-card p-6 space-y-4", className)}
        {...props}
      >
        {showAvatar && (
          <div className="flex items-center gap-4">
            <Skeleton variant="circular" width="48px" height="48px" />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" className="h-4 w-1/3" />
              <Skeleton variant="text" className="h-3 w-1/2" />
            </div>
          </div>
        )}
        <SkeletonText lines={3} />
        {showFooter && (
          <div className="flex gap-2 pt-4">
            <Skeleton variant="rectangular" className="h-9 w-20" />
            <Skeleton variant="rectangular" className="h-9 w-20" />
          </div>
        )}
      </div>
    );
  }
);
SkeletonCard.displayName = "SkeletonCard";

export { Skeleton };
