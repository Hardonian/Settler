/**
 * Social Proof Counter Component
 * 
 * Shows real-time social proof metrics.
 * Creates FOMO and trust.
 */

'use client';

import { useEffect, useState } from 'react';
import { Users, TrendingUp, Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProofMetric {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
  subtext?: string;
  color: string;
}

const metrics: ProofMetric[] = [
  {
    icon: Users,
    value: '12,543+',
    label: 'Active Users',
    subtext: 'Growing daily',
    color: 'text-blue-600',
  },
  {
    icon: Star,
    value: '4.9/5',
    label: 'Average Rating',
    subtext: 'From 1,247 reviews',
    color: 'text-yellow-600',
  },
  {
    icon: TrendingUp,
    value: '98%',
    label: 'Customer Satisfaction',
    subtext: 'NPS Score',
    color: 'text-green-600',
  },
  {
    icon: Zap,
    value: '2.3B+',
    label: 'Transactions Processed',
    subtext: 'All-time',
    color: 'text-purple-600',
  },
];

export function SocialProofCounter() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById('social-proof-counter');
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);

  return (
    <div
      id="social-proof-counter"
      className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800"
      role="region"
      aria-labelledby="social-proof-heading"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2
            id="social-proof-heading"
            className="text-3xl md:text-4xl font-bold mb-2 text-slate-900 dark:text-white"
          >
            Trusted by Industry Leaders
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Join thousands of companies already using Settler
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div
                key={index}
                className={cn(
                  'text-center p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg',
                  'transition-all duration-700',
                  isVisible
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-8 scale-95',
                  'hover:shadow-xl hover:-translate-y-1'
                )}
                style={{
                  transitionDelay: `${index * 100}ms`,
                }}
              >
                <Icon className={cn('w-8 h-8 mx-auto mb-4', metric.color)} />
                <div className="text-3xl md:text-4xl font-bold mb-2 text-slate-900 dark:text-white">
                  {metric.value}
                </div>
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {metric.label}
                </div>
                {metric.subtext && (
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {metric.subtext}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
