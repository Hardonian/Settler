/**
 * Value Proposition Section
 * 
 * Clear, compelling value statements for investors and subscribers.
 * Shows ROI, benefits, and competitive advantages.
 */

'use client';

import { ArrowRight, Zap, Shield, TrendingUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { cn } from '@/lib/utils';

interface ValueProp {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  benefit: string;
  gradient: string;
}

const valueProps: ValueProp[] = [
  {
    icon: Clock,
    title: 'Eliminate $106K-$724K+ Annual Risk',
    description: 'System-level enforcement eliminates revenue leakage, compliance failures, and operational uncertainty',
    benefit: 'Risk elimination, not time savings',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Shield,
    title: 'Deterministic Guarantees',
    description: 'Same inputs produce same outputs, always. Complete audit trails. Compliance-ready infrastructure',
    benefit: 'System-level guarantees, not human promises',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    icon: Zap,
    title: '5-Minute Integration, Compliance-Ready',
    description: 'Simple API integration with SOC 2 Type II infrastructure ready. Certification planned Q3 2026',
    benefit: 'Compliance-ready from day one',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: TrendingUp,
    title: 'System of Record, Not Productivity Tool',
    description: 'Process millions of transactions with deterministic guarantees. System-level enforcement scales organizationally',
    benefit: 'Source of truth that eliminates ambiguity',
    gradient: 'from-orange-500 to-red-500',
  },
];

export function ValueProposition() {
  return (
    <section
      className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900"
      role="region"
      aria-labelledby="value-props-heading"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2
            id="value-props-heading"
            className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white"
          >
            Why Companies Choose Settler
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Join hundreds of companies that have transformed their financial operations with Settler
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {valueProps.map((prop, index) => {
            const Icon = prop.icon;
            return (
              <SpotlightCard
                key={index}
                className={cn(
                  'p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1',
                  'group cursor-pointer'
                )}
              >
                <div
                  className={cn(
                    'w-16 h-16 rounded-2xl bg-gradient-to-br',
                    prop.gradient,
                    'flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform'
                  )}
                >
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">
                  {prop.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4 text-lg">
                  {prop.description}
                </p>
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold group-hover:gap-3 transition-all">
                  <span>{prop.benefit}</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </SpotlightCard>
            );
          })}
        </div>

        <div className="text-center">
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-6 text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
          >
            <Link href="/signup">
              Start Your Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
}
