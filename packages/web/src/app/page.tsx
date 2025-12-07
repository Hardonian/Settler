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
const IntegrationLogos = dynamic(
  () =>
    import("@/components/IntegrationLogos").then((mod) => ({
      default: mod.IntegrationLogos,
    })),
  { ssr: true }
);
const CommunityHub = dynamic(
  () =>
    import("@/components/CommunityHub").then((mod) => ({
      default: mod.CommunityHub,
    })),
  { ssr: true }
);
const DeveloperResources = dynamic(
  () =>
    import("@/components/DeveloperResources").then((mod) => ({
      default: mod.DeveloperResources,
    })),
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
                text="Reconcile Millions of Transactions Automatically—In Minutes, Not Hours"
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 sm:mb-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-electric-cyan dark:via-electric-purple dark:to-electric-blue bg-clip-text text-transparent leading-tight px-2 sm:px-0"
                delay={0.1}
                staggerDelay={0.02}
                splitBy="words"
              />

              <TextReveal
                text="The API-first reconciliation platform trusted by 500+ companies. Connect Shopify, Stripe, PayPal, and 10+ platforms in 5 minutes. 99.7% accuracy. Start free—no credit card required."
                className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-700 dark:text-slate-300 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-4"
                delay={0.4}
                staggerDelay={0.01}
                splitBy="words"
              />

              <div
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-12 sm:mb-20 px-4 w-full sm:w-auto"
                role="group"
                aria-label="Call to action buttons"
              >
                <Button
                  size="lg"
                  asChild
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-electric-cyan dark:to-electric-blue dark:hover:from-electric-cyan/90 dark:hover:to-electric-blue/90 text-white px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-semibold shadow-lg hover:shadow-blue-500/50 dark:hover:shadow-electric-cyan/50 transition-all duration-200 transform hover:scale-105 focus:ring-2 focus:ring-blue-500 dark:focus:ring-electric-cyan focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900"
                  onClick={() => trackCTA("Start Free Trial", { location: "hero" })}
                >
                  <Link href="/signup" aria-label="Start free trial of Settler" className="text-center">
                    Start Free Trial — No Credit Card
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-medium border-2 border-slate-300 dark:border-white/20 glass hover:border-indigo-500 dark:hover:border-electric-purple/50 hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-200 transform hover:scale-105 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-electric-purple focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900"
                >
                  <Link href="/how-it-works" aria-label="See how Settler works" className="text-center">
                    See How It Works
                  </Link>
                </Button>
              </div>

              {/* Hero Stats */}
              <div
                className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 max-w-5xl mx-auto px-2 sm:px-4"
                role="list"
                aria-label="Key performance metrics"
              >
                {heroStats.map((stat, index) => (
                  <div key={index} role="listitem" className="w-full">
                    <SpotlightCard className="p-4 sm:p-5 md:p-6 h-full">
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

        {/* Social Proof Counter - FOMO & Trust */}
        <SocialProofCounter />

        {/* Integration Logos - Partnerships with Trusted Brands */}
        <IntegrationLogos />

        {/* Code Example Section */}
        <section
          className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
          aria-labelledby="code-example-heading"
        >
          <ParallaxBackground speed={0.3}>
            <ParallaxBlobs count={3} />
          </ParallaxBackground>
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <TextRevealHeading
                as="h2"
                id="code-example-heading"
                text="Get Started in Minutes"
                className="text-3xl md:text-4xl font-bold mb-6 text-slate-900 dark:text-white"
                delay={0}
                staggerDelay={0.02}
              />
              <TextReveal
                text="Connect any platform in minutes. Process millions of transactions with 99.7% accuracy."
                className="text-lg text-slate-700 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed px-4"
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
            <div className="text-center mb-12 sm:mb-16 md:mb-20">
              <TextRevealHeading
                as="h2"
                id="features-heading"
                text="Everything You Need"
                className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-slate-900 dark:text-white px-2 sm:px-0"
                delay={0}
                staggerDelay={0.02}
              />
              <TextReveal
                text="Built for developers, designed for scale"
                className="text-base sm:text-lg text-slate-700 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed px-4"
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
                        className="h-full flex flex-col p-4 sm:p-6 md:p-8 w-full overflow-hidden"
                        spotlightColor={
                          index % 2 === 0 ? "rgba(6, 182, 212, 0.3)" : "rgba(168, 85, 247, 0.3)"
                        }
                      >
                        <div
                          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br ${feature.gradient} p-2 sm:p-3 mb-3 sm:mb-5 flex items-center justify-center flex-shrink-0`}
                        >
                          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 text-slate-900 dark:text-white leading-tight break-words">
                          {feature.title}
                        </h3>
                        <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 flex-grow leading-relaxed break-words">
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
            <div className="text-center mb-12 sm:mb-16 md:mb-20">
              <TextRevealHeading
                as="h2"
                id="why-settler-heading"
                text="Why Choose Settler Over Building In-House?"
                className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-slate-900 dark:text-white px-2 sm:px-0"
                delay={0}
                staggerDelay={0.02}
              />
              <TextReveal
                text="Skip 3-6 months of development. Get started in 5 minutes."
                className="text-base sm:text-lg text-slate-700 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed px-4"
                delay={0.2}
                staggerDelay={0.01}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
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
                <SpotlightCard key={index} className="p-4 sm:p-6 text-center">
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-gradient-to-br ${item.gradient} mx-auto mb-3 sm:mb-4 flex items-center justify-center`}
                  >
                    <span className="text-xl sm:text-2xl font-bold text-white break-words">{item.metric}</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold mb-2 text-slate-900 dark:text-white break-words">
                    {item.label}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 break-words">{item.comparison}</p>
                </SpotlightCard>
              ))}
            </div>
            <div className="text-center">
              <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 mb-6 sm:mb-10 leading-relaxed px-4 break-words">
                <strong className="text-slate-900 dark:text-white">ROI:</strong> Most customers see
                payback in the first month
              </p>
              <Button
                size="lg"
                asChild
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-semibold"
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

        {/* Developer Resources */}
        <DeveloperResources />

        {/* Community Hub */}
        <CommunityHub />

        {/* Newsletter Signup */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <ParallaxBackground speed={0.2}>
            <ParallaxBlobs count={2} />
          </ParallaxBackground>
          <div className="max-w-4xl mx-auto relative z-10">
            <NewsletterSignup />
          </div>
        </section>

        {/* Trust & Security - Reaffirm Before Purchase Decision */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <PurchaseScrutiny />
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <ParallaxBackground speed={0.25}>
            <ParallaxBlobs count={4} />
          </ParallaxBackground>
          <div className="max-w-4xl mx-auto relative z-10">
            <SpotlightCard className="p-10 md:p-12 text-center">
              <ConversionCTA
                title="Ready to Save 10+ Hours Per Week?"
                description="Join 500+ companies automating reconciliation with 99.7% accuracy. 30-day free trial with full access—no credit card required, cancel anytime."
                primaryAction="Start Free Trial — No Credit Card"
                primaryLink="/signup"
                secondaryAction="See Pricing & Plans"
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
