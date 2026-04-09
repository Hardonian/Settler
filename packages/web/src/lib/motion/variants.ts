/**
 * Motion Variants
 *
 * Reusable animation variants for common patterns.
 * All variants respect prefers-reduced-motion.
 */

import { Variants } from "framer-motion";
import {
  motionDurations,
  motionEasing,
  motionSprings,
  motionDistances,
  motionScales,
  getReducedMotionDuration,
  getReducedMotionSpring,
} from "./tokens";

/**
 * Fade variants - opacity only
 */
export const fade: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: getReducedMotionDuration(motionDurations.moderate),
      ease: motionEasing.easeOut,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: getReducedMotionDuration(motionDurations.fast),
      ease: motionEasing.easeIn,
    },
  },
};

/**
 * Fade up - fade + slide up
 */
export const fadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: motionDistances.default,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: getReducedMotionDuration(motionDurations.moderate),
      ease: motionEasing.easeOut,
    },
  },
  exit: {
    opacity: 0,
    y: motionDistances.small,
    transition: {
      duration: getReducedMotionDuration(motionDurations.fast),
      ease: motionEasing.easeIn,
    },
  },
};

/**
 * Fade down - fade + slide down
 */
export const fadeDown: Variants = {
  hidden: {
    opacity: 0,
    y: -motionDistances.default,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: getReducedMotionDuration(motionDurations.moderate),
      ease: motionEasing.easeOut,
    },
  },
  exit: {
    opacity: 0,
    y: -motionDistances.small,
    transition: {
      duration: getReducedMotionDuration(motionDurations.fast),
      ease: motionEasing.easeIn,
    },
  },
};

/**
 * Slide right - horizontal slide
 */
export const slideRight: Variants = {
  hidden: {
    opacity: 0,
    x: -motionDistances.large,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: getReducedMotionDuration(motionDurations.moderate),
      ease: motionEasing.easeOut,
    },
  },
  exit: {
    opacity: 0,
    x: motionDistances.large,
    transition: {
      duration: getReducedMotionDuration(motionDurations.fast),
      ease: motionEasing.easeIn,
    },
  },
};

/**
 * Slide left - horizontal slide
 */
export const slideLeft: Variants = {
  hidden: {
    opacity: 0,
    x: motionDistances.large,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: getReducedMotionDuration(motionDurations.moderate),
      ease: motionEasing.easeOut,
    },
  },
  exit: {
    opacity: 0,
    x: -motionDistances.large,
    transition: {
      duration: getReducedMotionDuration(motionDurations.fast),
      ease: motionEasing.easeIn,
    },
  },
};

/**
 * Scale - scale + fade
 */
export const scale: Variants = {
  hidden: {
    opacity: 0,
    scale: motionScales.small,
  },
  visible: {
    opacity: 1,
    scale: motionScales.default,
    transition: {
      ...getReducedMotionSpring(motionSprings.default),
      duration: getReducedMotionDuration(motionDurations.moderate),
    },
  },
  exit: {
    opacity: 0,
    scale: motionScales.small,
    transition: {
      duration: getReducedMotionDuration(motionDurations.fast),
      ease: motionEasing.easeIn,
    },
  },
};

/**
 * Scale bounce - playful scale with bounce
 */
export const scaleBounce: Variants = {
  hidden: {
    opacity: 0,
    scale: motionScales.tiny,
  },
  visible: {
    opacity: 1,
    scale: motionScales.default,
    transition: {
      ...getReducedMotionSpring(motionSprings.bouncy),
    },
  },
  exit: {
    opacity: 0,
    scale: motionScales.tiny,
    transition: {
      duration: getReducedMotionDuration(motionDurations.fast),
      ease: motionEasing.easeIn,
    },
  },
};

/**
 * Attention - subtle pulse to draw attention
 */
export const attention: Variants = {
  hidden: {
    scale: motionScales.default,
  },
  visible: {
    scale: [motionScales.default, motionScales.large, motionScales.default],
    transition: {
      duration: getReducedMotionDuration(motionDurations.slow),
      ease: motionEasing.easeInOut,
      times: [0, 0.5, 1],
    },
  },
};

/**
 * Success - celebration animation
 */
export const success: Variants = {
  hidden: {
    scale: motionScales.small,
    opacity: 0,
  },
  visible: {
    scale: motionScales.default,
    opacity: 1,
    transition: {
      ...getReducedMotionSpring(motionSprings.bouncy),
    },
  },
};

/**
 * Stagger container - for animating children sequentially
 */
export const staggerContainer: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: getReducedMotionDuration(0.05),
      delayChildren: getReducedMotionDuration(0.1),
    },
  },
};

/**
 * Stagger item - child of stagger container
 */
export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: motionDistances.small,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: getReducedMotionDuration(motionDurations.moderate),
      ease: motionEasing.easeOut,
    },
  },
};

/**
 * Page transition - for route changes
 */
export const pageTransition: Variants = {
  hidden: {
    opacity: 0,
    y: motionDistances.default,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: getReducedMotionDuration(motionDurations.moderate),
      ease: motionEasing.easeOut,
    },
  },
  exit: {
    opacity: 0,
    y: -motionDistances.small,
    transition: {
      duration: getReducedMotionDuration(motionDurations.fast),
      ease: motionEasing.easeIn,
    },
  },
};

/**
 * Step transition - for multi-step flows
 */
export const stepTransition: Variants = {
  hidden: {
    opacity: 0,
    x: motionDistances.large,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: getReducedMotionDuration(motionDurations.moderate),
      ease: motionEasing.easeOut,
    },
  },
  exit: {
    opacity: 0,
    x: -motionDistances.large,
    transition: {
      duration: getReducedMotionDuration(motionDurations.fast),
      ease: motionEasing.easeIn,
    },
  },
};
