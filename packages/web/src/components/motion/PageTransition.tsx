/**
 * PageTransition
 *
 * Wrapper for page-level transitions.
 * Use with AnimatePresence for route transitions.
 */

"use client";

import * as React from "react";
import { motion, MotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { pageTransition } from "@/lib/motion/variants";

// Exclude motion-specific props that conflict with HTML attributes
type MotionConflictKeys =
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onAnimationStart"
  | "onAnimationComplete"
  | "onUpdate"
  | "onLayoutAnimationStart"
  | "onLayoutAnimationComplete";

export interface PageTransitionProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  MotionConflictKeys
> {
  /**
   * Transition key - change this to trigger transition
   */
  transitionKey?: string | number;

  /**
   * Custom variants (defaults to pageTransition)
   */
  variants?: typeof pageTransition;

  /**
   * Children to animate
   */
  children: React.ReactNode;
}

const PageTransition = React.forwardRef<HTMLDivElement, PageTransitionProps>(
  ({ transitionKey, variants = pageTransition, className, children, ...props }, ref) => {
    const motionProps: MotionProps = {
      variants,
      initial: "hidden",
      animate: "visible",
      exit: "exit",
    };

    return (
      <motion.div
        key={transitionKey}
        ref={ref}
        {...motionProps}
        className={cn("w-full", className)}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

PageTransition.displayName = "PageTransition";

export { PageTransition };
