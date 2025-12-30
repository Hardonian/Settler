/**
 * Reveal
 * 
 * Wrapper component that animates children on mount or when visible.
 * Supports intersection observer for scroll-triggered animations.
 */

'use client';

import * as React from 'react';
import { motion, MotionProps, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';
import { fadeUp, fade, scale, fadeDown } from '@/lib/motion/variants';

export interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Animation variant
   * @default 'fadeUp'
   */
  variant?: 'fadeUp' | 'fadeDown' | 'fade' | 'scale' | 'none';
  
  /**
   * Whether to trigger on scroll (uses Intersection Observer)
   * @default false
   */
  triggerOnScroll?: boolean;
  
  /**
   * Animation delay in seconds
   * @default 0
   */
  delay?: number;
  
  /**
   * Stagger delay for children (if using stagger)
   * @default 0
   */
  staggerDelay?: number;
  
  /**
   * Children to animate
   */
  children: React.ReactNode;
}

const variantMap = {
  fadeUp,
  fadeDown,
  fade,
  scale,
  none: undefined,
} as const;

const Reveal = React.forwardRef<HTMLDivElement, RevealProps>(
  (
    {
      variant = 'fadeUp',
      triggerOnScroll = false,
      delay = 0,
      staggerDelay = 0,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const internalRef = React.useRef<HTMLDivElement>(null);
    const isInView = useInView(internalRef, {
      once: true,
      margin: '-100px',
    });

    const actualRef = (ref || internalRef) as React.RefObject<HTMLDivElement>;

    const variants = variantMap[variant];

    const motionProps: MotionProps = {
      variants: variants || undefined,
      initial: variant !== 'none' ? 'hidden' : false,
      animate:
        variant !== 'none'
          ? triggerOnScroll
            ? isInView
              ? 'visible'
              : 'hidden'
            : 'visible'
          : false,
      transition: {
        delay: delay + staggerDelay,
      },
    };

    if (variant === 'none') {
      return (
        <div ref={actualRef} className={className} {...props}>
          {children}
        </div>
      );
    }

    return (
      <motion.div
        ref={actualRef}
        {...motionProps}
        className={cn('w-full', className)}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Reveal.displayName = 'Reveal';

export { Reveal };
