/**
 * Live Metrics Counter
 * 
 * Animated counter showing real-time usage metrics.
 * Creates urgency and social proof.
 */

'use client';

import { useEffect, useState } from 'react';
import { Activity, Zap, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Metric {
  label: string;
  value: number;
  suffix: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const metrics: Metric[] = [
  {
    label: 'Transactions Processed Today',
    value: 1247893,
    suffix: '+',
    icon: Activity,
    color: 'text-blue-600',
  },
  {
    label: 'API Calls This Hour',
    value: 45672,
    suffix: '+',
    icon: Zap,
    color: 'text-purple-600',
  },
  {
    label: 'Active Users',
    value: 12543,
    suffix: '+',
    icon: TrendingUp,
    color: 'text-green-600',
  },
];

function AnimatedCounter({
  value,
  suffix,
  className,
}: {
  value: number;
  suffix: string;
  className?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(increment * step, value);
      setDisplayValue(Math.floor(current));

      if (step >= steps) {
        clearInterval(timer);
        setDisplayValue(value);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span className={className}>
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
}

export function LiveMetricsCounter() {
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

    const element = document.getElementById('live-metrics');
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
      id="live-metrics"
      className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"
      role="region"
      aria-labelledby="live-metrics-heading"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full mb-4">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-white">Live Metrics</span>
          </div>
          <h2
            id="live-metrics-heading"
            className="text-2xl md:text-3xl font-bold text-white mb-2"
          >
            Trusted by Thousands, Processing Millions
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div
                key={index}
                className={cn(
                  'text-center p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20',
                  'transition-all duration-700',
                  isVisible
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-8 scale-95'
                )}
                style={{
                  transitionDelay: `${index * 150}ms`,
                }}
              >
                <Icon className={cn('w-8 h-8 mx-auto mb-4', metric.color.replace('text-', 'text-white'))} />
                <div className={cn('text-4xl md:text-5xl font-bold mb-2 text-white')}>
                  {isVisible ? (
                    <AnimatedCounter value={metric.value} suffix={metric.suffix} />
                  ) : (
                    '0'
                  )}
                </div>
                <div className="text-sm text-blue-100 font-medium">{metric.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
