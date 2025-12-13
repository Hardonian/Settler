'use client';

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { HeroAnimationWrapper } from "@/components/HeroAnimationWrapper";
import { TextReveal, TextRevealHeading } from "@/components/ui/TextReveal";
import { ParallaxBackground, ParallaxBlobs } from "@/components/ui/ParallaxBackground";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { BentoGrid, BentoGridItem } from "@/components/ui/BentoGrid";
import { RefreshCw, FileText, Flag, Calculator, ArrowRight, LayoutTemplate, CheckCircle2 } from "lucide-react";
import { analytics } from "@/lib/analytics";
import { useTrackCTA } from "@/lib/telemetry/hooks";

// Dynamic imports for heavy components
const TrustBadges = dynamic(() => import("@/components/TrustBadges").then(mod => ({ default: mod.TrustBadges })), { ssr: true });
const CustomerLogos = dynamic(() => import("@/components/CustomerLogos").then(mod => ({ default: mod.CustomerLogos })), { ssr: true });
const SocialProof = dynamic(() => import("@/components/SocialProof").then(mod => ({ default: mod.SocialProof })), { ssr: false });
const NewsletterSignup = dynamic(() => import("@/components/NewsletterSignup").then(mod => ({ default: mod.NewsletterSignup })), { ssr: false });
const ConversionCTA = dynamic(() => import("@/components/ConversionCTA").then(mod => ({ default: mod.ConversionCTA })), { ssr: true });
const AnimatedCodeBlock = dynamic(() => import("@/components/AnimatedCodeBlock").then(mod => ({ default: mod.AnimatedCodeBlock })), { ssr: false });
const AnimatedStatCard = dynamic(() => import("@/components/AnimatedStatCard").then(mod => ({ default: mod.AnimatedStatCard })), { ssr: true });
const TrustSignalBanner = dynamic(() => import("@/components/TrustSignalBanner").then(mod => ({ default: mod.TrustSignalBanner })), { ssr: true });
const EnhancedConversionCTA = dynamic(() => import("@/components/EnhancedConversionCTA").then(mod => ({ default: mod.EnhancedConversionCTA })), { ssr: true });
const InvestorMetrics = dynamic(() => import("@/components/marketing/InvestorMetrics").then(mod => ({ default: mod.InvestorMetrics })), { ssr: true });
const LiveMetricsCounter = dynamic(() => import("@/components/marketing/LiveMetricsCounter").then(mod => ({ default: mod.LiveMetricsCounter })), { ssr: false });
const ValueProposition = dynamic(() => import("@/components/marketing/ValueProposition").then(mod => ({ default: mod.ValueProposition })), { ssr: true });
const SocialProofCounter = dynamic(() => import("@/components/marketing/SocialProofCounter").then(mod => ({ default: mod.SocialProofCounter })), { ssr: true });
const UrgencyBanner = dynamic(() => import("@/components/marketing/UrgencyBanner").then(mod => ({ default: mod.UrgencyBanner })), { ssr: true });
const InvestorPitch = dynamic(() => import("@/components/marketing/InvestorPitch").then(mod => ({ default: mod.InvestorPitch })), { ssr: true });
const TestimonialCarousel = dynamic(() => import("@/components/marketing/TestimonialCarousel").then(mod => ({ default: mod.TestimonialCarousel })), { ssr: true });
const IntegrationLogos = dynamic(() => import("@/components/IntegrationLogos").then(mod => ({ default: mod.IntegrationLogos })), { ssr: true });
const EnhancedTrustBadges = dynamic(() => import("@/components/EnhancedTrustBadges").then(mod => ({ default: mod.EnhancedTrustBadges })), { ssr: true });
const InfographicSection = dynamic(() => import("@/components/marketing/InfographicSection").then(mod => ({ default: mod.InfographicSection })), { ssr: true });

