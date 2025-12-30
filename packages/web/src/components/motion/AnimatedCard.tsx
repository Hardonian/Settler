/**
 * AnimatedCard
 * 
 * Card component with entrance animation and optional hover effects.
 */

'use client';

import * as React from 'react';
import { motion, MotionProps } from 'framer-motion';
import { Card, CardProps } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { fadeUp, scale } from '@/lib/motion/variants';
import { motionSprings, getReducedMotionSpring } from '@/lib/motion/tokens';

export interface AnimatedCardProps extends CardProps {
  /**
   * Entrance animation variant
   * @default 'fadeUp'
   */
  animation?: 'fadeUp' | 'scale' | 'fade' | 'none';
  
  /**
   * Whether to show hover animation
   * @default true
   */
  hoverAnimation?: boolean;
  
  /**
   * Animation delay in seconds
   * @default 0
   */
  delay?: number;
  
  /**
   * Whether to animate on mount
   * @default true
   */
  animateOnMount?: boolean;
}

const AnimatedCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  (
    {
      animation = 'fadeUp',
      hoverAnimation = true,
      delay = 0,
      animateOnMount = true,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const variants = React.useMemo(() => {
      if (animation === 'none' || !animateOnMount) return undefined;
      switch (animation) {
        case 'scale':
          return scale;
        case 'fade':
          return fadeUp; // fadeUp includes fade
        case 'fadeUp':
        default:
          return fadeUp;
      }
    }, [animation, animateOnMount]);

    const motionProps: MotionProps = {
      variants,
      initial: animateOnMount ? 'hidden' : false,
      animate: animateOnMount ? 'visible' : false,
      transition: {
        delay: delay,
      },
      whileHover: hoverAnimation
        ? {
            y: -4,
            transition: getReducedMotionSpring(motionSprings.gentle),
          }
        : undefined,
    };

    if (!animateOnMount && !hoverAnimation) {
      return (
        <Card ref={ref} className={className} {...props}>
          {children}
        </Card>
      );
    }

    return (
      <motion.div
        ref={ref}
        {...motionProps}
        className={cn('w-full', className)}
      >
        <Card {...props}>{children}</Card>
      </motion.div>
    );
  }
);

AnimatedCard.displayName = 'AnimatedCard';

export { AnimatedCard };
