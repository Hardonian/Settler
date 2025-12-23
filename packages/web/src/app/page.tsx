'use client';

import Link from "next/link";
import dynamic from "next/dynamic";
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { HeroAnimationWrapper } from "@/components/HeroAnimationWrapper";
import { TextReveal, TextRevealHeading } from "@/components/ui/TextReveal";
import { ParallaxBackground, ParallaxBlobs } from "@/components/ui/ParallaxBackground";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { RefreshCw, FileText, Calculator, ArrowRight } from "lucide-react";
import { analytics } from "@/lib/analytics";
import { useTrackCTA } from "@/lib/telemetry/hooks";
import { trackPageView } from "@/lib/analytics/conversion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Dynamic imports for heavy components
const AnimatedCodeBlock = dynamic(() => import("@/components/AnimatedCodeBlock").then(mod => ({ default: mod.AnimatedCodeBlock })), { ssr: false });
const EnhancedTrustBadges = dynamic(() => import("@/components/EnhancedTrustBadges").then(mod => ({ default: mod.EnhancedTrustBadges })), { ssr: true });
const UrgencyBanner = dynamic<{ variant?: 'default' | 'minimal' | 'prominent'; className?: string }>(() => import("@/components/marketing").then(mod => ({ default: mod.UrgencyBanner })), { 
  ssr: true,
  loading: () => null
});

export default function Home() {
  const trackCTA = useTrackCTA();

  useEffect(() => {
    analytics.trackPageView('/', {
      title: 'Settler - The API Infrastructure for Financial Evidence',
    });
    trackPageView('/', undefined, undefined).catch(() => {});
  }, []);

  const howItWorksSteps = [
    {
      number: 1,
      title: "Connect",
      description: "Link Stripe, Shopify, QuickBooks, and 50+ platforms",
      icon: RefreshCw,
    },
    {
      number: 2,
      title: "Match",
      description: "Automatic reconciliation with deterministic guarantees",
      icon: FileText,
    },
    {
      number: 3,
      title: "Verify",
      description: "Complete audit trail and exception handling",
      icon: Calculator,
    },
  ];

  const codeExample = `import { SettlerClient } from "@settler/sdk";

const client = new SettlerClient({ apiKey: "sk_live_..." });

// Start reconciliation
const reconciliation = await client.reconciliations.create({
  source: { adapter: "stripe" },
  target: { adapter: "database" },
  rules: { matching: [{ field: "amount", tolerance: 0.01 }] }
});`;

  return (
    <>
      <div 
        id="main-content"
        className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black"
        role="main"
        aria-label="Settler homepage"
      >
        <UrgencyBanner variant="minimal" />
        <Navigation />

        {/* Hero Section */}
        <section 
          className="relative pt-8 sm:pt-16 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[85vh] sm:min-h-[90vh] flex items-center"
          aria-labelledby="hero-heading"
        >
          <ParallaxBackground>
            <ParallaxBlobs count={3} />
          </ParallaxBackground>
          
          <div 
            className="absolute inset-0 bg-grid-slate-200 dark:bg-grid-slate-800 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.3))] -z-10"
            aria-hidden="true"
          />
          
          <div className="max-w-7xl mx-auto relative z-10">
            <HeroAnimationWrapper>
              <div className="text-center">
                <TextRevealHeading
                  as="h1"
                  id="hero-heading"
                  text="Reconciliation is a System Behavior, Not a Human Task"
                  className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent"
                  delay={0}
                  staggerDelay={0.02}
                  splitBy="words"
                />
                
                <TextReveal
                  text="Automatically match transactions across 50+ platforms with system-level enforcement."
                  className="text-xl md:text-2xl text-slate-700 dark:text-slate-300 mb-10 max-w-3xl mx-auto"
                  delay={0.2}
                  staggerDelay={0.01}
                  splitBy="words"
                />
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                  <Button 
                    size="lg" 
                    asChild 
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 sm:px-10 py-6 sm:py-7 text-lg sm:text-xl font-bold shadow-2xl hover:shadow-blue-500/30 transition-all transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    onClick={() => trackCTA('Start Free Trial', { location: 'hero' })}
                  >
                    <Link href="/signup" className="flex items-center justify-center gap-2">
                      <span>Start Free Trial</span>
                      <ArrowRight className="w-5 h-5" aria-hidden="true" />
                    </Link>
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    asChild 
                    className="w-full sm:w-auto px-6 sm:px-8 py-6 sm:py-7 text-base sm:text-lg border-2 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  >
                    <Link href="/console/playground">
                      Try Playground
                    </Link>
                  </Button>
                </div>

                {/* Credibility Strip - Trust Badges Only */}
                <div className="max-w-4xl mx-auto mb-12">
                  <EnhancedTrustBadges />
                </div>
              </div>
            </HeroAnimationWrapper>
          </div>
        </section>

        {/* How It Works - 3 Steps */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
                How It Works
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {howItWorksSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <SpotlightCard key={index} className="p-6 sm:p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                      {step.number}
                    </div>
                    <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">{step.title}</h3>
                    <p className="text-slate-600 dark:text-slate-300">{step.description}</p>
                  </SpotlightCard>
                );
              })}
            </div>
          </div>
        </section>

        {/* Product in Motion - Code Example */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
                Simple API, Powerful Results
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Get started in minutes with our typed SDKs
              </p>
            </div>
            <SpotlightCard className="p-0 overflow-hidden shadow-2xl">
              <AnimatedCodeBlock
                code={codeExample}
                title="Universal API Client"
                description="One client, all primitives"
                language="typescript"
              />
            </SpotlightCard>
          </div>
        </section>

        {/* Details Accordion */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-slate-900 dark:text-white">
              Details
            </h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="features">
                <AccordionTrigger className="text-lg font-semibold">
                  Core Features
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 dark:text-slate-300 space-y-2">
                  <p><strong>Deterministic Reconciliation:</strong> Same inputs produce same outputs, always. Match transactions across 50+ platforms.</p>
                  <p><strong>Receipts → JSON:</strong> Turn PDFs and images into structured financial data with AI-powered OCR.</p>
                  <p><strong>Currency Conversion:</strong> Precise unit and currency conversion without floating point errors.</p>
                  <p><strong>Feature Flags:</strong> Edge-evaluated feature flags with typed payloads and instant rollouts.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="integrations">
                <AccordionTrigger className="text-lg font-semibold">
                  Integrations
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 dark:text-slate-300">
                  <p>Connect with Stripe, Shopify, PayPal, QuickBooks, Square, WooCommerce, BigCommerce, Adyen, Xero, and 50+ other platforms.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="security">
                <AccordionTrigger className="text-lg font-semibold">
                  Security & Compliance
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 dark:text-slate-300">
                  <p>Enterprise-grade security with SOC 2 Type II readiness, bank-level encryption, and complete audit trails. ISO compliant infrastructure.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="pricing">
                <AccordionTrigger className="text-lg font-semibold">
                  Pricing
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 dark:text-slate-300">
                  <p>Simple, transparent pricing starting at $99/month. <Link href="/pricing" className="text-blue-600 dark:text-blue-400 hover:underline">View pricing details →</Link></p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
              Start your free trial today—no credit card required. Full access for 14 days.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                asChild 
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-6 text-lg font-bold shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
              >
                <Link href="/signup">
                  Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                asChild 
                className="w-full sm:w-auto px-8 py-6 text-lg border-2 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm"
              >
                <Link href="/console/playground">
                  Try Playground
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
