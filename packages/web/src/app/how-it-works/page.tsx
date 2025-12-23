"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { AnimatedPageWrapper } from "@/components/AnimatedPageWrapper";
import { AnimatedHero } from "@/components/AnimatedHero";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { TextReveal, TextRevealHeading } from "@/components/ui/TextReveal";
import { ParallaxBackground, ParallaxBlobs } from "@/components/ui/ParallaxBackground";
import { ConversionCTA } from "@/components/ConversionCTA";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SafeImage } from "@/components/SafeImage";
import {
  Zap,
  Plug,
  Play,
  CheckCircle2,
  Code2,
  BarChart3,
  Shield,
  Clock,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  {
    number: 1,
    title: "Connect Your Platforms",
    description:
      "Connect Shopify, Stripe, PayPal, QuickBooks, or any of our 10+ pre-built adapters. Secure API key storage with encryption at rest.",
    icon: Plug,
    gradient: "from-blue-500 to-cyan-500",
    details: [
      "Choose your source platform (e.g., Shopify)",
      "Choose your target platform (e.g., Stripe)",
      "Securely store API credentials",
      "Test connection in real-time",
    ],
  },
  {
    number: 2,
    title: "Define Matching Rules",
    description:
      "Set up intelligent matching rules: exact match, fuzzy match, or custom logic. Our AI suggests optimal rules based on your data.",
    icon: Code2,
    gradient: "from-purple-500 to-pink-500",
    details: [
      "Match by order ID, amount, date, or custom fields",
      "Set tolerance levels for amounts",
      "Configure conflict resolution strategies",
      "Preview matches before running",
    ],
  },
  {
    number: 3,
    title: "Run Reconciliation",
    description:
      "Process millions of transactions in minutes. Real-time webhooks or scheduled batch processing. Edge AI for <10ms latency.",
    icon: Play,
    gradient: "from-green-500 to-emerald-500",
    details: [
      "Run on-demand or schedule automatic runs",
      "Process transactions in parallel",
      "Real-time progress tracking",
      "Get notified via webhooks",
    ],
  },
  {
    number: 4,
    title: "Review Results",
    description:
      "99.7% accuracy with complete visibility. See matched, unmatched, and conflicts. Full audit trail for compliance.",
    icon: BarChart3,
    gradient: "from-orange-500 to-red-500",
    details: [
      "View detailed match reports",
      "Export to CSV, JSON, or PDF",
      "Track reconciliation history",
      "Generate compliance reports",
    ],
  },
];

const benefits = [
  {
    icon: Clock,
    title: "Save 10+ Hours Per Week",
    description: "Automate manual reconciliation work",
    stat: "10+ hours",
  },
  {
    icon: TrendingUp,
    title: "99.7% Accuracy",
    description: "Eliminate human error",
    stat: "99.7%",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-level encryption and compliance",
    stat: "SOC 2",
  },
  {
    icon: Zap,
    title: "Process Millions",
    description: "Scale to any volume",
    stat: "Unlimited",
  },
];

