"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { TextReveal, TextRevealHeading } from "@/components/ui/TextReveal";
import { ParallaxBackground, ParallaxBlobs } from "@/components/ui/ParallaxBackground";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { BentoGrid, BentoGridItem } from "@/components/ui/BentoGrid";
import { Zap, Lock, Rocket, Target, Plug, BarChart3 } from "lucide-react";
import { analytics } from "@/lib/analytics";
import { useTrackCTA } from "@/lib/telemetry/hooks";

// Dynamic imports for heavy components
const TrustBadges = dynamic(
  () => import("@/components/TrustBadges").then((mod) => ({ default: mod.TrustBadges })),
  { ssr: true }
);
const EnhancedTrustBadges = dynamic(
  () =>
    import("@/components/EnhancedTrustBadges").then((mod) => ({
      default: mod.EnhancedTrustBadges,
    })),
  { ssr: true }
);
const PurchaseScrutiny = dynamic(
  () =>
    import("@/components/PurchaseScrutiny").then((mod) => ({
      default: mod.PurchaseScrutiny,
    })),
  { ssr: true }
);
const SocialProofCounter = dynamic(
  () =>
    import("@/components/SocialProofCounter").then((mod) => ({
      default: mod.SocialProofCounter,
    })),
  { ssr: true }
);
const CustomerLogos = dynamic(
  () => import("@/components/CustomerLogos").then((mod) => ({ default: mod.CustomerLogos })),
  { ssr: true }
);
const SocialProof = dynamic(
  () => import("@/components/SocialProof").then((mod) => ({ default: mod.SocialProof })),
  { ssr: false }
);
const CustomerTestimonials = dynamic(
  () => import("@/components/CustomerTestimonials").then((mod) => ({ default: mod.CustomerTestimonials })),
  { ssr: true }
);
const NewsletterSignup = dynamic(
  () => import("@/components/NewsletterSignup").then((mod) => ({ default: mod.NewsletterSignup })),
  { ssr: false }
);
const ConversionCTA = dynamic(
  () => import("@/components/ConversionCTA").then((mod) => ({ default: mod.ConversionCTA })),
  { ssr: true }
);
const AnimatedCodeBlock = dynamic(
  () =>
    import("@/components/AnimatedCodeBlock").then((mod) => ({ default: mod.AnimatedCodeBlock })),
  { ssr: false }
);
const AnimatedStatCard = dynamic(
  () => import("@/components/AnimatedStatCard").then((mod) => ({ default: mod.AnimatedStatCard })),
  { ssr: true }
);
const EdgeAIMarketingSection = dynamic(
  () =>
    import("@/components/EdgeAIMarketingSection").then((mod) => ({
      default: mod.EdgeAIMarketingSection,
    })),
  { ssr: true }
);

