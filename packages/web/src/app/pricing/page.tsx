/**
 * Pricing Page - Model 4: Volume + Exception Supervision
 * 
 * Simple, transparent pricing that scales with reliance.
 * No feature matrices. No AI tokens. Just reconciliation volume + exceptions.
 */

'use client';

import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Pricing() {
  const plans = [
    {
      name: 'Starter',
      price: '$0',
      description: 'First 10,000 reconciliations free',
      reconciliationVolume: '10,000/month',
      exceptionRate: '1% included',
      example: '10k reconciliations = $0/month',
      cta: 'Get Started',
      ctaLink: '/signup',
      popular: false,
    },
    {
      name: 'Growth',
      price: '$900',
      description: 'For growing businesses',
      reconciliationVolume: '100,000/month',
      exceptionRate: '1% included',
      example: '100k reconciliations = $900/month',
      cta: 'Start Free Trial',
      ctaLink: '/signup',
      popular: true,
    },
    {
      name: 'Scale',
      price: '$9,900',
      description: 'For high-volume operations',
      reconciliationVolume: '1,000,000/month',
      exceptionRate: '1% included',
      example: '1M reconciliations = $9,900/month',
      cta: 'Start Free Trial',
      ctaLink: '/signup',
      popular: false,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'Custom volume and exception thresholds',
      reconciliationVolume: 'Custom',
      exceptionRate: 'Custom',
      example: 'Volume discounts available',
      cta: 'Contact Sales',
      ctaLink: '/enterprise',
      popular: false,
    },
  ];

  const faqs = [
    {
      question: "What is a reconciliation?",
      answer:
        'A reconciliation matches transactions between two platforms (e.g., Shopify orders with Stripe payments). Reconciliation runs automatically—no manual work required.',
    },
    {
      question: 'What are exceptions?',
      answer:
        'Exceptions are mismatches that require human review. The system explains all mismatches automatically. You only pay for exceptions that require your attention ($0.10 each).',
    },
    {
      question: 'How does exception pricing work?',
      answer:
        'Each plan includes 1% exception rate (automatic explanations). If more exceptions require review, you pay $0.10 per exception. Most exceptions are handled automatically.',
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
        'Yes! Starter plan includes 10,000 reconciliations free forever. Paid plans include a 14-day free trial.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      <Navigation />

      {/* Hero */}
      <section className="px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
            Pay per reconciliation. Exceptions requiring review cost extra. That's it.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-left max-w-2xl mx-auto">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>How it works:</strong> Reconciliation runs automatically. You pay $0.01 per reconciliation. 
              If exceptions require human review, they cost $0.10 each. The system explains mismatches automatically—you only pay for exceptions that need your attention.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.price !== 'Custom' && (
                      <span className="text-slate-600 dark:text-slate-400">/month</span>
                    )}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm font-semibold mb-1">Reconciliation Volume</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">{plan.reconciliationVolume}</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold mb-1">Exception Rate Included</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">{plan.exceptionRate}</div>
                    <div className="text-xs text-slate-500 mt-1">(Automatic explanations)</div>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="text-xs text-slate-600 dark:text-slate-400">{plan.example}</div>
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
              <CardDescription>Simple, transparent, scales with your reliance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Base Pricing</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  $0.01 per reconciliation. Each plan includes a base volume. Over that volume, you pay $0.01 per reconciliation.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Exception Supervision</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Reconciliation runs automatically. The system explains mismatches automatically. 
                  If an exception requires human review, it costs $0.10. Most exceptions are handled automatically—you only pay for exceptions that need your attention.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Example</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Growth plan: 100,000 reconciliations/month included ($900/month). 
                  If you process 120,000 reconciliations, you pay $900 + (20,000 × $0.01) = $1,100/month.
                  If 1,500 exceptions require review (1.25% rate), you pay $1,100 + (500 × $0.10) = $1,150/month.
                </p>
              </div>
            </CardContent>
          </Card>
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
