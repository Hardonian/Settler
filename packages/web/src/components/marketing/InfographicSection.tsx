/**
 * Infographic Section Component
 * 
 * Displays infographics for reconciliation flow, pricing comparison, and ROI.
 */

'use client';

import { SafeImage } from '@/components/SafeImage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';

interface Infographic {
  title: string;
  description: string;
  image: string;
  alt: string;
}

const infographics: Infographic[] = [
  {
    title: 'Reconciliation Flow',
    description: 'See how Settler matches transactions across platforms with deterministic algorithms',
    image: '/assets/infographics/reconciliation-flow.svg',
    alt: 'Settler reconciliation flow diagram showing transaction matching process',
  },
  {
    title: 'Pricing Comparison',
    description: 'Compare Settler pricing with manual reconciliation costs',
    image: '/assets/infographics/pricing-comparison.svg',
    alt: 'Pricing comparison chart showing Settler vs manual reconciliation',
  },
  {
    title: 'ROI Analysis',
    description: 'Understand the return on investment from automating reconciliation',
    image: '/assets/infographics/roi-comparison.svg',
    alt: 'ROI comparison chart showing savings from using Settler',
  },
];

export function InfographicSection() {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
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

  return (
    <section
      ref={containerRef}
      className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900"
      role="region"
      aria-labelledby="infographics-heading"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2
            id="infographics-heading"
            className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white"
          >
            Visualize the Value
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            See how Settler transforms your financial operations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {infographics.map((infographic, index) => (
            <Card
              key={index}
              className={cn(
                'overflow-hidden border-2 border-slate-200 dark:border-slate-800',
                'transition-all duration-700',
                isVisible
                  ? 'opacity-100 translate-y-0 scale-100'
                  : 'opacity-0 translate-y-8 scale-95',
                'hover:shadow-xl hover:-translate-y-2'
              )}
              style={{
                transitionDelay: `${index * 150}ms`,
              }}
            >
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                  {infographic.title}
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  {infographic.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative w-full aspect-video bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                  <SafeImage
                    src={infographic.image}
                    alt={infographic.alt}
                    width={800}
                    height={450}
                    className="object-contain w-full h-full"
                    fallbackTitle={infographic.title}
                    fallbackCaption={infographic.description}
                    unoptimized
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
