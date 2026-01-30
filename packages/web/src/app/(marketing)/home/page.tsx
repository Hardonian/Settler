'use client';

import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { HeroAnimationWrapper } from "@/components/HeroAnimationWrapper";
import { TextReveal, TextRevealHeading } from "@/components/ui/TextReveal";
import { ParallaxBackground, ParallaxBlobs } from "@/components/ui/ParallaxBackground";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { FeatureShowcase } from "@/components/landing/FeatureShowcase";
import { ComparisonTable } from "@/components/landing/ComparisonTable";
import { 
  TestimonialCarousel,
  ROICalculator,
  ValueProposition,
  SocialProofCounter,
  AutomationHighlight
} from "@/components/marketing";
import { 
  Database, 
  Sliders, 
  AlertTriangle, 
  Eye, 
  ArrowRight,
  Shield,
  RefreshCw,
  Zap,
  CheckCircle2,
  Clock,
  Lock
} from "lucide-react";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Dynamic imports for heavy components
const AnimatedCodeBlock = dynamic(() => import("@/components/AnimatedCodeBlock").then(mod => ({ default: mod.AnimatedCodeBlock })), { ssr: false });

export default function HomePage() {
  const howItWorksSteps = [
    {
      number: 1,
      title: "Ingest Data",
      description: "Bring data in through adapters, files, or your own pipelines.",
      icon: Database,
    },
    {
      number: 2,
      title: "Normalize",
      description: "Map records into a canonical schema with explicit, inspectable transforms.",
      icon: Sliders,
    },
    {
      number: 3,
      title: "Apply Rules",
      description: "Run deterministic matching rules and tolerances you define.",
      icon: Eye,
    },
    {
      number: 4,
      title: "Surface Variances",
      description: "Generate variance sets and evidence for human review.",
      icon: AlertTriangle,
    },
  ];

  const codeExample = `import { SettlerClient } from "@settler/sdk";

const client = new SettlerClient({ apiKey: "sk_live_..." });

// Run a deterministic reconciliation
const reconciliation = await client.reconciliations.create({
  source: { adapter: "stripe" },
  target: { adapter: "database" },
  rules: { matching: [{ field: "amount", tolerance: 0.01 }] }
});`;

  const benefits = [
    { icon: Clock, title: "Save 20+ hours/week", description: "Automate manual reconciliation tasks" },
    { icon: Shield, title: "99.9% accuracy", description: "Deterministic matching with full audit trail" },
    { icon: Lock, title: "SOC 2 ready", description: "Enterprise security & compliance" },
    { icon: Zap, title: "Real-time sync", description: "Process thousands of transactions per second" },
  ];

  return (
    <ErrorBoundary context="Home Page">
      <div 
        id="main-content"
        className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black"
        role="main"
        aria-label="Settler homepage"
      >
        <Navigation />

        {/* Hero Section */}
        <section 
          className="relative pt-12 sm:pt-20 lg:pt-24 pb-20 sm:pb-24 lg:pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[85vh] sm:min-h-[90vh] lg:min-h-[92vh] flex items-center"
          aria-labelledby="hero-heading"
        >
          <ParallaxBackground>
            <ParallaxBlobs count={3} />
          </ParallaxBackground>
          
          {/* Grid pattern background */}
          <div 
            className="absolute inset-0 bg-grid-slate-200 dark:bg-grid-slate-800 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.3))] -z-10"
            aria-hidden="true"
          />
          
          {/* Subtle gradient overlay for depth */}
          <div 
            className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-50/50 dark:to-slate-900/30 -z-10"
            aria-hidden="true"
          />
          
          <div className="max-w-7xl mx-auto relative z-10 w-full">
            <HeroAnimationWrapper>
              <div className="text-center max-w-5xl mx-auto">
                {/* Badge */}
                <Badge className="mb-6 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800 px-4 py-1.5 text-sm font-medium">
                  Open Source Reconciliation Engine
                </Badge>

                {/* Main headline with constrained width for readability */}
                <div className="mb-6 sm:mb-8 lg:mb-10">
                  <TextRevealHeading
                    as="h1"
                    id="hero-heading"
                    text="Stop Manually Reconciling. Start Automating."
                    className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[4.5rem] font-bold mb-4 sm:mb-5 lg:mb-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-100 dark:to-white bg-clip-text text-transparent leading-[1.1] tracking-tight px-2"
                    delay={0}
                    staggerDelay={0.02}
                    splitBy="words"
                  />
                </div>
                
                {/* Subheadline with optimal reading width */}
                <div className="mb-10 sm:mb-12 lg:mb-14 px-4">
                  <TextReveal
                    text="Settler normalizes financial data, applies explicit matching rules, and surfaces variances for review. Deterministic, inspectable, and designed for human-in-the-loop workflows."
                    className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-slate-700 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal"
                    delay={0.2}
                    staggerDelay={0.01}
                    splitBy="words"
                  />
                </div>
                
                {/* CTA buttons with clear hierarchy */}
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center items-center mb-12 sm:mb-14 lg:mb-16 px-4">
                  <Button 
                    size="lg" 
                    asChild 
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-10 sm:px-12 py-6 sm:py-7 text-lg sm:text-xl font-semibold shadow-2xl hover:shadow-blue-500/40 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-4 focus-visible:ring-offset-background min-h-[56px] sm:min-h-[60px]"
                  >
                    <Link href="/docs/quickstart" className="flex items-center justify-center gap-2">
                      <span>Get Started Free</span>
                      <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
                    </Link>
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    asChild 
                    className="w-full sm:w-auto px-8 sm:px-10 py-6 sm:py-7 text-lg sm:text-xl border-2 border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-4 focus-visible:ring-offset-background min-h-[56px] sm:min-h-[60px] font-medium"
                  >
                    <Link href="/console">
                      Try Demo
                    </Link>
                  </Button>
                </div>


              </div>
            </HeroAnimationWrapper>
          </div>
        </section>

        {/* Value Proposition */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900">
          <div className="max-w-7xl mx-auto">
            <ValueProposition />
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
                Why Teams Choose Settler
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Built for finance teams who need certainty, not black boxes
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <SpotlightCard key={index} className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">{benefit.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{benefit.description}</p>
                  </SpotlightCard>
                );
              })}
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <SocialProofCounter />

        {/* Feature Showcase */}
        <FeatureShowcase />

        {/* How It Works - 4 Steps */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <Badge className="mb-4 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                How It Works
              </Badge>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
                From Messy Data to Clear Insights
              </h2>
              <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
                A deterministic pipeline that turns messy financial inputs into traceable variances your team can review.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {howItWorksSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <SpotlightCard key={index} className="p-6 sm:p-8 text-center relative">
                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                      {step.number}
                    </div>
                    <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <Icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold mb-2 text-slate-900 dark:text-white">{step.title}</h3>
                    <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">{step.description}</p>
                  </SpotlightCard>
                );
              })}
            </div>
          </div>
        </section>

        {/* Product in Motion - Code Example */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10 md:mb-12">
              <Badge className="mb-4 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400">
                Developer First
              </Badge>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
                Deterministic Rules You Can Inspect
              </h2>
              <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Every reconciliation run is explainable and replayable. No hidden heuristics, no silent edits.
              </p>
            </div>
            <SpotlightCard className="p-0 overflow-hidden shadow-xl md:shadow-2xl">
              <AnimatedCodeBlock
                code={codeExample}
                title="Rules-First API"
                description="Explicit rules, deterministic outputs, and inspectable evidence."
                language="typescript"
              />
            </SpotlightCard>
            
            {/* Code features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {[
                { icon: CheckCircle2, title: "Type Safe", desc: "Full TypeScript support" },
                { icon: RefreshCw, title: "Replayable", desc: "Same inputs, same outputs" },
                { icon: Shield, title: "Auditable", desc: "Complete evidence chain" },
              ].map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">{feature.title}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{feature.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
                Compare Settler
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                See how Settler compares to manual processes and other solutions
              </p>
            </div>
            <ComparisonTable />
          </div>
        </section>

        {/* ROI Calculator */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                ROI Calculator
              </Badge>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
                Calculate Your Savings
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                See how much time and money you can save by automating reconciliation
              </p>
            </div>
            <ROICalculator />
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                Customer Stories
              </Badge>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
                Loved by Finance Teams
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                See what teams are saying about their reconciliation automation
              </p>
            </div>
            <TestimonialCarousel />
          </div>
        </section>

        {/* Automation Highlight */}
        <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800">
          <div className="max-w-5xl mx-auto">
            <AutomationHighlight />
          </div>
        </section>

        {/* Details Accordion */}
        <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
                Common Questions
              </h2>
            </div>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="features">
                <AccordionTrigger className="text-base md:text-lg font-semibold">
                  What does Settler do?
                </AccordionTrigger>
                <AccordionContent className="text-sm md:text-base text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
                  <p><strong>Surfaces discrepancies:</strong> Outputs variance sets instead of silently resolving them.</p>
                  <p><strong>Deterministic and inspectable:</strong> Same inputs produce the same outputs, with traceable rule paths.</p>
                  <p><strong>Provider-agnostic:</strong> Normalize from any adapter or file format into a canonical model.</p>
                  <p><strong>Human-in-the-loop:</strong> Review and resolve exceptions with evidence attached.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="not">
                <AccordionTrigger className="text-base md:text-lg font-semibold">
                  What is Settler NOT?
                </AccordionTrigger>
                <AccordionContent className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  <p>Settler is not accounting software, an audit tool, or compliance software. It does not guarantee correctness and does not automate judgment. It surfaces variances for human review.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="security">
                <AccordionTrigger className="text-base md:text-lg font-semibold">
                  How secure is Settler?
                </AccordionTrigger>
                <AccordionContent className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  <p>Audit evidence is produced as deterministic outputs. You decide how to review and certify results. See the <Link href="/security-and-audit" className="text-blue-600 dark:text-blue-400 hover:underline">Security & Audit</Link> page for disclosure and limits.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="opensource">
                <AccordionTrigger className="text-base md:text-lg font-semibold">
                  Is Settler really open source?
                </AccordionTrigger>
                <AccordionContent className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  <p>Yes! Settler is open source under the Apache 2.0 license. You can self-host it, modify it, and contribute back. The core reconciliation engine is fully open source.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-900 dark:via-indigo-900 dark:to-purple-900">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white">
              Ready to Automate Reconciliation?
            </h2>
            <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed">
              Join thousands of teams who have eliminated manual reconciliation. Start free, scale as you grow.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                asChild 
                className="w-full sm:w-auto bg-white text-blue-600 hover:bg-blue-50 px-10 py-6 sm:py-7 text-lg font-semibold shadow-2xl transition-all transform hover:scale-[1.02]"
              >
                <Link href="/docs/quickstart" className="flex items-center justify-center gap-2">
                  Get Started Free <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                asChild 
                className="w-full sm:w-auto px-10 py-6 sm:py-7 text-lg border-2 border-white/30 text-white hover:bg-white/10"
              >
                <Link href="/console">
                  Try Live Demo
                </Link>
              </Button>
            </div>
            <p className="mt-6 text-sm text-blue-200">
              No credit card required. Self-host or use our cloud.
            </p>
          </div>
        </section>

        <Footer />
      </div>
    </ErrorBoundary>
  );
}
