'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface AnimatedHeroProps {
  badge?: string;
  title: string | ReactNode;
  description: string;
  className?: string;
}

/**
 * Animated hero section component
 * Consistent hero animations across all pages
 */
export function AnimatedHero({
  badge,
  title,
  description,
  className = '',
}: AnimatedHeroProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const animationClass = prefersReducedMotion
    ? 'opacity-100 translate-y-0'
    : mounted
    ? 'opacity-100 translate-y-0'
    : 'opacity-0 translate-y-4';

  return (
    <section
      className={`relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden ${className}`}
      aria-labelledby="hero-heading"
    >
      {/* Animated background gradient */}
      <div
        className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10"
        aria-hidden="true"
      />
      <div className="max-w-7xl mx-auto text-center">
        {badge && (
          <Badge
            className={`mb-6 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800 transition-all duration-300 ${animationClass}`}
            aria-label="Page category badge"
          >
            {badge}
          </Badge>
        )}
        <h1
          id="hero-heading"
          className={cn(
            'text-5xl md:text-7xl font-bold mb-6',
            'bg-gradient-to-r from-primary-600 via-electric-indigo to-electric-purple',
            'bg-clip-text text-transparent',
            'transition-all duration-300',
            animationClass
          )}
          style={{ transitionDelay: prefersReducedMotion ? '0ms' : '100ms' }}
        >
          {title}
        </h1>
        <p
          className={cn(
            'text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto',
            'transition-all duration-300',
            animationClass
          )}
          style={{ transitionDelay: prefersReducedMotion ? '0ms' : '150ms' }}
        >
          {description}
        </p>
      </div>
    </section>
  );
}
