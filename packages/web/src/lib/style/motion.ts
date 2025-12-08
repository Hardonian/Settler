/**
 * Motion & Transition System
 * 
 * Standardized motion and transition utilities for consistent UI animations.
 * All transitions respect prefers-reduced-motion for accessibility.
 */

import { CSSProperties } from 'react';

/**
 * Transition durations (in milliseconds)
 */
export const motionDuration = {
  fast: 100,
  default: 200,
  slow: 300,
  slower: 500,
} as const;

/**
 * Easing functions
 */
export const motionEasing = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  // Material Design easing
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
  accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
  // Custom easing for UI elements
  smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
} as const;

/**
 * Transition presets for common UI elements
 */
export const motionTransitions = {
  // Colors (background, text, border)
  colors: {
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: `${motionDuration.default}ms`,
    transitionTimingFunction: motionEasing.easeOut,
  },
  
  // Transform (scale, translate, rotate)
  transform: {
    transitionProperty: 'transform',
    transitionDuration: `${motionDuration.default}ms`,
    transitionTimingFunction: motionEasing.easeOut,
  },
  
  // Opacity
  opacity: {
    transitionProperty: 'opacity',
    transitionDuration: `${motionDuration.fast}ms`,
    transitionTimingFunction: motionEasing.easeOut,
  },
  
  // All properties
  all: {
    transitionProperty: 'all',
    transitionDuration: `${motionDuration.default}ms`,
    transitionTimingFunction: motionEasing.easeOut,
  },
  
  // Button interactions
  button: {
    transitionProperty: 'background-color, color, transform, box-shadow',
    transitionDuration: `${motionDuration.fast}ms`,
    transitionTimingFunction: motionEasing.easeOut,
  },
  
  // Modal/overlay animations
  modal: {
    transitionProperty: 'opacity, transform',
    transitionDuration: `${motionDuration.slow}ms`,
    transitionTimingFunction: motionEasing.easeOut,
  },
  
  // Page transitions
  page: {
    transitionProperty: 'opacity, transform',
    transitionDuration: `${motionDuration.slower}ms`,
    transitionTimingFunction: motionEasing.easeInOut,
  },
} as const;

/**
 * Creates a CSS transition string
 */
export function createTransition(
  properties: string | string[],
  duration: number = motionDuration.default,
  easing: string = motionEasing.easeOut
): string {
  const props = Array.isArray(properties) ? properties.join(', ') : properties;
  return `${props} ${duration}ms ${easing}`;
}

/**
 * Gets transition styles respecting prefers-reduced-motion
 */
export function getTransitionStyles(
  transition: keyof typeof motionTransitions | CSSProperties
): CSSProperties {
  if (typeof transition === 'string' && transition in motionTransitions) {
    return {
      ...motionTransitions[transition],
      '@media (prefers-reduced-motion: reduce)': {
        transitionDuration: '0.01ms',
      },
    } as CSSProperties;
  }
  
  return transition as CSSProperties;
}

/**
 * Animation keyframes for common patterns
 */
export const motionKeyframes = {
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  fadeOut: {
    from: { opacity: 1 },
    to: { opacity: 0 },
  },
  slideUp: {
    from: { transform: 'translateY(20px)', opacity: 0 },
    to: { transform: 'translateY(0)', opacity: 1 },
  },
  slideDown: {
    from: { transform: 'translateY(-20px)', opacity: 0 },
    to: { transform: 'translateY(0)', opacity: 1 },
  },
  slideInLeft: {
    from: { transform: 'translateX(-20px)', opacity: 0 },
    to: { transform: 'translateX(0)', opacity: 1 },
  },
  slideInRight: {
    from: { transform: 'translateX(20px)', opacity: 0 },
    to: { transform: 'translateX(0)', opacity: 1 },
  },
  scaleIn: {
    from: { transform: 'scale(0.95)', opacity: 0 },
    to: { transform: 'scale(1)', opacity: 1 },
  },
  scaleOut: {
    from: { transform: 'scale(1)', opacity: 1 },
    to: { transform: 'scale(0.95)', opacity: 0 },
  },
} as const;

/**
 * Tailwind CSS classes for common transitions
 * These can be used directly in className props
 */
export const motionClasses = {
  // Color transitions
  transitionColors: 'transition-colors duration-200 ease-out',
  
  // Transform transitions
  transitionTransform: 'transition-transform duration-200 ease-out',
  
  // Opacity transitions
  transitionOpacity: 'transition-opacity duration-100 ease-out',
  
  // All transitions
  transitionAll: 'transition-all duration-200 ease-out',
  
  // Button hover/active
  buttonTransition: 'transition-[background-color,color,transform,box-shadow] duration-100 ease-out',
  
  // Modal/overlay
  modalTransition: 'transition-[opacity,transform] duration-300 ease-out',
  
  // Page transitions
  pageTransition: 'transition-[opacity,transform] duration-500 ease-in-out',
} as const;

/**
 * Hook to check if user prefers reduced motion
 */
export function useReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
