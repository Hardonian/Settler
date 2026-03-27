"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Children, type ReactNode } from "react";
import {
  MotionFadeIn,
  MotionHeroBlock,
  MotionInteractive,
  MotionSlideUp,
} from "./marketing-motion";

const easeSnappy = [0.22, 1, 0.36, 1] as const;

export function MarketingHeroReveal({ children }: { children: ReactNode }) {
  return <MotionHeroBlock>{children}</MotionHeroBlock>;
}

export function MarketingSectionFade({ children }: { children: ReactNode }) {
  return <MotionFadeIn>{children}</MotionFadeIn>;
}

export function MarketingSlideUp({ children }: { children: ReactNode }) {
  return <MotionSlideUp>{children}</MotionSlideUp>;
}

/** Wrap a full-width link/card; keeps existing border/bg on the child. */
export function MarketingIntentCard({ children }: { children: ReactNode }) {
  return <MotionInteractive className="block h-full">{children}</MotionInteractive>;
}

export function MarketingStaggeredFeatureGrid({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-48px" }}
      variants={{
        hidden: {},
        show: {
          transition: reduceMotion
            ? { staggerChildren: 0, delayChildren: 0 }
            : { staggerChildren: 0.06, delayChildren: 0.04 },
        },
      }}
    >
      {Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 },
            show: {
              opacity: 1,
              y: 0,
              transition: { duration: reduceMotion ? 0 : 0.28, ease: easeSnappy },
            },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
