'use client';

import Link from "next/link";
import dynamic from "next/dynamic";
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { HeroAnimationWrapper } from "@/components/HeroAnimationWrapper";
import { TextReveal, TextRevealHeading } from "@/components/ui/TextReveal";
import { ParallaxBackground, ParallaxBlobs } from "@/components/ui/ParallaxBackground";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { BentoGrid, BentoGridItem } from "@/components/ui/BentoGrid";
import { RefreshCw, FileText, Flag, Calculator, ArrowRight, LayoutTemplate, CheckCircle2, Sparkles } from "lucide-react";
// Dynamic imports for new landing components (code splitting)
const FeatureShowcase = dynamic(() => import("@/components/landing/FeatureShowcase").then(mod => ({ default: mod.FeatureShowcase })), { 
  ssr: true,
  loading: () => <div className="py-24" />
});
const ComparisonTable = dynamic(() => import("@/components/landing/ComparisonTable").then(mod => ({ default: mod.ComparisonTable })), { 
  ssr: true,
  loading: () => <div className="py-24" />
});
import { analytics } from "@/lib/analytics";
import { useTrackCTA } from "@/lib/telemetry/hooks";
import { trackPageView } from "@/lib/analytics/conversion";

// Dynamic imports for marketing components - using index file for better webpack resolution
// This provides code splitting and lazy loading benefits while avoiding webpack alias issues
const LiveMetricsCounter = dynamic(() => import("@/components/marketing").then(mod => ({ default: mod.LiveMetricsCounter })), { 
  ssr: false,
  loading: () => <div className="py-12" />
});
const ValueProposition = dynamic(() => import("@/components/marketing").then(mod => ({ default: mod.ValueProposition })), { 
  ssr: true,
  loading: () => <div className="py-20" />
});
const SocialProofCounter = dynamic(() => import("@/components/marketing").then(mod => ({ default: mod.SocialProofCounter })), { 
  ssr: true,
  loading: () => <div className="py-12" />
});
const UrgencyBanner = dynamic<{ variant?: 'default' | 'minimal' | 'prominent'; className?: string }>(() => import("@/components/marketing").then(mod => ({ default: mod.UrgencyBanner })), { 
  ssr: true,
  loading: () => null // No placeholder for banner
});
const TestimonialCarousel = dynamic(() => import("@/components/marketing").then(mod => ({ default: mod.TestimonialCarousel })), { 
  ssr: true,
  loading: () => <div className="py-20" />
});
const InfographicSection = dynamic(() => import("@/components/marketing").then(mod => ({ default: mod.InfographicSection })), { 
  ssr: true,
  loading: () => <div className="py-20" />
});
// Dynamic imports for heavy components
const CustomerLogos = dynamic(() => import("@/components/CustomerLogos").then(mod => ({ default: mod.CustomerLogos })), { ssr: true });
const SocialProof = dynamic(() => import("@/components/SocialProof").then(mod => ({ default: mod.SocialProof })), { ssr: false });
const NewsletterSignup = dynamic(() => import("@/components/NewsletterSignup").then(mod => ({ default: mod.NewsletterSignup })), { ssr: false });
const ConversionCTA = dynamic(() => import("@/components/ConversionCTA").then(mod => ({ default: mod.ConversionCTA })), { ssr: true });
const AnimatedCodeBlock = dynamic(() => import("@/components/AnimatedCodeBlock").then(mod => ({ default: mod.AnimatedCodeBlock })), { ssr: false });
const AnimatedStatCard = dynamic(() => import("@/components/AnimatedStatCard").then(mod => ({ default: mod.AnimatedStatCard })), { ssr: true });
const TrustSignalBanner = dynamic(() => import("@/components/TrustSignalBanner").then(mod => ({ default: mod.TrustSignalBanner })), { ssr: true });
const EnhancedConversionCTA = dynamic(() => import("@/components/EnhancedConversionCTA").then(mod => ({ default: mod.EnhancedConversionCTA })), { ssr: true });
const IntegrationLogos = dynamic(() => import("@/components/IntegrationLogos").then(mod => ({ default: mod.IntegrationLogos })), { ssr: true });
const EnhancedTrustBadges = dynamic(() => import("@/components/EnhancedTrustBadges").then(mod => ({ default: mod.EnhancedTrustBadges })), { ssr: true });

