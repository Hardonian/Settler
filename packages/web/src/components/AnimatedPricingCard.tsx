'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PricingFeature {
  text: string;
}

interface PricingPlan {
  name: string;
  tagline: string;
  price: string;
  period: string;
  originalPrice?: string | null;
  description: string;
  features: PricingFeature[];
  cta: string;
  ctaLink: string;
  popular: boolean;
  badge: string;
}

interface AnimatedPricingCardProps {
  plan: PricingPlan;
  index: number;
}

/**
 * Animated pricing card with intersection observer
 * Accessible and performant
 */
export function AnimatedPricingCard({ plan, index }: AnimatedPricingCardProps) {
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

  const animationDelay = prefersReducedMotion ? 0 : index * 150;

  return (
    <Card
      ref={cardRef}
      className={`
        relative bg-white dark:bg-slate-900 border-2 transition-all duration-700
        ${plan.popular
          ? 'border-blue-500 dark:border-blue-600 shadow-2xl scale-105'
          : 'border-slate-200 dark:border-slate-800'
        }
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
      aria-labelledby={`plan-title-${index}`}
    >
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            {plan.badge}
          </Badge>
        </div>
      )}
      <CardHeader className="text-center pb-8">
        {!plan.popular && plan.badge && (
          <Badge className="mb-4 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {plan.badge}
          </Badge>
        )}
        <CardTitle
          id={`plan-title-${index}`}
          className="text-3xl font-bold mb-2 text-slate-900 dark:text-white"
        >
          {plan.name}
        </CardTitle>
        <CardDescription className="text-slate-600 dark:text-slate-400 mb-4">
          {plan.tagline}
        </CardDescription>
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {plan.price}
          </span>
          {plan.period && (
            <span className="text-slate-600 dark:text-slate-400">
              {plan.period}
            </span>
          )}
        </div>
        {plan.originalPrice && (
          <div className="mt-2">
            <span className="text-sm text-slate-500 line-through">
              {plan.originalPrice}/year
            </span>
          </div>
        )}
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-4">
          {plan.description}
        </p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4 mb-8" role="list" aria-label={`${plan.name} features`}>
          {plan.features.map((feature, featureIndex) => (
            <li key={featureIndex} className="flex items-start" role="listitem">
              <svg
                className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-slate-700 dark:text-slate-300">{feature.text}</span>
            </li>
          ))}
        </ul>
        <Button
          asChild
          className={`
            w-full transition-all transform hover:scale-105
            focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${plan.popular
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
              : 'bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700'
            }
          `}
          size="lg"
          aria-label={`${plan.cta} for ${plan.name} plan`}
        >
          <Link href={plan.ctaLink}>{plan.cta}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
