'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatedCounter } from './AnimatedCounter';

interface AnimatedStatCardProps {
  value: string | number;
  label: string;
  index: number;
  delay?: number;
  description?: string;
}

/**
 * Animated stat card with counter animation
 * Fully accessible with ARIA labels
 */
export function AnimatedStatCard({
  value,
  label,
  index,
  delay = 0,
  description,
}: AnimatedStatCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const animationDelay = prefersReducedMotion ? 0 : delay + index * 50;

  return (
    <div
      ref={cardRef}
      className={`
        text-center
        transition-all duration-300
        ${isVisible 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 translate-y-6 scale-95'
        }
        hover:scale-105
      `}
      style={{
        transitionDelay: `${animationDelay}ms`,
      }}
      role="region"
      aria-labelledby={`stat-label-${index}`}
      aria-describedby={description ? `stat-desc-${index}` : undefined}
    >
      <AnimatedCounter
        value={value}
        className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2"
        aria-label={`${label}: ${value}`}
      />
      <div
        id={`stat-label-${index}`}
        className="text-sm md:text-base text-slate-600 dark:text-slate-400 font-medium"
      >
        {label}
      </div>
      {description && (
        <div
          id={`stat-desc-${index}`}
          className="text-xs text-slate-500 dark:text-slate-500 mt-1"
          aria-hidden="true"
        >
          {description}
        </div>
      )}
    </div>
  );
}
