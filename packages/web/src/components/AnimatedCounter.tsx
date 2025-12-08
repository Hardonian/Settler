'use client';

import { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  value: string | number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  'aria-label'?: string;
}

/**
 * Animated counter component for numbers
 * Accessible and performant with reduced motion support
 */
export function AnimatedCounter({
  value,
  duration = 2000,
  className = '',
  prefix = '',
  suffix = '',
  'aria-label': ariaLabel,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const counterRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (counterRef.current) {
      observer.observe(counterRef.current);
    }

    return () => {
      if (counterRef.current) {
        observer.unobserve(counterRef.current);
      }
    };
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    // Extract numeric value
    const numValue = typeof value === 'string' 
      ? parseFloat(value.replace(/[^0-9.]/g, '')) 
      : value;

    if (isNaN(numValue)) {
      // Non-numeric value, show immediately
      setDisplayValue(value as any);
      return;
    }

    if (prefersReducedMotion) {
      // Skip animation for reduced motion
      setDisplayValue(numValue);
      return;
    }

    const startValue = 0;
    const endValue = numValue;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (endValue - startValue) * easeOut;
      
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isVisible, value, duration, prefersReducedMotion]);

  // Format display value
  const formatValue = (val: number | string): string => {
    if (typeof val === 'string') return val;
    
    // Check if original value had special formatting
    const originalStr = String(value);
    if (originalStr.includes('%')) {
      return `${val.toFixed(1)}%`;
    }
    if (originalStr.includes('+')) {
      return `${Math.round(val)}+`;
    }
    if (originalStr.includes('<')) {
      return `<${Math.round(val)}ms`;
    }
    if (originalStr.includes('M')) {
      return `${(val / 1000000).toFixed(1)}M+`;
    }
    
    return Math.round(val).toLocaleString();
  };

  return (
    <div
      ref={counterRef}
      className={className}
      aria-label={ariaLabel || `${prefix}${formatValue(displayValue)}${suffix}`}
      role="text"
    >
      {prefix}
      {typeof displayValue === 'number' ? formatValue(displayValue) : displayValue}
      {suffix}
    </div>
  );
}