export default function Home() {
  const trackCTA = useTrackCTA();

  // Track page view
  useEffect(() => {
    analytics.trackPageView("/", {
      title: "Settler - Reconciliation as a Service API",
    });
  }, []);

  const features = [
    {
      icon: Zap,
      title: "Save 10+ Hours Per Week",
      description:
        "Automate transaction matching across platforms with 99.7% accuracy. No spreadsheets, no manual work.",
      gradient: "from-electric-cyan to-electric-blue",
    },
    {
      icon: Lock,
      title: "Enterprise Security",
      description:
        "Bank-level encryption, secure API key storage, and audit trails. GDPR compliant with SOC 2 Type II in progress.",
      gradient: "from-electric-purple to-electric-indigo",
    },
    {
      icon: Rocket,
      title: "Process Millions in Minutes",
      description: "Cloud reconciliation at unlimited scale. Edge AI with <10ms latency. Real-time webhooks or scheduled batch processing.",
      gradient: "from-electric-neon to-electric-cyan",
    },
    {
      icon: Target,
      title: "99.7% Accuracy",
      description: "Intelligent matching rules catch transactions automatically. Eliminate human error with full audit trails.",
      gradient: "from-electric-blue to-electric-purple",
    },
    {
      icon: Plug,
      title: "Connect 10+ Platforms",
      description:
        "Pre-built adapters for Shopify, Stripe, QuickBooks, PayPal, Square, Xero, and more. Set up in 5 minutes with secure API key storage.",
      gradient: "from-electric-indigo to-electric-neon",
    },
    {
      icon: BarChart3,
      title: "Complete Visibility",
      description:
        "Full visibility into matches, mismatches, and insights. Complete audit trail for compliance. Export reports and track history.",
      gradient: "from-electric-cyan to-electric-purple",
    },
  ];

  const heroStats = [
    { value: "99.7%", label: "Accuracy", description: "Reconciliation precision" },
    { value: "<10ms", label: "Edge AI Latency", description: "Local processing speed" },
    { value: "10+", label: "Platform Adapters", description: "Pre-built integrations" },
    { value: "5 min", label: "Setup Time", description: "Get started in minutes" },
  ];

  const secondaryStats = [
    { value: "10M+", label: "Transactions Reconciled", description: "Total processed" },
    { value: "24/7", label: "Uptime", description: "Service availability" },
    { value: "99.9%", label: "Reliability", description: "SLA guarantee" },
    { value: "<1s", label: "Processing Speed", description: "Per transaction" },
  ];

  const codeExample = `npm install @settler/sdk

import Settler from "@settler/sdk";

const client = new Settler({
  apiKey: "sk_your_api_key",
});

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

const report = await client.jobs.run(job.id);
// ✅ High accuracy, 145 matched, 3 unmatched`;

  return (
    <>
      <div
        id="main-content"
        className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black"
        role="main"
        aria-label="Settler homepage"
        tabIndex={-1}
      >
        <Navigation />

        {/* Hero Section with Parallax Background */}
        <section
          className="relative pt-32 pb-24 md:pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[90vh] flex items-center"
          aria-labelledby="hero-heading"
        >
          {/* Parallax Background with Blobs */}
          <ParallaxBackground>
            <ParallaxBlobs count={5} />
          </ParallaxBackground>

          {/* Grid background */}
          <div
            className="absolute inset-0 bg-grid-slate-200 dark:bg-grid-slate-800 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.3))] -z-10"
            aria-hidden="true"
          />

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center">
              <Badge
                className="mb-8 glass-strong text-blue-600 dark:text-electric-cyan border-blue-300 dark:border-electric-cyan/30 hover:border-blue-400 dark:hover:border-electric-cyan/50 transition-all duration-200 px-4 py-1.5"
                aria-label="Product category"
              >
                API-First Financial Reconciliation
              </Badge>

              <TextRevealHeading
                as="h1"
                id="hero-heading"
                text="Stop Wasting 10+ Hours Per Week on Manual Reconciliation"
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-electric-cyan dark:via-electric-purple dark:to-electric-blue bg-clip-text text-transparent leading-tight"
                delay={0.1}
                staggerDelay={0.02}
                splitBy="words"
              />

              <TextReveal
                text="Automate transaction matching across Shopify, Stripe, PayPal, and 10+ platforms with 99.7% accuracy. Start your free trial—no credit card required."
                className="text-xl md:text-2xl text-slate-700 dark:text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed"
                delay={0.4}
                staggerDelay={0.01}
                splitBy="words"
              />

              <div
                className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
                role="group"
                aria-label="Call to action buttons"
              >
                <Button
                  size="lg"
                  asChild
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-electric-cyan dark:to-electric-blue dark:hover:from-electric-cyan/90 dark:hover:to-electric-blue/90 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-blue-500/50 dark:hover:shadow-electric-cyan/50 transition-all duration-200 transform hover:scale-105 focus:ring-2 focus:ring-blue-500 dark:focus:ring-electric-cyan focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900"
                  onClick={() => trackCTA("Start Free Trial", { location: "hero" })}
                >
                  <Link href="/signup" aria-label="Start free trial of Settler">
                    Start Free Trial
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="px-8 py-6 text-lg font-medium border-2 border-slate-300 dark:border-white/20 glass hover:border-indigo-500 dark:hover:border-electric-purple/50 hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-200 transform hover:scale-105 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-electric-purple focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900"
                >
                  <Link href="/docs" aria-label="View Settler documentation">
                    View Docs
                  </Link>
                </Button>
              </div>

              {/* Hero Stats */}
              <div
                className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto"
                role="list"
                aria-label="Key performance metrics"
              >
                {heroStats.map((stat, index) => (
                  <div key={index} role="listitem">
                    <SpotlightCard className="p-5 md:p-6 h-full">
                      <AnimatedStatCard
                        value={stat.value}
                        label={stat.label}
                        description={stat.description}
                        index={index}
                        delay={1.2 + index * 0.1}
                      />
                    </SpotlightCard>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof Counter */}
        <SocialProofCounter />

        {/* Enhanced Trust Badges */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 glass-subtle">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-slate-900 dark:text-white">
                Enterprise-Grade Security & Compliance
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Your data is protected with industry-leading security standards
              </p>
            </div>
            <EnhancedTrustBadges />
          </div>
        </section>

        {/* Customer Logos */}
        <CustomerLogos />

        {/* Code Example Section */}
        <section
          className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
          aria-labelledby="code-example-heading"
        >
          <ParallaxBackground speed={0.3}>
            <ParallaxBlobs count={3} />
          </ParallaxBackground>
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-12">
              <TextRevealHeading
                as="h2"
                id="code-example-heading"
                text="Get Started in Minutes"
                className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white"
                delay={0}
                staggerDelay={0.02}
              />
              <TextReveal
                text="Connect any platform in minutes. Process millions of transactions with 99.7% accuracy."
                className="text-lg text-slate-700 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed"
                delay={0.2}
                staggerDelay={0.01}
              />
            </div>
            <SpotlightCard className="p-0 overflow-hidden">
              <AnimatedCodeBlock
                code={codeExample}
                title="Quick Start Example"
                description="Reconcile Shopify orders with Stripe payments in just a few lines of code"
                language="typescript"
              />
            </SpotlightCard>
          </div>
        </section>

        {/* Features Section with BentoGrid */}
        <section
          className="py-20 px-4 sm:px-6 lg:px-8 glass-subtle"
          aria-labelledby="features-heading"
        >
          <div className="max-w-7xl mx-auto w-full">
            <div className="text-center mb-16">
              <TextRevealHeading
                as="h2"
                id="features-heading"
                text="Everything You Need"
                className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white"
                delay={0}
                staggerDelay={0.02}
              />
              <TextReveal
                text="Built for developers, designed for scale"
                className="text-lg text-slate-700 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed"
                delay={0.2}
                staggerDelay={0.01}
              />
            </div>
            <div className="w-full">
              <BentoGrid columns={3} gap="lg" className="w-full">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <BentoGridItem
                      key={index}
                      colSpan={index === 0 || index === 3 ? 2 : 1}
                      rowSpan={index === 0 ? 2 : 1}
                      className="w-full"
                    >
                      <SpotlightCard
                        className="h-full flex flex-col p-6 md:p-8 w-full"
                        spotlightColor={
                          index % 2 === 0 ? "rgba(6, 182, 212, 0.3)" : "rgba(168, 85, 247, 0.3)"
                        }
                      >
                        <div
                          className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} p-3 mb-5 flex items-center justify-center flex-shrink-0`}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold mb-3 text-slate-900 dark:text-white leading-tight">
                          {feature.title}
                        </h3>
                        <p className="text-slate-700 dark:text-slate-300 flex-grow leading-relaxed">
                          {feature.description}
                        </p>
                      </SpotlightCard>
                    </BentoGridItem>
                  );
                })}
              </BentoGrid>
            </div>
          </div>
        </section>

        {/* Customer Testimonials */}
        <CustomerTestimonials />

        {/* Social Proof */}
        <SocialProof />

        {/* Why Settler Section */}
        <section
          className="py-20 px-4 sm:px-6 lg:px-8 glass-subtle"
          aria-labelledby="why-settler-heading"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <TextRevealHeading
                as="h2"
                id="why-settler-heading"
                text="Why Choose Settler Over Building In-House?"
                className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white"
                delay={0}
                staggerDelay={0.02}
              />
              <TextReveal
                text="Skip 3-6 months of development. Get started in 5 minutes."
                className="text-lg text-slate-700 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed"
                delay={0.2}
                staggerDelay={0.01}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {[
                {
                  metric: "5 minutes",
                  label: "Time to Value",
                  comparison: "vs. 3-6 months in-house",
                  gradient: "from-blue-500 to-cyan-500",
                },
                {
                  metric: "$99/month",
                  label: "Cost",
                  comparison: "vs. $50K+ development",
                  gradient: "from-green-500 to-emerald-500",
                },
                {
                  metric: "Managed",
                  label: "Maintenance",
                  comparison: "vs. your team",
                  gradient: "from-purple-500 to-indigo-500",
                },
                {
                  metric: "10+ Adapters",
                  label: "Integrations",
                  comparison: "vs. building each",
                  gradient: "from-orange-500 to-red-500",
                },
              ].map((item, index) => (
                <SpotlightCard key={index} className="p-6 text-center">
                  <div
                    className={`w-16 h-16 rounded-lg bg-gradient-to-br ${item.gradient} mx-auto mb-4 flex items-center justify-center`}
                  >
                    <span className="text-2xl font-bold text-white">{item.metric}</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">
                    {item.label}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{item.comparison}</p>
                </SpotlightCard>
              ))}
            </div>
            <div className="text-center">
              <p className="text-lg text-slate-700 dark:text-slate-300 mb-8 leading-relaxed">
                <strong className="text-slate-900 dark:text-white">ROI:</strong> Most customers see
                payback in the first month
              </p>
              <Button
                size="lg"
                asChild
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-6 text-lg font-semibold"
              >
                <Link href="/pricing" aria-label="View pricing plans">
                  View Pricing
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Edge AI Section */}
        <EdgeAIMarketingSection variant="featured" />

        {/* Newsletter Signup */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <ParallaxBackground speed={0.2}>
            <ParallaxBlobs count={2} />
          </ParallaxBackground>
          <div className="max-w-4xl mx-auto relative z-10">
            <NewsletterSignup />
          </div>
        </section>

        {/* Purchase Scrutiny Before Final CTA */}
        <PurchaseScrutiny />

        {/* Final CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <ParallaxBackground speed={0.25}>
            <ParallaxBlobs count={4} />
          </ParallaxBackground>
          <div className="max-w-4xl mx-auto relative z-10">
            <SpotlightCard className="p-10 md:p-12 text-center">
              <ConversionCTA
                title="Ready to Automate Reconciliation?"
                description="Join 500+ companies processing millions of transactions with 99.7% accuracy. Start your free trial—no credit card required."
                primaryAction="Start Free Trial"
                primaryLink="/signup"
                secondaryAction="View Pricing"
                secondaryLink="/pricing"
                variant="gradient"
              />
            </SpotlightCard>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
