'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AnimatedFeatureCardProps {
  icon: string;
  title: string;
  description: string;
  index: number;
  delay?: number;
}

/**
 * Animated feature card with intersection observer
 * Accessible and performant
 */
export function AnimatedFeatureCard({
  icon,
  title,
  description,
  index,
  delay = 0,
}: AnimatedFeatureCardProps) {
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

  const animationDelay = prefersReducedMotion ? 0 : delay + index * 100;

  return (
    <Card
      ref={cardRef}
      className={`
        bg-white dark:bg-slate-900 
        border-slate-200 dark:border-slate-800 
        transition-all duration-500
        ${isVisible 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 translate-y-8 scale-95'
        }
        hover:shadow-xl hover:shadow-blue-500/10
        hover:-translate-y-2
        focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2
      `}
      style={{
        transitionDelay: `${animationDelay}ms`,
      }}
      role="article"
      aria-labelledby={`feature-title-${index}`}
    >
      <CardHeader>
        <div 
          className="text-4xl mb-4 transform transition-transform duration-300 hover:scale-110"
          role="img"
          aria-label={`${title} icon`}
        >
          {icon}
        </div>
        <CardTitle 
          id={`feature-title-${index}`}
          className="text-slate-900 dark:text-white"
        >
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-slate-600 dark:text-slate-300">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}
