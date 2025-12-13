/**
 * Investor Pitch Section
 * 
 * Highlights key metrics and value proposition for investors.
 * Shows market opportunity, traction, and growth potential.
 */

'use client';

import { TrendingUp, DollarSign, Users, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { cn } from '@/lib/utils';

interface PitchPoint {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  metric: string;
  gradient: string;
}

const pitchPoints: PitchPoint[] = [
  {
    icon: DollarSign,
    title: '$50B+ Market Opportunity',
    description: 'Financial reconciliation software market growing at 12% CAGR',
    metric: 'TAM: $50B',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    icon: TrendingUp,
    title: '450% YoY Revenue Growth',
    description: 'Consistent month-over-month growth with strong unit economics',
    metric: '$2.4M ARR',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Users,
    title: '12.5K+ Active Users',
    description: 'Growing developer and finance team adoption',
    metric: '+247% YoY',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: Zap,
    title: '2.3B+ Transactions Processed',
    description: 'Proven at scale with enterprise customers',
    metric: '+1,200% YoY',
    gradient: 'from-orange-500 to-red-500',
  },
];

export function InvestorPitch() {
  return (
    <section
      className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden"
      role="region"
      aria-labelledby="investor-pitch-heading"
    >
      <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.1))]" />
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <Badge className="mb-6 bg-white/20 text-white border-white/30 backdrop-blur-sm">
            For Investors
          </Badge>
          <h2
            id="investor-pitch-heading"
            className="text-4xl md:text-6xl font-bold mb-6"
          >
            Built for Scale, Ready for Growth
          </h2>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Settler is positioned at the intersection of fintech infrastructure and developer tools—a massive, underserved market.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {pitchPoints.map((point, index) => {
            const Icon = point.icon;
            return (
              <SpotlightCard
                key={index}
                className={cn(
                  'p-8 bg-white/10 backdrop-blur-md border border-white/20 text-white',
                  'transition-all duration-500 hover:bg-white/20 hover:shadow-2xl hover:-translate-y-1'
                )}
              >
                <div
                  className={cn(
                    'w-16 h-16 rounded-2xl bg-gradient-to-br',
                    point.gradient,
                    'flex items-center justify-center mb-6 shadow-lg'
                  )}
                >
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold mb-2">{point.metric}</div>
                <h3 className="text-2xl font-bold mb-3">{point.title}</h3>
                <p className="text-blue-100 text-lg">{point.description}</p>
              </SpotlightCard>
            );
          })}
        </div>

        <div className="text-center">
          <Button
            asChild
            size="lg"
            className="bg-white text-blue-600 hover:bg-blue-50 px-10 py-7 text-xl font-bold shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105"
          >
            <Link href="/enterprise">
              Learn More for Investors
              <ArrowRight className="ml-2 w-6 h-6" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
