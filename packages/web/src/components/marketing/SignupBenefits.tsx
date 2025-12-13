/**
 * Signup Benefits Component
 * 
 * Shows immediate benefits of signing up.
 * Creates urgency and value perception.
 */

'use client';

import { CheckCircle2, Zap, Shield, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';

const benefits = [
  {
    icon: Gift,
    text: '14-day free trial',
    highlight: true,
  },
  {
    icon: Shield,
    text: 'No credit card required',
    highlight: true,
  },
  {
    icon: Zap,
    text: 'Full access to all features',
    highlight: false,
  },
  {
    icon: CheckCircle2,
    text: 'Cancel anytime',
    highlight: false,
  },
];

export function SignupBenefits() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
      {benefits.map((benefit, index) => {
        const Icon = benefit.icon;
        return (
          <div
            key={index}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full',
              benefit.highlight
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="font-medium">{benefit.text}</span>
          </div>
        );
      })}
    </div>
  );
}
