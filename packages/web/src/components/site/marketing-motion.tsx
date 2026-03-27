"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const easeSnappy = [0.22, 1, 0.36, 1] as const;

const fadeInTransition = { duration: 0.28, ease: easeSnappy };

const slideUpTransition = { duration: 0.32, ease: easeSnappy };

export function MotionFadeIn({
  className,
  children,
  ...rest
}: HTMLMotionProps<"div"> & { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={cn("will-change-[opacity]", className)}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={reduceMotion ? { duration: 0 } : fadeInTransition}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function MotionSlideUp({
  className,
  children,
  ...rest
}: HTMLMotionProps<"div"> & { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={cn("will-change-[transform,opacity]", className)}
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : slideUpTransition}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Hero / CTA — opacity + translateY, snappy spring alternative via cubic-bezier */
export function MotionHeroBlock({
  className,
  children,
  delay = 0,
  ...rest
}: HTMLMotionProps<"div"> & { children: ReactNode; delay?: number }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={cn("will-change-[transform,opacity]", className)}
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : { ...slideUpTransition, delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Subtle lift on hover for marketing cards / links */
export function MotionInteractive({
  className,
  children,
  ...rest
}: HTMLMotionProps<"div"> & { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={cn(className)}
      whileHover={reduceMotion ? undefined : { y: -2 }}
      whileTap={reduceMotion ? undefined : { scale: 0.99 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
