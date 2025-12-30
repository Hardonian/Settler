/**
 * Motion Tokens
 * 
 * Canonical timing, easing, and spring configurations for consistent motion.
 * All durations respect prefers-reduced-motion.
 */

import { SpringOptions, Easing } from 'framer-motion';

/**
 * Duration tokens (in seconds)
 * Use these for consistent timing across the app
 */
export const motionDurations = {
  /** Instant - 0ms */
  instant: 0,
  /** Very fast - 100ms */
  fast: 0.1,
  /** Fast - 150ms */
  quick: 0.15,
  /** Default - 200ms */
  default: 0.2,
  /** Moderate - 300ms */
  moderate: 0.3,
  /** Slow - 500ms */
  slow: 0.5,
  /** Very slow - 800ms */
  verySlow: 0.8,
} as const;

/**
 * Easing functions
 * Use these for natural-feeling motion
 */
export const motionEasing = {
  /** Linear - no easing */
  linear: [0, 0, 1, 1] as Easing,
  /** Ease out - quick start, slow end */
  easeOut: [0, 0, 0.2, 1] as Easing,
  /** Ease in - slow start, quick end */
  easeIn: [0.4, 0, 1, 1] as Easing,
  /** Ease in-out - smooth acceleration/deceleration */
  easeInOut: [0.4, 0, 0.2, 1] as Easing,
  /** Sharp ease out - snappy */
  sharp: [0.4, 0, 0.6, 1] as Easing,
  /** Back ease - slight overshoot */
  back: [0.34, 1.56, 0.64, 1] as Easing,
} as const;

/**
 * Spring configurations
 * Use for physics-based animations
 */
export const motionSprings = {
  /** Gentle spring - subtle bounce */
  gentle: {
    type: 'spring' as const,
    stiffness: 200,
    damping: 20,
    mass: 1,
  } satisfies SpringOptions,
  
  /** Default spring - balanced */
  default: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
    mass: 1,
  } satisfies SpringOptions,
  
  /** Snappy spring - quick response */
  snappy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 25,
    mass: 0.8,
  } satisfies SpringOptions,
  
  /** Bouncy spring - playful */
  bouncy: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 15,
    mass: 1,
  } satisfies SpringOptions,
  
  /** Stiff spring - minimal bounce */
  stiff: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 40,
    mass: 1,
  } satisfies SpringOptions,
} as const;

/**
 * Stagger delays (in seconds)
 * Use for sequential animations
 */
export const motionStagger = {
  /** Very tight stagger - 30ms */
  tight: 0.03,
  /** Default stagger - 50ms */
  default: 0.05,
  /** Loose stagger - 100ms */
  loose: 0.1,
  /** Very loose stagger - 150ms */
  veryLoose: 0.15,
} as const;

/**
 * Distance tokens (in pixels)
 * Use for consistent movement distances
 */
export const motionDistances = {
  /** Tiny - 4px */
  tiny: 4,
  /** Small - 8px */
  small: 8,
  /** Default - 16px */
  default: 16,
  /** Medium - 24px */
  medium: 24,
  /** Large - 32px */
  large: 32,
  /** Extra large - 48px */
  xl: 48,
} as const;

/**
 * Scale tokens
 * Use for consistent scaling
 */
export const motionScales = {
  /** Hidden - 0 */
  hidden: 0,
  /** Tiny - 0.8 */
  tiny: 0.8,
  /** Small - 0.9 */
  small: 0.9,
  /** Default - 1 */
  default: 1,
  /** Large - 1.1 */
  large: 1.1,
  /** Extra large - 1.2 */
  xl: 1.2,
} as const;

/**
 * Helper to respect prefers-reduced-motion
 * Returns duration 0 if user prefers reduced motion
 */
export function getReducedMotionDuration(duration: number): number {
  if (typeof window === 'undefined') return duration;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return prefersReducedMotion ? 0 : duration;
}

/**
 * Helper to get reduced motion spring
 * Returns a stiff, non-bouncy spring if user prefers reduced motion
 */
export function getReducedMotionSpring(spring: SpringOptions): SpringOptions {
  if (typeof window === 'undefined') return spring;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    return {
      type: 'spring',
      stiffness: 1000,
      damping: 100,
      mass: 1,
    };
  }
  return spring;
}