export default function HowItWorksPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  return (
    <AnimatedPageWrapper aria-label="How it works page">
      <Navigation />

      {/* Breadcrumbs */}
      <section className="px-4 sm:px-6 lg:px-8 pt-24">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs items={[{ label: 'How It Works' }]} />
        </div>
      </section>

      {/* Hero Section */}
      <section
        className="relative pt-8 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[70vh] flex items-center"
        aria-labelledby="hero-heading"
      >
        <ParallaxBackground>
          <ParallaxBlobs count={4} />
        </ParallaxBackground>

        <div className="max-w-7xl mx-auto relative z-10">
          <AnimatedHero
            badge="Simple & Powerful"
            title="How Settler Works"
            description="Reconcile millions of transactions automatically in 4 simple steps. Get started in 5 minutes."
          />
          
          {/* Hero Illustration */}
          <div className="relative w-full max-w-4xl mx-auto mt-12 mb-8">
            <div className="relative aspect-[16/9] w-full max-w-4xl mx-auto">
              <Image
                src="/assets/marketing/hero-image-2.png"
                alt="How Settler Works - Step-by-step visual guide showing the reconciliation process"
                width={1258}
                height={618}
                className="w-full h-full object-contain drop-shadow-2xl rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm"
                priority
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1258px"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mt-6 sm:mt-8 w-full sm:w-auto px-4">
            <Button
              size="lg"
              asChild
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              <Link href="/signup">Start Free Trial</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/console/playground">Try Playground</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section
        ref={containerRef}
        className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
        aria-labelledby="steps-heading"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <TextRevealHeading
              as="h2"
              id="steps-heading"
              text="4 Simple Steps to Automated Reconciliation"
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-slate-900 dark:text-white"
              delay={0}
              staggerDelay={0.02}
            />
            <TextReveal
              text="From connection to results in minutes, not hours"
              className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto"
              delay={0.2}
              staggerDelay={0.01}
            />
          </div>

          <div className="space-y-6 sm:space-y-8 md:space-y-12">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = activeStep === index;
              return (
                <div
                  key={index}
                  className={cn(
                    "grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center",
                    index % 2 === 1 && "lg:grid-flow-dense"
                  )}
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? "translateY(0)" : "translateY(20px)",
                    transition: `opacity 0.6s ease-out ${index * 0.1}s, transform 0.6s ease-out ${index * 0.1}s`,
                  }}
                >
                  <div className={cn(index % 2 === 1 && "lg:col-start-2")}>
                    <div onClick={() => setActiveStep(index)} className="cursor-pointer">
                      <SpotlightCard
                        className={cn(
                          "p-4 sm:p-6 md:p-8 h-full transition-all duration-300 hover:shadow-xl hover:scale-[1.02]",
                          isActive && "ring-2 ring-blue-500 dark:ring-blue-400 scale-[1.02]"
                        )}
                      >
                        <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                          <div
                            className={cn(
                              "w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-xl sm:text-2xl font-bold flex-shrink-0 transition-all duration-300 hover:scale-110 hover:shadow-lg",
                              step.gradient,
                              isActive && "animate-pulse"
                            )}
                          >
                            {step.number}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                              <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white break-words">
                                {step.title}
                              </h3>
                            </div>
                            <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-3 sm:mb-4 break-words">
                              {step.description}
                            </p>
                            <ul className="space-y-1.5 sm:space-y-2">
                              {step.details.map((detail, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-2 text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-300 break-words"
                                >
                                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                  <span>{detail}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </SpotlightCard>
                    </div>
                  </div>

                  <div className={cn(index % 2 === 1 && "lg:col-start-1 lg:row-start-1")}>
                    <div className="relative">
                      {index === 0 ? (
                        <div className="aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                          <SafeImage
                            src="/assets/infographics/reconciliation-flow.svg"
                            alt="Reconciliation flow diagram showing how Settler connects platforms and matches transactions"
                            width={800}
                            height={450}
                            className="w-full h-full object-contain p-4"
                            fallbackTitle="Reconciliation Flow"
                            fallbackCaption="Visual diagram of Settler's reconciliation process"
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            unoptimized
                          />
                        </div>
                      ) : index === 1 ? (
                        <div className="aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                          <SafeImage
                            src="/assets/images/1766446595797.jpg"
                            alt="Define matching rules - Visual interface showing how to configure matching rules in Settler"
                            width={512}
                            height={279}
                            className="w-full h-full object-contain"
                            fallbackTitle="Matching Rules Configuration"
                            fallbackCaption="Configure intelligent matching rules for transaction reconciliation"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 50vw"
                            unoptimized
                          />
                        </div>
                      ) : index === 2 ? (
                        <div className="aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                          <SafeImage
                            src="/assets/images/1766446607998.jpg"
                            alt="Run reconciliation - Visual showing reconciliation process in action"
                            width={512}
                            height={279}
                            className="w-full h-full object-contain"
                            fallbackTitle="Reconciliation Process"
                            fallbackCaption="Process millions of transactions automatically with real-time progress tracking"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 50vw"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-xl p-4 sm:p-6 md:p-8 flex items-center justify-center">
                          <div className="text-center">
                            <div
                              className={cn(
                                "w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto mb-3 sm:mb-4 rounded-xl bg-gradient-to-br flex items-center justify-center text-white transition-all duration-300 hover:scale-110 hover:rotate-3",
                                step.gradient
                              )}
                            >
                              <Icon className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 transition-transform duration-300" />
                            </div>
                            <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-300 font-medium break-words">
                              Step {step.number} Visualization
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <TextRevealHeading
              as="h2"
              text="Why Choose Settler?"
              className="text-3xl md:text-4xl font-bold mb-6 text-slate-900 dark:text-white"
              delay={0}
              staggerDelay={0.02}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={index}
                  className="transition-all duration-300"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? "translateY(0)" : "translateY(20px)",
                    transition: `opacity 0.6s ease-out ${index * 0.1 + 0.5}s, transform 0.6s ease-out ${index * 0.1 + 0.5}s`,
                  }}
                >
                  <SpotlightCard className="p-4 sm:p-6 text-center hover:scale-105 hover:shadow-lg">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white transition-all duration-300 hover:scale-110 hover:rotate-3">
                      <Icon className="w-7 h-7 sm:w-8 sm:h-8 transition-transform duration-300" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2 break-words">
                      {benefit.stat}
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold mb-2 text-slate-900 dark:text-white break-words">
                      {benefit.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 break-words">
                      {benefit.description}
                    </p>
                  </SpotlightCard>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Code Example Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <SpotlightCard className="p-6 sm:p-8 md:p-10">
            <div className="text-center mb-6 sm:mb-8">
              <TextRevealHeading
                as="h2"
                text="Get Started in 5 Minutes"
                className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 text-slate-900 dark:text-white px-2 sm:px-0"
                delay={0}
                staggerDelay={0.02}
              />
              <TextReveal
                text="Here's all the code you need to get started"
                className="text-sm sm:text-base text-slate-600 dark:text-slate-300 px-2 sm:px-0"
                delay={0.2}
                staggerDelay={0.01}
              />
            </div>

            <div className="bg-slate-900 dark:bg-slate-800 rounded-lg p-4 sm:p-6 overflow-x-auto mb-4 sm:mb-6">
              <pre className="text-green-400 text-xs sm:text-sm md:text-base">
                <code className="break-words whitespace-pre-wrap">{`npm install @settler/sdk

import { Settler } from '@settler/sdk';

const client = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

// Create a reconciliation job
const job = await client.jobs.create({
  name: "Shopify-Stripe Reconciliation",
  source: { adapter: "shopify", config: {} },
  target: { adapter: "stripe", config: {} },
  rules: {
    matching: [
      { field: "order_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 },
    ],
  },
});

// Run and get results
const report = await client.jobs.run(job.id);
console.log(\`Matched: \${report.summary.matched}/\${report.summary.total}\`);
// ✅ 99.7% accuracy`}</code>
              </pre>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button
                size="lg"
                asChild
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                <Link href="/console/playground">Try Playground</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                <Link href="/docs">View Documentation</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                <Link href="/docs">View Full Documentation</Link>
              </Button>
            </div>
          </SpotlightCard>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <ParallaxBackground speed={0.2}>
          <ParallaxBlobs count={3} />
        </ParallaxBackground>
        <div className="max-w-4xl mx-auto relative z-10">
          <ConversionCTA
            title="Ready to Automate Your Reconciliation?"
            description="Start automating reconciliation in minutes. Free trial—full access, no credit card required."
            primaryAction="Start Free Trial — No Credit Card"
            primaryLink="/signup"
            secondaryAction="View Pricing"
            secondaryLink="/pricing"
            variant="gradient"
          />
        </div>
      </section>

      <Footer />
    </AnimatedPageWrapper>
  );
}