export default function Home() {
  const trackCTA = useTrackCTA();

  // Track page view
  useEffect(() => {
    analytics.trackPageView('/', {
      title: 'Settler - The API Infrastructure for Financial Evidence',
    });
  }, []);

  const features = [
    {
      icon: RefreshCw,
      title: "Reconcile Anything",
      description: "Match transactions across Stripe, Shopify, DBs, and more using deterministic matching algorithms. Our event-sourced engine processes high-volume transactions efficiently.",
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
          className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[90vh] flex items-center"
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
                  The Financial Infrastructure for Developers
                </Badge>
                
                <TextRevealHeading
                  as="h1"
                  id="hero-heading"
                  text="The API Infrastructure for Financial Evidence, Deterministic Computation, and Developer Flags."
                  className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent"
                  delay={0}
                  staggerDelay={0.02}
                  splitBy="words"
                />
                
                <TextReveal
                  text="Settler gives engineering teams reconciliation, receipts parsing, deterministic conversions, and production-grade feature flags—all through clean, typed APIs."
                  className="text-xl md:text-2xl text-slate-700 dark:text-slate-300 mb-8 max-w-4xl mx-auto"
                  delay={0.2}
                  staggerDelay={0.01}
                  splitBy="words"
                />
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                  <Button 
                    size="lg" 
                    asChild 
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-10 py-7 text-xl font-bold shadow-2xl hover:shadow-blue-500/30 transition-all transform hover:scale-110 animate-pulse hover:animate-none"
                    onClick={() => trackCTA('Get API Key', { location: 'hero' })}
                  >
                    <Link href="/signup" className="flex items-center gap-2">
                      <span>Start Free Trial — No Credit Card</span>
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    asChild 
                    className="px-8 py-7 text-lg border-2 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-900"
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto mb-16">
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
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
                Core Primitives
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Everything you need to build reliable financial software, exposed as simple, composable APIs.
              </p>
            </div>
            
            <BentoGrid columns={2} gap="lg">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <BentoGridItem key={index} colSpan={1}>
                    <SpotlightCard className="h-full flex flex-col p-8">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} p-3.5 mb-6 flex items-center justify-center`}>
                        <Icon className="w-full h-full text-white" />
                      </div>
                      <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">{feature.title}</h3>
                      <p className="text-slate-600 dark:text-slate-300 text-lg mb-6 flex-grow">{feature.description}</p>
                      <div className="flex items-center text-blue-600 dark:text-blue-400 font-semibold group cursor-pointer">
                        Learn more <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </SpotlightCard>
                  </BentoGridItem>
                );
              })}
            </BentoGrid>
          </div>
        </section>

        {/* Code Example */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50">
           <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
             <div>
               <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900 dark:text-white">
                 Developer Experience First
               </h2>
               <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                 We've obsessed over every detail of our SDKs. Fully typed, extensive documentation, and zero-config defaults mean you can ship features faster.
               </p>
               <div className="space-y-4">
                 {[
                   "TypeScript, Python, Go, and Ruby SDKs",
                   "OpenAPI 3.1 Specification",
                   "Interactive Developer Console",
                   "Local Development Sandbox"
                 ].map((item, i) => (
                   <div key={i} className="flex items-center gap-3">
                     <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">✓</div>
                     <span className="text-slate-700 dark:text-slate-300 font-medium">{item}</span>
                   </div>
                 ))}
               </div>
               <div className="mt-8">
                 <Link href="/docs/sdk" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                   Explore the SDKs &rarr;
                 </Link>
               </div>
             </div>
             <div>
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

        {/* Infographics Section */}
        <InfographicSection />

        {/* Architecture Preview */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
             <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900 dark:text-white">
               Built on a Solid Foundation
             </h2>
             <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-12">
               See how we handle double-entry accounting, event sourcing, and edge execution to guarantee correctness.
             </p>
             <div className="relative group cursor-pointer" onClick={() => window.location.href='/architecture'}>
               <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-slate-900 via-transparent to-transparent z-10 flex items-end justify-center pb-8">
                 <Button variant="secondary" className="shadow-lg">View Full Architecture</Button>
               </div>
               <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden opacity-50 blur-[1px] group-hover:opacity-75 group-hover:blur-0 transition-all duration-500">
                  {/* Placeholder for architecture preview image/diagram */}
                  <div className="bg-slate-100 dark:bg-slate-800 h-[300px] w-full flex items-center justify-center">
                    <LayoutTemplate className="w-16 h-16 text-slate-300" />
                  </div>
               </div>
             </div>
          </div>
        </section>

        {/* Investor Metrics */}
        <InvestorMetrics />

        {/* Live Metrics Counter */}
        <LiveMetricsCounter />

        {/* Value Proposition */}
        <ValueProposition />

        {/* Integration Logos */}
        <IntegrationLogos />

        {/* Trust Signal Banner */}
        <TrustSignalBanner />

        {/* Enhanced Trust Badges */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-slate-800/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
                Trusted & Secure
              </h2>
            </div>
            <EnhancedTrustBadges />
          </div>
        </section>

        {/* Social Proof Counter */}
        <SocialProofCounter />

        {/* Why Settler */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,transparent)]" />
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Why Settler Exists</h2>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              We got tired of building the same fragile financial infrastructure at every company. 
              We built Settler to solve it once and for all.
            </p>
            <Button 
              size="lg" 
              variant="secondary" 
              asChild 
              className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
            >
              <Link href="/why-settler">Read our Manifesto</Link>
            </Button>
          </div>
        </section>

        {/* Social Proof */}
        <SocialProof />

        {/* Testimonial Carousel */}
        <TestimonialCarousel />

        {/* Investor Pitch Section */}
        <InvestorPitch />

        {/* Enhanced Conversion CTA */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800">
          <div className="max-w-4xl mx-auto">
            <EnhancedConversionCTA
              title="Ready to Transform Your Financial Operations?"
              description="Join thousands of companies already using Settler. Start your free trial today—no credit card required, full access to all features."
              primaryAction="Start Free Trial — No Credit Card"
              primaryLink="/signup"
              secondaryAction="View Pricing"
              secondaryLink="/pricing"
              showUrgency={true}
              showTrustBadges={true}
              variant="hero"
            />
          </div>
        </section>
        
        {/* Hidden Preload for components */}
        <div className="hidden">
          <TrustBadges />
          <CustomerLogos />
          <NewsletterSignup />
          <ConversionCTA />
          <IntegrationLogos />
        </div>

        <Footer />
      </div>
    </>
  );
}
