/**
 * AnimatedButton
 *
 * Button component with motion that reflects state transitions.
 * Motion is disabled during loading/disabled states.
 */

"use client";

import * as React from "react";
import { motion, MotionProps } from "framer-motion";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motionSprings, getReducedMotionSpring } from "@/lib/motion/tokens";

export interface AnimatedButtonProps extends ButtonProps {
  /**
   * Animation variant
   * @default 'subtle'
   */
  animation?: "subtle" | "bounce" | "scale" | "none";

  /**
   * Whether to show hover animation
   * @default true
   */
  hoverAnimation?: boolean;
}

const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  (
    {
      animation = "subtle",
      hoverAnimation = true,
      disabled,
      loading,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    // No animation if disabled or loading
    if (animation === "none" || isDisabled) {
      return (
        <Button ref={ref} disabled={disabled} loading={loading} className={className} {...props}>
          {children}
        </Button>
      );
    }

    const motionProps: MotionProps = {
      whileHover:
        hoverAnimation && !isDisabled
          ? {
              scale: animation === "bounce" ? 1.05 : 1.02,
              transition: getReducedMotionSpring(motionSprings.gentle),
            }
          : undefined,
      whileTap: !isDisabled
        ? {
            scale: 0.98,
            transition: getReducedMotionSpring(motionSprings.snappy),
          }
        : undefined,
      initial: animation === "scale" ? { scale: 0.95 } : undefined,
      animate: animation === "scale" ? { scale: 1 } : undefined,
      transition: getReducedMotionSpring(motionSprings.gentle),
    };

    return (
      <motion.div {...motionProps} className={cn("inline-block", className)}>
        <Button ref={ref} disabled={disabled} loading={loading} {...props}>
          {children}
        </Button>
      </motion.div>
    );
  }
);

AnimatedButton.displayName = "AnimatedButton";

export { AnimatedButton };