export default function Home() {
  const trackCTA = useTrackCTA();

  // Track page view
  useEffect(() => {
    analytics.trackPageView('/', {
      title: 'Settler - The API Infrastructure for Financial Evidence',
    });
    // Track conversion event
    trackPageView('/', undefined, undefined).catch(() => {
      // Don't block if tracking fails
    });
  }, []);

  const features = [
    {
      icon: RefreshCw,
      title: "Reconcile Anything",
      description: "Match transactions across Stripe, Shopify, databases, and more using precise matching algorithms. Process high-volume transactions efficiently and reliably.",
      gradient: "from-blue-500 to-indigo-500",
    },
    {
      icon: FileText,
      title: "Receipts → JSON",
      description: "Turn PDFs and images into structured financial data with AI-powered OCR. Extract vendors, dates, totals, and line items instantly.",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      icon: Calculator,
      title: "Deterministic Convert",
      description: "Precise unit and currency conversion without floating point errors. Handle FX rates and unit conversions with confidence.",
      gradient: "from-indigo-500 to-purple-500",
    },
    {
      icon: Sparkles,
      title: "AI-Powered Insights",
      description: "Get actionable recommendations powered by AI to optimize costs, improve performance, and understand usage patterns. Included with Commercial and Enterprise plans.",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: Flag,
      title: "Developer-First Flags",
      description: "Edge-evaluated feature flags with typed payloads and instant rollouts. Manage entitlements and phased releases programmatically.",
      gradient: "from-amber-500 to-orange-500",
    },
  ];

  const heroStats = [
    { value: 'Deterministic', label: 'Matching', description: 'Precise algorithms' },
    { value: '<30ms', label: 'Edge Latency', description: 'Global evaluation' },
    { value: 'ISO', label: 'Compliant', description: '27001 & SOC 2 Ready' },
    { value: '1st', label: 'Developer DX', description: 'Typed SDKs' },
  ];

  const codeExample = `import { SettlerClient } from "@settler/sdk";

const client = new SettlerClient({ apiKey: "sk_live_..." });

// 1. Reconcile Payments
const job = await client.jobs.create({
  source: { adapter: "stripe" },
  target: { adapter: "database" },
  rules: { matching: [{ field: "amount", tolerance: 0.01 }] }
});

// 2. Parse Receipt
const receipt = await client.receipts.parse("https://receipts.com/123.jpg");
console.log(receipt.total, receipt.merchant.name);

// 3. Convert Currency
const fx = await client.convert.currency(100, "USD", "EUR");

// 4. Check Feature Flag
const flag = await client.flags.evaluate("new-dashboard", { userId: "123" });
if (flag.value) { /* ... */ }`;

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
          className="relative pt-24 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[85vh] sm:min-h-[90vh] flex items-center"
          aria-labelledby="hero-heading"
        >
          <ParallaxBackground>
            <ParallaxBlobs count={5} />
          </ParallaxBackground>
          
          <div 
            className="absolute inset-0 bg-grid-slate-200 dark:bg-grid-slate-800 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.3))] -z-10"
            aria-hidden="true"
          />
          
          <div className="max-w-7xl mx-auto relative z-10">
            <HeroAnimationWrapper>
              <div className="text-center">
                <Badge 
                  className="mb-6 glass-strong text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-400/30"
                >
                  Trusted by small businesses to automate financial reconciliation
                </Badge>
                
                <TextRevealHeading
                  as="h1"
                  id="hero-heading"
                  text="Automate Financial Reconciliation in Minutes, Not Hours"
                  className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent"
                  delay={0}
                  staggerDelay={0.02}
                  splitBy="words"
                />
                
                <TextReveal
                  text="Automatically match transactions between Stripe, Shopify, QuickBooks, and 50+ platforms. Save hours of manual work with reliable, automatic reconciliation."
                  className="text-xl md:text-2xl text-slate-700 dark:text-slate-300 mb-8 max-w-4xl mx-auto"
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
                      <span>Start Free Trial - No Credit Card</span>
                      <ArrowRight className="w-5 h-5" aria-hidden="true" />
                    </Link>
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    asChild 
                    className="w-full sm:w-auto px-6 sm:px-8 py-6 sm:py-7 text-base sm:text-lg border-2 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  >
                    <Link href="/docs">
                      View Docs
                    </Link>
                  </Button>
                </div>
                
                {/* Trust Signals */}
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600 dark:text-slate-400 mb-8">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>14-day free trial</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>Cancel anytime</span>
                  </div>
                </div>
                
                {/* Hero Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto mb-12 sm:mb-16">
                  {heroStats.map((stat, index) => (
                    <SpotlightCard key={index} className="p-4 h-full">
                      <AnimatedStatCard
                        value={stat.value}
                        label={stat.label}
                        description={stat.description}
                        index={index}
                        delay={0.4 + index * 0.1}
                      />
                    </SpotlightCard>
                  ))}
                </div>
              </div>
            </HeroAnimationWrapper>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 glass-subtle">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-slate-900 dark:text-white">
                Core Primitives
              </h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto px-4">
                Everything you need to automate financial reconciliation, without the complexity.
              </p>
            </div>
            
            <BentoGrid columns={2} gap="lg">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <BentoGridItem key={index} colSpan={1}>
                    <SpotlightCard className="h-full flex flex-col p-6 sm:p-8">
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${feature.gradient} p-3 sm:p-3.5 mb-4 sm:mb-6 flex items-center justify-center`}>
                        <Icon className="w-full h-full text-white" aria-hidden="true" />
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-slate-900 dark:text-white">{feature.title}</h3>
                      <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 mb-4 sm:mb-6 flex-grow">{feature.description}</p>
                      <Link 
                        href="/docs" 
                        className="flex items-center text-blue-600 dark:text-blue-400 font-semibold group transition-colors hover:text-blue-700 dark:hover:text-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded"
                        aria-label={`Learn more about ${feature.title}`}
                      >
                        Learn more <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                      </Link>
                    </SpotlightCard>
                  </BentoGridItem>
                );
              })}
            </BentoGrid>
          </div>
        </section>

        {/* Code Example */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50">
           <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
             <div className="order-2 lg:order-1">
               <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-slate-900 dark:text-white">
                 Developer Experience First
               </h2>
               <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mb-6 sm:mb-8">
                 Simple APIs that work out of the box. No complex configuration, no learning curve—just reliable reconciliation.
               </p>
               <div className="space-y-3 sm:space-y-4">
                 {[
                   "TypeScript, Python, Go, and Ruby SDKs",
                   "OpenAPI 3.1 Specification",
                   "Interactive Developer Console",
                   "Local Development Sandbox"
                 ].map((item, i) => (
                   <div key={i} className="flex items-center gap-2 sm:gap-3">
                     <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 flex-shrink-0" aria-hidden="true">✓</div>
                     <span className="text-sm sm:text-base text-slate-700 dark:text-slate-300 font-medium">{item}</span>
                   </div>
                 ))}
               </div>
               <div className="mt-6 sm:mt-8">
                 <Link href="/docs/sdk" className="text-blue-600 dark:text-blue-400 font-bold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded">
                   Explore the SDKs &rarr;
                 </Link>
               </div>
             </div>
             <div className="order-1 lg:order-2">
               <SpotlightCard className="p-0 overflow-hidden shadow-2xl">
                <AnimatedCodeBlock
                  code={codeExample}
                  title="Universal API Client"
                  description="One client, all primitives"
                  language="typescript"
                />
               </SpotlightCard>
             </div>
           </div>
        </section>

        {/* Feature Showcase */}
        <FeatureShowcase />

        {/* Comparison Table */}
        <ComparisonTable />

        {/* Architecture Preview */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
             <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-slate-900 dark:text-white">
               Built on a Solid Foundation
             </h2>
             <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8 sm:mb-12 px-4">
               See how we handle double-entry accounting, event sourcing, and edge execution to guarantee correctness.
             </p>
             <Link href="/architecture" className="relative group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl max-w-4xl mx-auto">
               <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-slate-900 via-transparent to-transparent z-10 flex items-end justify-center pb-6 sm:pb-8">
                 <Button variant="secondary" className="shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">View Full Architecture</Button>
               </div>
               <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden opacity-50 blur-[1px] group-hover:opacity-75 group-hover:blur-0 group-focus-within:opacity-75 group-focus-within:blur-0 transition-all duration-500">
                  {/* Placeholder for architecture preview image/diagram */}
                  <div className="bg-slate-100 dark:bg-slate-800 h-[200px] sm:h-[300px] w-full flex items-center justify-center" role="img" aria-label="Architecture diagram placeholder">
                    <LayoutTemplate className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300" aria-hidden="true" />
                  </div>
               </div>
             </Link>
          </div>
        </section>

        {/* Infographics Section - Workflow Diagram (moved after Architecture section per audit requirements) */}
        <InfographicSection />

        {/* Live Metrics Counter */}
        <LiveMetricsCounter />

        {/* Value Proposition */}
        <ValueProposition />

        {/* Integration Logos */}
        <IntegrationLogos />

        {/* Trust Signal Banner */}
        <TrustSignalBanner />

        {/* Enhanced Trust Badges */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-slate-800/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-slate-900 dark:text-white">
                Trusted & Secure
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Enterprise-grade security and compliance certifications
              </p>
            </div>
            <EnhancedTrustBadges />
          </div>
        </section>

        {/* Social Proof Counter */}
        <SocialProofCounter />

        {/* Why Settler */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,transparent)]" aria-hidden="true" />
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-6 px-4">Why Settler Exists</h2>
            <p className="text-lg sm:text-xl text-blue-100 mb-6 sm:mb-8 leading-relaxed px-4">
              We got tired of building the same fragile financial infrastructure at every company. 
              We built Settler to solve it once and for all.
            </p>
            <Button 
              size="lg" 
              variant="secondary" 
              asChild 
              className="bg-white text-blue-600 hover:bg-blue-50 px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600"
            >
              <Link href="/why-settler">Read our Manifesto</Link>
            </Button>
          </div>
        </section>

        {/* Social Proof */}
        <SocialProof />

        {/* Testimonial Carousel */}
        <TestimonialCarousel />

        {/* Enhanced Conversion CTA */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800">
          <div className="max-w-4xl mx-auto">
            <EnhancedConversionCTA
              title="Ready to Transform Your Financial Operations?"
              description="Join thousands of companies already using Settler. Start your free trial today—no credit card required, full access to all features."
              primaryAction="Try Playground"
              primaryLink="/console/playground"
              secondaryAction="Start Free Trial"
              secondaryLink="/signup"
              showUrgency={true}
              showTrustBadges={true}
              variant="hero"
            />
          </div>
        </section>
        
        {/* Hidden Preload for components */}
        <div className="hidden">
          <CustomerLogos />
          <NewsletterSignup />
          <ConversionCTA />
        </div>

        <Footer />
      </div>
    </>
  );
}
