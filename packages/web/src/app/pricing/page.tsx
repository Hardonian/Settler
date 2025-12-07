"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { FeatureComparison } from "@/components/FeatureComparison";
import { ConversionCTA } from "@/components/ConversionCTA";
import { AnimatedPageWrapper } from "@/components/AnimatedPageWrapper";
import { AnimatedHero } from "@/components/AnimatedHero";
import { AnimatedPricingCard } from "@/components/AnimatedPricingCard";
import { AnimatedFAQ } from "@/components/AnimatedFAQ";
import { EdgeAIMarketingSection } from "@/components/EdgeAIMarketingSection";
import { FAQSchema } from "@/components/StructuredData";
import { PurchaseScrutiny } from "@/components/PurchaseScrutiny";
import { PaymentTypes } from "@/components/PaymentTypes";

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  const plans = [
    {
      name: "Free",
      tagline: "Perfect for small businesses",
      price: "$0",
      period: "forever",
      description: "Basic features for small transaction volumes",
      features: [
        { text: "Up to 1,000 transactions/month" },
        { text: "Connect 2 platforms (e.g., Shopify + Stripe)" },
        { text: "Basic matching and reports" },
        { text: "7-day transaction history" },
        { text: "Community support" },
        { text: "Basic cookbooks and workflows" },
      ],
      cta: "Get Started",
      ctaLink: "/signup",
      popular: false,
      badge: "Free Forever",
    },
    {
      name: "Commercial",
      tagline: "For growing businesses",
      price: billingCycle === "monthly" ? "$99" : "$990",
      period: billingCycle === "monthly" ? "/month" : "/year",
      originalPrice: billingCycle === "annual" ? "$1,188" : null,
      description: "Everything you need to scale your operations",
      features: [
        { text: "Up to 100,000 transactions/month" },
        { text: "Connect unlimited platforms" },
        { text: "All advanced features unlocked" },
        { text: "Event-driven webhook reconciliation" },
        { text: "Advanced analytics and dashboards" },
        { text: "Full cookbook library" },
        { text: "30-day transaction history" },
        { text: "Email support with priority response" },
        { text: "Scheduled reconciliation jobs" },
        { text: "Edge AI available (add-on)" },
      ],
      cta: "Start Free Trial",
      ctaLink: "/signup",
      popular: true,
      badge: "Most Popular",
    },
    {
      name: "Enterprise",
      tagline: "For large organizations",
      price: "Custom",
      period: "",
      description: "Full-featured with dedicated support",
      features: [
        { text: "Unlimited reconciliations" },
        { text: "Unlimited adapters" },
        { text: "Unlimited log retention" },
        { text: "Dedicated support (SLA)" },
        { text: "Custom integrations" },
        { text: "Dedicated account manager" },
        { text: "Custom SLA" },
        { text: "Edge AI included" },
        { text: "Extended log retention (up to 7 years)" },
        { text: "Priority feature requests" },
      ],
      cta: "Contact Sales",
      ctaLink: "/enterprise",
      popular: false,
      badge: "Enterprise",
    },
  ];

  const faqs = [
    {
      question: "What's the difference between Free and Commercial?",
      answer:
        "Free tier is perfect for small businesses with up to 1,000 transactions per month. Commercial unlocks up to 100,000 transactions/month, all advanced features, event-driven webhooks, and email support.",
    },
    {
      question: "Can I switch plans later?",
      answer:
        "Yes! You can upgrade, downgrade, or cancel at any time. Changes take effect immediately, and we'll prorate any charges.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit cards, ACH transfers, and wire transfers for Enterprise plans.",
    },
    {
      question: "Is there a free trial?",
      answer:
        "Yes! Start your 30-day free trial with full access to all features. No credit card required. Cancel anytime during the trial.",
    },
    {
      question: "What happens if I exceed my transaction limit?",
      answer:
        "If you exceed your plan's transaction limit, we'll notify you and offer options to upgrade or purchase additional capacity. Overage pricing is $0.001 per additional transaction, or you can upgrade to a higher plan.",
    },
    {
      question: "How does the 30-day free trial work?",
      answer:
        "Your 30-day free trial gives you full access to all features, unlimited transactions, and all platform adapters. No credit card required. After 30 days, your account automatically converts to the Free plan (1,000 transactions/month) unless you upgrade to a paid plan.",
    },
    {
      question: "Can I cancel anytime?",
      answer:
        "Yes, you can cancel your subscription at any time. There are no cancellation fees or long-term contracts. You'll continue to have access until the end of your billing period.",
    },
    {
      question: "Do you offer discounts for annual plans?",
      answer:
        "Yes! Annual plans save you 17% compared to monthly billing. You can switch between monthly and annual billing at any time.",
    },
  ];

  return (
    <AnimatedPageWrapper aria-label="Pricing page">
      <FAQSchema faqs={faqs} />
      <Navigation />

      {/* Hero Section */}
      <AnimatedHero
        badge="Simple, Transparent Pricing"
        title="Start Your 30-Day Free Trial Today"
        description="Full access to all features, unlimited transactions, and all platform adapters. No credit card required. Cancel anytime during your trial."
      />

      {/* Billing Toggle */}
      <section className="px-4 sm:px-6 lg:px-8 -mt-12 mb-12" aria-label="Billing cycle selector">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center gap-4">
            <span
              className={`text-sm ${
                billingCycle === "monthly"
                  ? "text-slate-900 dark:text-white font-semibold"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                billingCycle === "annual" ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
              }`}
              aria-label={`Switch to ${billingCycle === "monthly" ? "annual" : "monthly"} billing`}
              aria-pressed={billingCycle === "annual"}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingCycle === "annual" ? "translate-x-6" : "translate-x-1"
                }`}
                aria-hidden="true"
              />
            </button>
            <span
              className={`text-sm ${
                billingCycle === "annual"
                  ? "text-slate-900 dark:text-white font-semibold"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Annual
            </span>
            {billingCycle === "annual" && (
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                Save 17%
              </Badge>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8" aria-labelledby="pricing-heading">
        <div className="max-w-7xl mx-auto">
          <h2 id="pricing-heading" className="sr-only">
            Pricing Plans
          </h2>
          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
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

      {/* Trust & Security - Right Before Purchase Decision */}
      <PurchaseScrutiny />

      {/* Payment Methods - Show Options Before Checkout */}
      <PaymentTypes />

      {/* Feature Comparison Table */}
      <FeatureComparison />

      {/* Edge AI Section */}
      <EdgeAIMarketingSection variant="default" />

      {/* FAQ Section */}
      <AnimatedFAQ faqs={faqs} />

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <ConversionCTA
            title="Ready to Get Started?"
            description="Start your 30-day free trial with full access to all features. No credit card required. Or talk to our team about enterprise plans."
            primaryAction="Start Free Trial"
            primaryLink="/signup"
            secondaryAction="Contact Sales"
            secondaryLink="/enterprise"
            variant="gradient"
          />
        </div>
      </section>

      <Footer />
    </AnimatedPageWrapper>
  );
}
