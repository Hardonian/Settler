/**
 * Pricing Page - Simple, transparent pricing
 */

'use client';

import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { PricingCalculator } from "@/components/pricing/PricingCalculator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Pricing() {
  const plans = [
    {
      name: 'Starter',
      price: '$99',
      volume: '10,000/month',
      exceptionRate: '1% included',
      limits: ['10,000 reconciliations/month', 'Scheduled jobs', 'Email support (24h)', 'Standard integrations', 'Basic audit trails'],
      cta: 'Start Free Trial',
      ctaLink: '/signup',
      popular: true,
    },
    {
      name: 'Growth',
      price: '$299',
      volume: '100,000/month',
      exceptionRate: '1% included',
      limits: ['100,000 reconciliations/month', 'Unlimited scheduled jobs', 'Priority support (4h)', 'Advanced integrations', 'SOC 2 ready', '1-year retention'],
      cta: 'Start Free Trial',
      ctaLink: '/signup',
      popular: false,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      volume: 'Unlimited',
      exceptionRate: 'Custom',
      limits: ['Unlimited reconciliations', 'Dedicated account manager', 'Custom integrations', '7-year retention', 'On-premise option', '99.99% SLA'],
      cta: 'Contact Sales',
      ctaLink: '/enterprise',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      <Navigation />

      {/* Hero */}
      <section className="px-4 sm:px-6 lg:px-8 pt-8 pb-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
            Simple Pricing
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
            Pay per successful match. Transparent pricing that scales with your business.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={`relative ${plan.popular ? 'border-2 border-blue-500 shadow-xl' : ''}`}
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
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm font-semibold mb-1">Volume</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">{plan.volume}</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold mb-1">Exceptions</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">{plan.exceptionRate}</div>
                  </div>
                  <div className="pt-2 border-t">
                    <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                      {plan.limits.map((limit, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                          <span>{limit}</span>
                        </li>
                      ))}
                    </ul>
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

      {/* Pricing Calculator */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Calculate Your Cost</h2>
          <PricingCalculator />
        </div>
      </section>

      {/* Details Accordion */}
      <section className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Details</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="how-it-works">
              <AccordionTrigger className="text-lg font-semibold">
                How It Works
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 dark:text-slate-300 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">What is a reconciliation?</h3>
                  <p className="text-sm">
                    A reconciliation matches one transaction to another (e.g., Stripe payment to Shopify order). 
                    Each match counts as one reconciliation. Runs automatically.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">What are exceptions?</h3>
                  <p className="text-sm">
                    Exceptions are transactions that can't be matched automatically. 
                    You only pay for exceptions requiring manual review ($0.10 each). Most are handled automatically.
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Example:</strong> Process 10,000 transactions/month. 
                    If 100 (1%) require review: $99 + (100 × $0.10) = $109/month.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="pricing-details">
              <AccordionTrigger className="text-lg font-semibold">
                Pricing Details
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 dark:text-slate-300 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Base Pricing</h3>
                  <p className="text-sm">
                    Each plan includes a monthly reconciliation volume. If you exceed your plan's volume, 
                    you'll be prompted to upgrade.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Exception Handling</h3>
                  <p className="text-sm">
                    Each plan includes 1% exception rate with automatic explanations. 
                    Exceptions beyond 1% requiring manual review cost $0.10 each.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq">
              <AccordionTrigger className="text-lg font-semibold">
                Frequently Asked Questions
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 dark:text-slate-300 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Can I switch plans later?</h3>
                  <p className="text-sm">Yes! Upgrade, downgrade, or cancel anytime. Changes take effect immediately.</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Is there a free trial?</h3>
                  <p className="text-sm">Yes! All paid plans include a 14-day free trial with full access—no credit card required.</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
                  <p className="text-sm">We accept all major credit cards. ACH and wire transfers available for Enterprise plans.</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <Footer />
    </div>
  );
}
