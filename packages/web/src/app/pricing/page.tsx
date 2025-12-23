/**
 * Pricing Page - Model 4: Volume + Exception Supervision
 * 
 * Simple, transparent pricing that scales with your business.
 * No feature matrices. No AI tokens. Just reconciliation volume + exceptions.
 */

'use client';

import Image from "next/image";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { PricingCalculator } from "@/components/pricing/PricingCalculator";

export default function Pricing() {
  const plans = [
    {
      name: 'Starter',
      price: '$99',
      description: 'System-level enforcement eliminates $106K-$724K+ in annual risk. Process 10k matches with deterministic guarantees.',
      reconciliationVolume: '10,000/month',
      exceptionRate: '1% included',
      example: '10k reconciliations = $99/month',
      valueProposition: 'Eliminates $106K-$724K+ in annual risk. 7-42x ROI compared to building in-house. Compliance-ready infrastructure.',
      limits: ['10,000 reconciliations/month', 'Scheduled jobs', 'Email support (24h)', 'Standard integrations', 'Basic audit trails'],
      cta: 'Start Free Trial',
      ctaLink: '/signup',
      popular: true,
    },
    {
      name: 'Growth',
      price: '$299',
      description: 'Compliance-ready infrastructure with SOC 2 Type II readiness. Handle 100k matches with complete audit trails and deterministic guarantees.',
      reconciliationVolume: '100,000/month',
      exceptionRate: '1% included',
      example: '100k reconciliations = $299/month',
      valueProposition: 'Eliminates $106K-$724K+ in annual risk. SOC 2 Type II infrastructure ready. Complete audit trails. Deterministic guarantees.',
      limits: ['100,000 reconciliations/month', 'Unlimited scheduled jobs', 'Priority support (4h)', 'Advanced integrations', 'SOC 2 ready', '1-year retention'],
      cta: 'Start Free Trial',
      ctaLink: '/signup',
      popular: false,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'Unlimited volume with dedicated support and custom compliance requirements.',
      reconciliationVolume: 'Unlimited',
      exceptionRate: 'Custom',
      example: 'Typically $2K-$10K/month',
      valueProposition: 'Full control with dedicated account manager. Custom integrations and 7-year retention.',
      limits: ['Unlimited reconciliations', 'Dedicated account manager', 'Custom integrations', '7-year retention', 'On-premise option', '99.99% SLA'],
      cta: 'Contact Sales',
      ctaLink: '/enterprise',
      popular: false,
    },
  ];

  const faqs = [
    {
      question: "What is a reconciliation?",
      answer:
        'A reconciliation matches one transaction to another (e.g., Stripe payment to Shopify order). Each match counts as one reconciliation. Reconciliation happens automatically—system-level enforcement, not human promises.',
    },
    {
      question: 'What are exceptions?',
      answer:
        'Exceptions are transactions that can\'t be matched automatically. Settler explains why they don\'t match. You only pay for exceptions requiring manual review ($0.10 each).',
    },
    {
      question: 'How does exception pricing work?',
      answer:
        'Each plan includes 1% exception rate with automatic explanations. Exceptions beyond 1% requiring manual review cost $0.10 each. Most are handled automatically.',
    },
    {
      question: 'Can I switch plans later?',
      answer:
        'Yes! Upgrade, downgrade, or cancel anytime. Changes take effect immediately. We\'ll prorate charges.',
    },
    {
      question: 'What payment methods do you accept?',
      answer:
        'We accept all major credit cards. ACH and wire transfers available for Enterprise plans.',
    },
    {
      question: 'Is there a free trial?',
      answer:
        'Yes! All paid plans include a 14-day free trial with full access—no credit card required. Try all features risk-free before committing.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      <Navigation />

      {/* Hero */}
      <section className="px-4 sm:px-6 lg:px-8 pt-8 pb-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
            Simple Pricing: Pay Per Match
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
            Pay per successful match. Manual review costs extra. Simple, transparent pricing that scales with your business.
          </p>
          
          {/* Hero Illustration */}
          <div className="relative w-full max-w-4xl mx-auto mt-8 mb-4">
            <div className="relative w-full max-w-4xl mx-auto">
              <Image
                src="/assets/marketing/hero-image-3.png"
                alt="Settler Pricing Overview - Visual representation of transparent, volume-based pricing model"
                width={1258}
                height={618}
                className="w-full h-auto object-contain md:object-cover drop-shadow-2xl rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm"
                priority
                sizes="100vw"
                style={{ maxWidth: '100%', height: 'auto' }}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1258px"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
              <CardDescription>Understanding reconciliation and exceptions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2 text-lg">What is a reconciliation?</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  A reconciliation is one successful match between transactions (e.g., Stripe payment to Shopify order). 
                  Each match counts as one reconciliation. Runs automatically—no manual work required.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-lg">What are exceptions?</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Exceptions are transactions that can't be matched automatically. Settler explains why they don't match. 
                  Most exceptions are handled automatically—you only pay for ones requiring manual review ($0.10 each).
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Example:</strong> Process 10,000 transactions/month. Settler matches automatically. 
                  If 100 (1%) require review: $99 (Starter) + (100 × $0.10) = $109/month.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={`relative ${plan.popular ? 'border-2 border-blue-500 shadow-xl scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white">Most Popular</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl break-words">{plan.name}</CardTitle>
                  <div className="flex items-baseline gap-2 mt-2 flex-wrap">
                    <span className="text-4xl font-bold break-words">{plan.price}</span>
                    {plan.price !== 'Custom' && (
                      <span className="text-slate-600 dark:text-slate-400 break-words">/month</span>
                    )}
                  </div>
                  <CardDescription className="break-words">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm font-semibold mb-1 break-words">Reconciliation Volume</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 break-words">{plan.reconciliationVolume}</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold mb-1 break-words">Exception Rate Included</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 break-words">{plan.exceptionRate}</div>
                    <div className="text-xs text-slate-500 mt-1 break-words">(Automatic explanations)</div>
                  </div>
                  {plan.valueProposition && (
                    <div className="pt-2 border-t">
                      <div className="text-sm font-medium text-slate-900 dark:text-white mb-2 break-words">
                        Value Delivered
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 break-words">
                        {plan.valueProposition}
                      </div>
                    </div>
                  )}
                  {plan.limits && plan.limits.length > 0 && (
                    <div className="pt-2 border-t">
                      <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 break-words">
                        Includes:
                      </div>
                      <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                        {plan.limits.map((limit, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                            <span className="break-words">{limit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="pt-2 border-t">
                    <div className="text-xs text-slate-600 dark:text-slate-400 break-words">{plan.example}</div>
                  </div>
                  <Button
                    asChild
                    className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    <Link href={plan.ctaLink}>
                      {plan.cta} <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Explanation */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>How Pricing Works</CardTitle>
              <CardDescription>Simple, transparent, scales with your business</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Base Pricing</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Each plan includes a monthly reconciliation volume. If you exceed your plan's volume, 
                  you'll be prompted to upgrade. This ensures you always have the capacity you need.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Exception Handling</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Reconciliation runs automatically. Settler explains mismatches automatically. 
                  Most exceptions are handled automatically—you only pay for ones requiring manual review ($0.10 each). 
                  Each plan includes 1% exception rate with automatic explanations.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Example</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Starter: 10,000 reconciliations/month ($99/month). 
                  Process 15,000? Upgrade to Growth ($299/month for 100,000/month).
                  If 100 exceptions require review (1%): $99 + (100 × $0.10) = $109/month.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Calculator */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Calculate Your Cost</h2>
          <PricingCalculator />
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index}>
                <h3 className="font-semibold mb-2">{faq.question}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
