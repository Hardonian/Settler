"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
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
  return (
    <motion.div
      className={cn("will-change-[opacity]", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={fadeInTransition}
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
  return (
    <motion.div
      className={cn("will-change-[transform,opacity]", className)}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={slideUpTransition}
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
  return (
    <motion.div
      className={cn("will-change-[transform,opacity]", className)}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...slideUpTransition, delay }}
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
  return (
    <motion.div
      className={cn(className)}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
