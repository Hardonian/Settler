import { Metadata } from "next";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { PublicPageShell, Section, SectionHeader } from "@/components/site/primitives";
import { CompetitiveComparisonTable } from "@/components/pricing/CompetitiveComparisonTable";
import { ROICalculator } from "@/components/pricing/ROICalculator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  Cpu,
  ArrowRight,
  Clock,
  DollarSign,
  FileCheck2,
  Lock,
  Layers,
  Sparkles,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Settler vs. Competitors | BlackLine & Modern Treasury Comparison",
  description:
    "Rigorous architectural, economic, and operational comparison between Settler, BlackLine, Modern Treasury, and custom in-house scripts.",
};

export default function ComparePage() {
  return (
    <PublicPageShell>
      <Navigation />

      <main id="main-content" className="pt-20">
        {/* Hero Section */}
        <section className="relative px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-16 lg:pb-24 max-w-7xl mx-auto text-center">
          <Badge
            variant="outline"
            className="mb-4 border-primary/40 bg-primary/5 text-primary text-xs font-bold uppercase tracking-widest px-3 py-1"
          >
            Technical Due Diligence &amp; Market Comparison
          </Badge>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight max-w-4xl mx-auto leading-tight">
            Why High-Growth Companies Choose{" "}
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              Settler
            </span>
          </h1>
          <p className="mt-6 text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Legacy financial close monoliths take 6 months of consulting and produce static PDFs.
            In-house scripts drift and fail audits. Settler delivers mathematical determinism,
            sub-millisecond continuous close, and cryptographic proofpacks.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="font-bold px-8 h-12 shadow-lg">
              <Link href="/pricing">
                View Transparent Pricing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="font-semibold h-12">
              <Link href="/docs">Explore Developer Docs</Link>
            </Button>
          </div>
        </section>

        {/* Executive Comparison Table */}
        <Section className="border-t border-border/40 py-16 sm:py-20 bg-muted/10">
          <div className="mx-auto max-w-7xl">
            <CompetitiveComparisonTable />
          </div>
        </Section>

        {/* Deep Dive 1: Settler vs BlackLine */}
        <Section className="border-t border-border/40 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-5 space-y-4">
                <Badge variant="secondary" className="text-xs font-bold uppercase">
                  Legacy Enterprise Comparison
                </Badge>
                <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
                  Settler vs. BlackLine
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  BlackLine (NASDAQ: BL) is the legacy market leader built in the 2000s for batch
                  ERP account reconciliations. While dominant in traditional Fortune 500 accounting
                  departments, its architectural age creates severe operational bottlenecks for
                  modern engineering and finance teams.
                </p>
                <div className="pt-2">
                  <div className="rounded-lg bg-card border border-border p-4 space-y-2">
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Zap className="h-4 w-4 text-amber-500" />
                      The Bottom Line:
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Don&apos;t wait 6 months and pay $150K+ in consulting fees. Deploy Settler in
                      10 minutes, run deterministic matching with sub-second latency, and hand your
                      auditors cryptographic proofpacks that eliminate audit sampling entirely.
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="border-border/60 bg-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 text-rose-500 text-sm font-semibold">
                      <Clock className="h-4 w-4" />
                      BlackLine Limitations
                    </div>
                    <CardTitle className="text-base">Slow, High-Friction Onboarding</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground space-y-2.5">
                    <p>
                      • Requires 3–6 months of expensive professional services and custom ETL
                      setups.
                    </p>
                    <p>
                      • No developer APIs or CLI; cannot be embedded into real-time CI/CD pipelines.
                    </p>
                    <p>
                      • Audit output is &quot;paper-based&quot; static PDFs requiring auditors to
                      manually sample entries.
                    </p>
                    <p>• High annual contracts ($100K–$250K/yr) with opaque pricing barriers.</p>
                  </CardContent>
                </Card>

                <Card className="border-primary/40 bg-primary/5 shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 text-primary text-sm font-semibold">
                      <Cpu className="h-4 w-4" />
                      Settler Advantages
                    </div>
                    <CardTitle className="text-base">API-First Deterministic Engine</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-foreground/90 space-y-2.5">
                    <p>
                      • First live reconciliation in &lt; 10 minutes via modern TypeScript SDK and
                      CLI.
                    </p>
                    <p>
                      • Sub-millisecond continuous T+0 close powered by Rust kernel and TigerBeetle
                      2PC.
                    </p>
                    <p>
                      • RFC 6962 SHA-256 Merkle proofpacks proven mathematically via WASM client.
                    </p>
                    <p>
                      • Transparent pricing: Open source free tier, $99 Pro, and pay-as-you-grow
                      metering.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </Section>

        {/* Deep Dive 2: Settler vs Modern Treasury */}
        <Section className="border-t border-border/40 py-16 sm:py-24 bg-muted/10">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-5 space-y-4">
                <Badge variant="secondary" className="text-xs font-bold uppercase">
                  Modern API Clarification
                </Badge>
                <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
                  Settler vs. Modern Treasury
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  Modern Treasury is an exceptional payment operations platform built around direct
                  bank integrations and payment initiation (ACH, Wire, RTP). Settler is
                  purpose-built for multi-source reconciliation intelligence, processor fee
                  verification, and cryptographic audit proofs.
                </p>
                <div className="pt-2">
                  <div className="rounded-lg bg-card border border-border p-4 space-y-2">
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-blue-500" />
                      Natural Synergy &amp; Complementary Roles:
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Settler natively ingests Modern Treasury ledger feeds and reconciles them
                      against merchant processors (Stripe, PayPal), e-commerce platforms (Shopify),
                      and ERP systems (NetSuite, SAP) to prove external ledger balance.
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="border-border/60 bg-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 text-indigo-500 text-sm font-semibold">
                      <Layers className="h-4 w-4" />
                      Modern Treasury Role
                    </div>
                    <CardTitle className="text-base">Bank Rails &amp; Payment Initiation</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground space-y-2.5">
                    <p>
                      • Connects directly to commercial banking partners for ACH, Wire, and FedNow.
                    </p>
                    <p>• Maintains internal ledger accounts for tracking money movement.</p>
                    <p>
                      • Focuses on initiating and moving funds rather than multi-processor fee
                      leakage audit.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-primary/40 bg-primary/5 shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 text-primary text-sm font-semibold">
                      <ShieldCheck className="h-4 w-4" />
                      Settler Reconciliation Scope
                    </div>
                    <CardTitle className="text-base">Comprehensive Audit OS</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-foreground/90 space-y-2.5">
                    <p>
                      • Cross-provider reconciliation across Stripe, PayPal, Adyen, SAP, and bank
                      statements.
                    </p>
                    <p>
                      • Detects hidden interchange fee leakage and uncontracted tier creep
                      automatically.
                    </p>
                    <p>
                      • Generates portable, tamper-evident proofpacks verifiable offline by external
                      auditors.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </Section>

        {/* Deep Dive 3: The Danger of Custom In-House Scripts */}
        <Section className="border-t border-border/40 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <SectionHeader
              title="The Hidden Cost of In-House Python &amp; SQL Scripts"
              description="Why engineering teams that build their own reconciliation scripts eventually face operational drag, floating-point drift, and audit panic."
            />
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-border/60 bg-card">
                <CardHeader>
                  <DollarSign className="h-8 w-8 text-rose-500 mb-2" />
                  <CardTitle className="text-lg">IEEE-754 Floating-Point Drift</CardTitle>
                  <CardDescription>
                    Custom scripts using standard database floats lose pennies across high
                    transaction volumes, leading to balance mismatches that fail SOC 1 and SOX
                    compliance.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground pt-0">
                  <span className="font-semibold text-foreground">Settler Solution:</span> Exact
                  64-bit integer cents arithmetic in Rust ensures 0.000000% mathematical drift
                  across trillions of cents.
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card">
                <CardHeader>
                  <ShieldAlert className="h-8 w-8 text-amber-500 mb-2" />
                  <CardTitle className="text-lg">Zero Cryptographic Proof</CardTitle>
                  <CardDescription>
                    When auditors request evidence, custom scripts can only output CSV logs that
                    could easily have been modified or overwritten after the fact.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground pt-0">
                  <span className="font-semibold text-foreground">Settler Solution:</span> Every
                  match run generates an immutable RFC 6962 Merkle proofpack signed with SHA-256 and
                  content-addressable storage (CAS).
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card">
                <CardHeader>
                  <Lock className="h-8 w-8 text-blue-500 mb-2" />
                  <CardTitle className="text-lg">Connector Maintenance Sinkhole</CardTitle>
                  <CardDescription>
                    Payment gateways update webhook payloads, exchange rate APIs drift, and bank
                    export formats shift, turning internal scripts into an endless maintenance tax.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground pt-0">
                  <span className="font-semibold text-foreground">Settler Solution:</span> 30+
                  turnkey, verified connectors maintained and tested continuously against live
                  schemas and rate changes.
                </CardContent>
              </Card>
            </div>
          </div>
        </Section>

        {/* ROI Calculator Section */}
        <Section className="border-t border-border/40 py-16 sm:py-24 bg-muted/10">
          <div className="mx-auto max-w-7xl">
            <SectionHeader
              title="Calculate Your Reconciliation ROI"
              description="See how much engineering time, audit consulting fees, and payment processor float leakage Settler saves your organization."
            />
            <div className="mt-10">
              <ROICalculator />
            </div>
          </div>
        </Section>

        {/* CTA Section */}
        <Section className="border-t border-border/40 py-16 sm:py-24 text-center">
          <div className="mx-auto max-w-4xl space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Ready to Upgrade from Batch Lag to Mathematical Determinism?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base">
              Start with our free open-source engine, run your first test reconciliation in 10
              minutes, or schedule an architecture walkthrough with our core engineering team.
            </p>
            <div className="pt-4 flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="font-bold px-8 h-12 shadow-lg">
                <Link href="/pricing">Get Started with Settler</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 font-semibold">
                <Link href="/contact">Book Technical Architecture Review</Link>
              </Button>
            </div>
          </div>
        </Section>
      </main>

      <Footer />
    </PublicPageShell>
  );
}
