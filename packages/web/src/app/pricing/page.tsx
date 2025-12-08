'use client';

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { TrustBadges } from "@/components/TrustBadges";
import { FeatureComparison } from "@/components/FeatureComparison";
import { ConversionCTA } from "@/components/ConversionCTA";
import { AnimatedPageWrapper } from "@/components/AnimatedPageWrapper";
import { AnimatedHero } from "@/components/AnimatedHero";
import { AnimatedPricingCard } from "@/components/AnimatedPricingCard";
import { AnimatedFAQ } from "@/components/AnimatedFAQ";

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const plans = [
    {
      name: 'Free',
      tagline: 'Perfect for getting started',
      price: '$0',
      period: 'forever',
      description: 'Open source components and basic features',
      features: [
        { text: '1,000 reconciliations/month' },
        { text: '2 platform adapters' },
        { text: '7-day log retention' },
        { text: 'Community support' },
        { text: 'MIT License (OSS)' },
        { text: 'Basic components' },
        { text: 'Security basics' },
        { text: 'Mobile & accessibility' },
      ],
      cta: 'Get Started',
      ctaLink: '/playground',
      popular: false,
      badge: 'OSS',
    },
    {
      name: 'Commercial',
      tagline: 'For growing businesses',
      price: billingCycle === 'monthly' ? '$99' : '$990',
      period: billingCycle === 'monthly' ? '/month' : '/year',
      originalPrice: billingCycle === 'annual' ? '$1,188' : null,
      description: 'Platform integrations and advanced features',
      features: [
        { text: '100,000 reconciliations/month' },
        { text: 'Unlimited adapters' },
        { text: '30-day log retention' },
        { text: 'Email support' },
        { text: 'Platform integrations (Shopify, Stripe, MCP)' },
        { text: 'Virtualization' },
        { text: 'Telemetry & analytics' },
        { text: 'Priority updates' },
        { text: 'Commercial License' },
      ],
      cta: 'Start Free Trial',
      ctaLink: '/playground',
      popular: true,
      badge: 'Most Popular',
    },
    {
      name: 'Enterprise',
      tagline: 'For large organizations',
      price: 'Custom',
      period: '',
      description: 'Full-featured with dedicated support',
      features: [
        { text: 'Unlimited reconciliations' },
        { text: 'Unlimited adapters' },
        { text: 'Unlimited log retention' },
        { text: 'Dedicated support (SLA)' },
        { text: 'SSO & SAML' },
        { text: 'Role-based access control (RBAC)' },
        { text: 'White-label options' },
        { text: 'Custom integrations' },
        { text: 'On-premise deployment' },
        { text: 'Dedicated account manager' },
        { text: 'Custom SLA' },
      ],
      cta: 'Contact Sales',
      ctaLink: '/enterprise',
      popular: false,
      badge: 'Enterprise',
    },
  ];

  const faqs = [
    {
      question: "What's the difference between OSS and Commercial?",
      answer:
        'OSS (Open Source) is free forever with MIT license, includes basic components and core protocol. Commercial adds platform integrations (Shopify, Stripe, MCP), virtualization, telemetry, and requires a subscription.',
    },
    {
      question: 'Can I switch plans later?',
      answer:
        'Yes! You can upgrade, downgrade, or cancel at any time. Changes take effect immediately, and we\'ll prorate any charges.',
    },
    {
      question: 'What payment methods do you accept?',
      answer:
        'We accept all major credit cards, ACH transfers, and wire transfers for Enterprise plans.',
    },
    {
      question: 'Is there a free trial?',
      answer:
        'Yes! All paid plans include a 14-day free trial. No credit card required to start.',
    },
  ];

  return (
    <AnimatedPageWrapper aria-label="Pricing page">
      <Navigation />

      {/* Hero Section */}
      <AnimatedHero
        badge="Simple, Transparent Pricing"
        title="Choose Your Plan"
        description="Start free, scale as you grow. All plans include our core reconciliation engine."
      />

      {/* Billing Toggle */}
      <section className="px-4 sm:px-6 lg:px-8 -mt-12 mb-8" aria-label="Billing cycle selector">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center gap-4">
            <span
              className={`text-sm ${
                billingCycle === 'monthly'
                  ? 'text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                billingCycle === 'annual' ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
              aria-label={`Switch to ${billingCycle === 'monthly' ? 'annual' : 'monthly'} billing`}
              aria-pressed={billingCycle === 'annual'}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-1'
                }`}
                aria-hidden="true"
              />
            </button>
            <span
              className={`text-sm ${
                billingCycle === 'annual'
                  ? 'text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Annual
            </span>
            {billingCycle === 'annual' && (
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                Save 17%
              </Badge>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section
        className="py-20 px-4 sm:px-6 lg:px-8"
        aria-labelledby="pricing-heading"
      >
        <div className="max-w-7xl mx-auto">
          <h2
            id="pricing-heading"
            className="sr-only"
          >
            Pricing Plans
          </h2>
          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            role="list"
            aria-label="Pricing plans"
          >
            {plans.map((plan, index) => (
              <div key={index} role="listitem">
                <AnimatedPricingCard plan={plan} index={index} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              Trusted & Secure
            </h2>
          </div>
          <TrustBadges />
        </div>
      </section>

      {/* Feature Comparison Table */}
      <FeatureComparison />

      {/* FAQ Section */}
      <AnimatedFAQ faqs={faqs} />

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <ConversionCTA
            title="Still have questions?"
            description="Our team is here to help you choose the right plan for your needs."
            primaryAction="Contact Support"
            primaryLink="/support"
            secondaryAction="Talk to Sales"
            secondaryLink="/enterprise"
            variant="gradient"
          />
        </div>
      </section>

      <Footer />
    </AnimatedPageWrapper>
  );
}
