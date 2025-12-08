'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Testimonial {
  name: string;
  role: string;
  company: string;
  image: string;
  quote: string;
  rating: number;
}

interface SocialProofProps {
  testimonials?: Testimonial[];
}

const defaultTestimonials: Testimonial[] = [
  {
    name: 'Sarah Chen',
    role: 'CTO',
    company: 'TechCorp',
    image: '👩‍💼',
    quote: 'Settler reduced our reconciliation time from 8 hours to 5 minutes. The API is incredibly easy to use and the accuracy is unmatched.',
    rating: 5,
  },
  {
    name: 'Michael Rodriguez',
    role: 'Head of Finance',
    company: 'EcomPlus',
    image: '👨‍💼',
    quote: 'We\'ve reconciled over 2M transactions with Settler. The real-time webhook support eliminated all our manual processes.',
    rating: 5,
  },
  {
    name: 'Emily Johnson',
    role: 'Engineering Lead',
    company: 'SaaSCo',
    image: '👩‍💻',
    quote: 'The developer experience is excellent. We integrated Settler in one afternoon and it\'s been running flawlessly for months.',
    rating: 5,
  },
];

export function SocialProof({ testimonials = defaultTestimonials }: SocialProofProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div ref={containerRef} className="py-16" role="region" aria-labelledby="testimonials-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2
            id="testimonials-heading"
            className="text-3xl md:text-4xl font-bold mb-4 text-foreground"
          >
            Loved by Developers & Finance Teams
          </h2>
          <p className="text-lg text-muted-foreground">
            Join thousands of companies using Settler for mission-critical reconciliation
          </p>
        </div>
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          role="list"
          aria-label="Customer testimonials"
        >
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className={cn(
                'bg-card border-border',
                'transition-all duration-700',
                isVisible
                  ? 'opacity-100 translate-y-0 scale-100'
                  : 'opacity-0 translate-y-8 scale-95',
                'hover:shadow-xl hover:-translate-y-2'
              )}
              style={{
                transitionDelay: prefersReducedMotion ? '0ms' : `${index * 150}ms`,
              }}
              role="listitem"
              aria-label={`Testimonial from ${testimonial.name}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4" role="img" aria-label={`${testimonial.rating} out of 5 stars`}>
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-lg" aria-hidden="true">
                      ★
                    </span>
                  ))}
                </div>
                <blockquote className="text-muted-foreground mb-6 italic">
                  <p>"{testimonial.quote}"</p>
                </blockquote>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-2xl"
                    aria-hidden="true"
                  >
                    {testimonial.image}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {testimonial.role}, {testimonial.company}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
