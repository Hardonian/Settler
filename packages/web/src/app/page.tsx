'use client';

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { HeroAnimationWrapper } from "@/components/HeroAnimationWrapper";
import { TextReveal, TextRevealHeading } from "@/components/ui/TextReveal";
import { ParallaxBackground, ParallaxBlobs } from "@/components/ui/ParallaxBackground";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { BentoGrid, BentoGridItem } from "@/components/ui/BentoGrid";
import { RefreshCw, FileText, Flag, Calculator, ArrowRight, LayoutTemplate, ZoomIn } from "lucide-react";
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
const HowItWorksStepper = dynamic(() => import("@/components/marketing/HowItWorksStepper").then(mod => ({ default: mod.HowItWorksStepper })), { ssr: false });
const Lightbox = dynamic(() => import("@/components/marketing/Lightbox").then(mod => ({ default: mod.Lightbox })), { ssr: false });
const BeforeAfterCompare = dynamic(() => import("@/components/marketing/BeforeAfterCompare").then(mod => ({ default: mod.BeforeAfterCompare })), { ssr: false });
const SafeImage = dynamic(() => import("@/components/marketing/SafeImage").then(mod => ({ default: mod.SafeImage })), { ssr: true });

export default function Home() {
  const trackCTA = useTrackCTA();
  const [lightboxOpen, setLightboxOpen] = useState(false);

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
      description: "Match transactions across Stripe, Shopify, DBs, and more with 100% accuracy. Our event-sourced engine handles millions of events per second.",
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
    { value: '100%', label: 'Accuracy', description: 'Deterministic math' },
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
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Left: Text Content */}
                <div className="text-center lg:text-left">
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
                    className="text-xl md:text-2xl text-slate-700 dark:text-slate-300 mb-8 max-w-4xl mx-auto lg:mx-0"
                    delay={0.2}
                    staggerDelay={0.01}
                    splitBy="words"
                  />
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center mb-8">
                    <Button 
                      size="lg" 
                      asChild 
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg shadow-lg hover:shadow-blue-500/20 transition-all transform hover:scale-105"
                      onClick={() => trackCTA('Get API Key', { location: 'hero' })}
                    >
                      <Link href="/signup">
                        Get API Key
                      </Link>
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline" 
                      asChild 
                      className="px-8 py-6 text-lg border-2"
                    >
                      <Link href="/docs">
                        View Docs
                      </Link>
                    </Button>
                  </div>
                  
                  {/* Hero Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2 gap-4 max-w-2xl mx-auto lg:mx-0">
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

                {/* Right: Hero Image */}
                <div className="relative">
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 p-2">
                    <SafeImage
                      src="/brand/hero.jpg"
                      alt="Settler API infrastructure visualization showing reconciliation, receipts parsing, and feature flags"
                      fill
                      className="object-cover rounded-xl"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority
                    />
                  </div>
                </div>
              </div>

              {/* Trust Row */}
              <div className="mt-16">
                <TrustBadges />
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

        {/* How It Works Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
                How It Works
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Get started in minutes with our simple 4-step workflow. Connect platforms, define rules, run reconciliation, and review results.
              </p>
            </div>
            <HowItWorksStepper
              steps={[
                {
                  number: 1,
                  title: "Connect Your Platforms",
                  description: "Connect Shopify, Stripe, PayPal, QuickBooks, or any of our 10+ pre-built adapters.",
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
                  description: "Set up intelligent matching rules: exact match, fuzzy match, or custom logic.",
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
                  description: "Process millions of transactions in minutes. Real-time webhooks or scheduled batch processing.",
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
                  description: "99.7% accuracy with complete visibility. See matched, unmatched, and conflicts.",
                  details: [
                    "View detailed match reports",
                    "Export to CSV, JSON, or PDF",
                    "Track reconciliation history",
                    "Generate compliance reports",
                  ],
                },
              ]}
              workflowImageSrc="/brand/workflow.jpg"
              workflowImageAlt="Settler workflow diagram showing the 4-step reconciliation process"
            />
            <div className="text-center mt-12">
              <Button size="lg" asChild variant="outline">
                <Link href="/how-it-works">Learn More About Our Process</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Architecture Preview */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
             <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900 dark:text-white">
               Built on a Solid Foundation
             </h2>
             <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-12">
               See how we handle double-entry accounting, event sourcing, and edge execution to guarantee correctness.
             </p>
             <div className="relative group">
               <div 
                 className="relative border-2 border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden cursor-pointer hover:border-blue-500 dark:hover:border-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                 onClick={() => setLightboxOpen(true)}
                 role="button"
                 tabIndex={0}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' || e.key === ' ') {
                     e.preventDefault();
                     setLightboxOpen(true);
                   }
                 }}
                 aria-label="View architecture diagram in full screen"
               >
                 <SafeImage
                   src="/brand/architecture.png"
                   alt="Settler architecture diagram showing API gateway, services layer, and distributed data store"
                   width={1200}
                   height={600}
                   className="object-contain"
                   sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                   <div className="flex items-center gap-2 text-white bg-black/40 backdrop-blur-sm px-4 py-2 rounded-lg">
                     <ZoomIn className="w-5 h-5" />
                     <span className="font-semibold">Click to view full size</span>
                   </div>
                 </div>
               </div>
               <div className="mt-8">
                 <Button variant="secondary" asChild>
                   <Link href="/architecture">View Full Architecture Details</Link>
                 </Button>
               </div>
             </div>
             <Lightbox
               isOpen={lightboxOpen}
               onClose={() => setLightboxOpen(false)}
               src="/brand/architecture.png"
               alt="Settler architecture diagram showing API gateway, services layer, and distributed data store"
               title="Settler Architecture"
               description="Event-sourced reconciliation engine with edge-optimized API gateway and distributed data store"
             />
          </div>
        </section>

        {/* Before & After Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
                See the Difference
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Compare manual reconciliation processes with Settler's automated solution. Drag the slider to explore the transformation.
              </p>
            </div>
            <div className="max-w-5xl mx-auto mb-12">
              <BeforeAfterCompare
                imageSrc="/brand/before-after.png"
                imageAlt="Comparison of manual reconciliation vs automated Settler reconciliation"
                beforeLabel="Manual Process"
                afterLabel="With Settler"
              />
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">What Changes</h3>
                <ul className="text-slate-600 dark:text-slate-400 space-y-2 text-left">
                  <li>• Hours of manual work → Minutes</li>
                  <li>• Error-prone spreadsheets → Automated matching</li>
                  <li>• Reactive troubleshooting → Proactive alerts</li>
                </ul>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">What Improves</h3>
                <ul className="text-slate-600 dark:text-slate-400 space-y-2 text-left">
                  <li>• Accuracy: 99.7% match rate</li>
                  <li>• Speed: Process millions in minutes</li>
                  <li>• Visibility: Complete audit trail</li>
                </ul>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">What You Stop Worrying About</h3>
                <ul className="text-slate-600 dark:text-slate-400 space-y-2 text-left">
                  <li>• Missing transactions</li>
                  <li>• Reconciliation backlogs</li>
                  <li>• Compliance reporting</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Why Settler */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Why Settler Exists</h2>
            <p className="text-xl text-blue-100 mb-8">
              We got tired of building the same fragile financial infrastructure at every company. 
              We built Settler to solve it once and for all.
            </p>
            <Button size="lg" variant="secondary" asChild className="text-blue-600">
              <Link href="/why-settler">Read our Manifesto</Link>
            </Button>
          </div>
        </section>

        {/* Social Proof */}
        <SocialProof />
        
        {/* Hidden Preload for components */}
        <div className="hidden">
          <TrustBadges />
          <CustomerLogos />
          <NewsletterSignup />
          <ConversionCTA />
        </div>

        <Footer />
      </div>
    </>
  );
}
