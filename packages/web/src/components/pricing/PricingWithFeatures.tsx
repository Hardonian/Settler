/**
 * Enhanced Pricing Component
 * 
 * Shows pricing tiers with feature highlights and AI token management.
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface PricingTier {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  aiAnalysis: {
    included: number;
    period: 'day' | 'week' | 'month';
    addOnAvailable: boolean;
    overageAllowed: boolean;
  };
  highlight?: boolean;
  gradient: string;
}

const tiers: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    description: 'Great for getting started',
    features: [
      'Meaningful Changes Feed',
      'Basic Reconciliation',
      'Receipt Hash Chain',
      'Basic Alerts',
      '1 AI Analysis per week',
      'Community Support',
    ],
    aiAnalysis: {
      included: 1,
      period: 'week',
      addOnAvailable: false,
      overageAllowed: false,
    },
    gradient: 'from-slate-400 to-slate-600',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$99',
    description: 'For growing businesses',
    features: [
      'Everything in Free',
      'Advanced Reconciliation',
      'Priority Alerts',
      '10 AI Analyses per month',
      'AI Token Add-ons Available',
      'Overage Spending Allowed',
      'Email Support',
      'Feature Flags as Policy',
    ],
    aiAnalysis: {
      included: 10,
      period: 'month',
      addOnAvailable: true,
      overageAllowed: true,
    },
    highlight: true,
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large organizations',
    features: [
      'Everything in Pro',
      'Unlimited AI Analyses',
      'Base AI Token Allocation',
      'Custom AI Token Packages',
      'Advanced Judgment Layer',
      'Dedicated Support',
      'SLA-backed (Enterprise)',
      'Custom Integrations',
      'On-Premise Options',
    ],
    aiAnalysis: {
      included: -1, // Unlimited
      period: 'month',
      addOnAvailable: true,
      overageAllowed: true,
    },
    gradient: 'from-purple-500 to-pink-500',
  },
];

export function PricingWithFeatures() {
  const [hoveredTier, setHoveredTier] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const router = useRouter();

  const handleUpgrade = async (planCode: string) => {
    if (planCode === 'starter' || planCode === 'enterprise') {
      // Free plan: redirect to signup
      // Enterprise: redirect to contact
      if (planCode === 'enterprise') {
        router.push('/enterprise');
      } else {
        router.push('/signup');
      }
      return;
    }

    try {
      setLoadingPlan(planCode);
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planCode,
          successUrl: `${window.location.origin}/console/billing?success=true`,
          cancelUrl: `${window.location.origin}/pricing?canceled=true`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch {
      // eslint-disable-next-line no-console
      console.error('Failed to start checkout:', error);
      // Fallback to signup page
      router.push('/signup');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <section className="py-24 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            Pricing
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Choose Your Plan
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            All plans include core features. Upgrade for AI-powered insights and advanced capabilities.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier, index) => {
            const isHighlighted = tier.highlight;
            const aiIncluded = tier.aiAnalysis.included === -1 
              ? 'Unlimited' 
              : `${tier.aiAnalysis.included} per ${tier.aiAnalysis.period}`;

            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                onHoverStart={() => setHoveredTier(tier.id)}
                onHoverEnd={() => setHoveredTier(null)}
                className={isHighlighted ? 'md:-mt-4 md:mb-4' : ''}
              >
                <Card
                  className={`relative h-full transition-all duration-300 ${
                    isHighlighted
                      ? 'border-2 border-blue-500 shadow-2xl scale-105'
                      : hoveredTier === tier.id
                      ? 'shadow-xl scale-102'
                      : 'shadow-lg'
                  }`}
                >
                  {isHighlighted && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${tier.gradient} opacity-0 transition-opacity duration-300 ${
                      hoveredTier === tier.id ? 'opacity-5' : ''
                    }`}
                  />

                  <CardHeader className="relative z-10">
                    <CardTitle className="text-2xl mb-2">{tier.name}</CardTitle>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-4xl font-bold">{tier.price}</span>
                      {tier.price !== 'Custom' && (
                        <span className="text-slate-600 dark:text-slate-400">/month</span>
                      )}
                    </div>
                    <CardDescription>{tier.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="relative z-10">
                    {/* AI Analysis Highlight */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <span className="font-semibold text-indigo-900 dark:text-indigo-300">
                          AI Analysis
                        </span>
                      </div>
                      <p className="text-sm text-indigo-800 dark:text-indigo-400 mb-2">
                        {aiIncluded} included
                      </p>
                      {tier.aiAnalysis.addOnAvailable && (
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-xs">
                            Add-ons Available
                          </Badge>
                          {tier.aiAnalysis.overageAllowed && (
                            <Badge variant="outline" className="text-xs">
                              Overage Allowed
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Features List */}
                    <ul className="space-y-3 mb-6">
                      {tier.features.map((feature, idx) => (
                        <motion.li
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.1 + idx * 0.05 }}
                          className="flex items-start gap-2"
                        >
                          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </motion.li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => handleUpgrade(tier.id)}
                      disabled={loadingPlan === tier.id}
                      className={`w-full ${
                        isHighlighted
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                          : ''
                      }`}
                      variant={isHighlighted ? 'default' : 'outline'}
                    >
                      {loadingPlan === tier.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : tier.id === 'enterprise' ? (
                        'Contact Sales'
                      ) : tier.id === 'free' ? (
                        'Get Started'
                      ) : (
                        'Upgrade Now'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-slate-600 dark:text-slate-400">
            All plans include core features. AI Analysis tokens can be purchased as add-ons or used as overage on Growth+ plans.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
