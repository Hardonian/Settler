'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

type ScrollOffsetType = 
  | ['start' | 'end' | 'center', 'start' | 'end' | 'center']
  | string
  | number
  | (() => number);

interface ParallaxBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  speed?: number;
  direction?: 'up' | 'down';
  offset?: ScrollOffsetType | ScrollOffsetType[];
}

export function ParallaxBackground({
  children,
  className,
  speed = 0.5,
  direction = 'up',
  offset = ['start', 'end'],
}: ParallaxBackgroundProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: offset as any,
  });

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    direction === 'up' ? [0, -100 * speed] : [0, 100 * speed]
  );

  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1, 0.3]);

  return (
    <motion.div
      ref={ref}
      className={cn('absolute inset-0 -z-10 overflow-hidden', className)}
      style={{ y, opacity }}
    >
      {children}
    </motion.div>
  );
}

// Abstract blob shapes component
export function ParallaxBlobs({
  count = 3,
  className,
  containerRef,
}: {
  count?: number;
  className?: string;
  containerRef?: React.RefObject<HTMLDivElement>;
}) {
  const blobs = Array.from({ length: count });
  const defaultRef = useRef<HTMLDivElement>(null);
  const ref = containerRef || defaultRef;

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  return (
    <div ref={ref} className={cn('absolute inset-0 overflow-hidden', className)}>
      {blobs.map((_, i) => (
        <ParallaxBlob
          key={i}
          index={i}
          speed={0.3 + i * 0.1}
          size={200 + i * 100}
          color={i % 2 === 0 ? 'electric-cyan' : 'electric-purple'}
          scrollYProgress={scrollYProgress}
        />
      ))}
    </div>
  );
}

function ParallaxBlob({
  index,
  speed,
  size,
  color,
  scrollYProgress,
}: {
  index: number;
  speed: number;
  size: number;
  color: 'electric-cyan' | 'electric-purple' | 'electric-neon';
  scrollYProgress: any;
}) {
  const y = useTransform(scrollYProgress, [0, 1], [0, -200 * speed]);
  const x = useTransform(scrollYProgress, [0, 1], [0, 50 * (index % 2 === 0 ? 1 : -1)]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.2, 1]);

  const colorClasses = {
    'electric-cyan': 'bg-electric-cyan/20',
    'electric-purple': 'bg-electric-purple/20',
    'electric-neon': 'bg-electric-neon/20',
  };

  const positions = [
    { top: '10%', left: '10%' },
    { top: '50%', right: '20%' },
    { bottom: '20%', left: '30%' },
    { top: '30%', right: '40%' },
    { bottom: '40%', left: '60%' },
  ];

  const position = positions[index % positions.length];

  return (
    <motion.div
      className={cn(
        'absolute rounded-full blur-3xl',
        colorClasses[color],
        'animate-float'
      )}
      style={{
        width: size,
        height: size,
        ...position,
        y,
        x,
        scale,
      }}
    />
  );
}
