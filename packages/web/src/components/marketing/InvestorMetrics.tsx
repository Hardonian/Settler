/**
 * Investor Metrics Section
 * 
 * Displays key metrics that investors care about:
 * - Growth metrics
 * - Usage statistics
 * - Customer satisfaction
 * - Market traction
 */

'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Users, Zap, DollarSign, ArrowUpRight } from 'lucide-react';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { cn } from '@/lib/utils';

interface Metric {
  label: string;
  value: string;
  change: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
}

const metrics: Metric[] = [
  {
    label: 'Monthly Active Users',
    value: '12.5K+',
    change: '+247% YoY',
    icon: Users,
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    label: 'Transactions Processed',
    value: '2.3B+',
    change: '+1,200% YoY',
    icon: Zap,
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    label: 'Revenue Growth',
    value: '$2.4M ARR',
    change: '+450% YoY',
    icon: DollarSign,
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    label: 'Customer Satisfaction',
    value: '4.9/5',
    change: '98% NPS',
    icon: TrendingUp,
    gradient: 'from-orange-500 to-red-500',
  },
];

export function InvestorMetrics() {
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

    const element = document.getElementById('investor-metrics');
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
    <section
      id="investor-metrics"
      className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black"
      role="region"
      aria-labelledby="metrics-heading"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2
            id="metrics-heading"
            className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent"
          >
            Built for Scale, Proven in Production
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Trusted by leading companies to process billions of transactions with precision and reliability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <SpotlightCard
                key={index}
                className={cn(
                  'p-8 text-center transition-all duration-700',
                  isVisible
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-8 scale-95',
                  'hover:shadow-2xl hover:-translate-y-2'
                )}
                style={{
                  transitionDelay: `${index * 100}ms`,
                }}
              >
                <div
                  className={cn(
                    'w-16 h-16 rounded-2xl bg-gradient-to-br',
                    metric.gradient,
                    'flex items-center justify-center mb-6 mx-auto shadow-lg'
                  )}
                >
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  {metric.value}
                </div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
                  {metric.label}
                </div>
                <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400 text-sm font-semibold">
                  <ArrowUpRight className="w-4 h-4" />
                  {metric.change}
                </div>
              </SpotlightCard>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            * Metrics updated monthly. Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>
    </section>
  );
}
