import { Metadata } from "next";
import Image from "next/image";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { AnimatedHero } from "@/components/AnimatedHero";
import { CTASection, Section, SectionHeader } from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowRight, Zap, Shield, Globe, LucideIcon } from "lucide-react";
import Link from "next/link";
import { VisualGrid } from "@/components/site/infographics";
import { COMMERCIAL_OFFERS, OfferCode } from "@/domain/billing/commercialModel";
import { PREMIUM_PACKS } from "@/domain/billing/premiumPacks";
import { calculateMonthlyCost, planConfigs } from "@/domain/billing/planConfig";

export const metadata: Metadata = {
  title: "Pricing | Settler",
  description: "Transparent pricing for high-integrity reconciliation infrastructure.",
};

const iconByOffer: Record<OfferCode, LucideIcon> = {
  oss: Globe,
  cloud: Zap,
  managed: Shield,
  enterprise: Shield,
};

export default function PricingPage() {
  const pricingScenarios = [
    {
      label: "Cloud API baseline",
      plan: "pro" as const,
      volume: 100_000,
      exceptions: 1_000,
    },
    {
      label: "Managed close operations",
      plan: "scale" as const,
      volume: 350_000,
      exceptions: 6_000,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <AnimatedHero
        badge="Pricing Plans"
        title="A clear model for evaluating Settler"
        description="Start with the open-source engine or evaluate the hosted and managed paths. Commercial availability, deployment scope, support, and service commitments are confirmed in writing."
      />

      {/* Pricing Cards */}
      <Section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title="Published evaluation model"
            description="Prices shown here are the current product configuration, not a substitute for an executed order form. Enterprise capabilities and support commitments remain architecture- and contract-scoped."
          />
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
            {COMMERCIAL_OFFERS.map((offer) => {
              const Icon = iconByOffer[offer.code];
              const features = [offer.evidencePosture, offer.deployment, offer.supportModel];
              const popular = offer.code === "cloud";

              return (
                <Card
                  key={offer.name}
                  className={`relative flex h-full flex-col border-border/40 transition-all duration-300 hover:shadow-xl motion-reduce:transition-none motion-reduce:hover:translate-y-0 hover:-translate-y-1 ${popular ? "border-primary shadow-lg ring-1 ring-primary/20" : ""}`}
                >
                  {popular && (
                    <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest shadow-lg">
                      Canonical Self-Serve
                    </div>
                  )}

                  <CardHeader className="p-8">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-xl font-bold">{offer.name}</CardTitle>
                    </div>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-4xl font-bold tracking-tight">
                        {offer.headlinePrice}
                      </span>
                      {offer.period && (
                        <span className="text-sm font-medium text-muted-foreground">
                          {offer.period}
                        </span>
                      )}
                    </div>
                    <CardDescription className="mt-4 leading-relaxed font-medium min-h-[3rem]">
                      {offer.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col p-8 pt-0">
                    <div className="space-y-4 mb-8 flex-1">
                      {features.map((feature) => (
                        <div key={feature} className="flex items-start gap-3">
                          <div className="mt-1 rounded-full bg-primary/10 p-1">
                            <Check className="h-3 w-3 text-primary" />
                          </div>
                          <span className="text-sm font-medium text-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Button
                      asChild
                      variant={popular ? "default" : "outline"}
                      className={`w-full h-12 font-bold group ${popular ? "text-lg" : ""}`}
                    >
                      <Link
                        href={offer.ctaHref}
                        data-cta={`pricing_${offer.code}`}
                        data-analytics={`pricing_${offer.code}_click`}
                        className="flex items-center justify-center gap-2"
                      >
                        {offer.ctaLabel}
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </Section>

      <Section className="border-t border-border/40 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <SectionHeader
                title="Metering truth (deterministic billing inputs)"
                description="Settler bills by reconciliation volume and exception load using canonical plan limits. The estimator below uses the same plan config contract used by the product."
              />
              <div className="grid gap-4">
                {pricingScenarios.map((scenario) =>
                  (() => {
                    const plan = planConfigs[scenario.plan];
                    if (!plan) return null;

                    return (
                      <Card
                        key={scenario.label}
                        className="border-border/50 bg-card/60 backdrop-blur-sm"
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg font-bold">{scenario.label}</CardTitle>
                          <CardDescription>
                            Plan: {plan.name} · {scenario.volume.toLocaleString()} reconciliations ·{" "}
                            {scenario.exceptions.toLocaleString()} exceptions
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm text-muted-foreground">
                            Estimated monthly bill:
                            <span className="ml-2 text-base font-semibold text-foreground">
                              $
                              {calculateMonthlyCost(
                                scenario.plan,
                                scenario.volume,
                                scenario.exceptions
                              ).toLocaleString()}
                            </span>
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                            Includes base fee plus usage under the canonical spine. Enterprise
                            contracts can override limits, retention, and support terms.
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })()
                )}
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="group relative aspect-square w-full max-w-[500px] mx-auto overflow-hidden rounded-3xl border border-primary/25 bg-card/70 shadow-2xl transition-all duration-500 hover:border-primary/45 hover:shadow-primary/15">
                <Image
                  src="/metering_infra_3d.png"
                  alt="Settler Deterministic Financial Metering & Settlement Engine"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/15 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/10 bg-black/60 backdrop-blur-md p-3 text-xs text-white/90 flex items-center justify-between">
                  <span className="font-mono text-[11px] text-emerald-400 font-semibold">
                    METERING INPUTS: EXPLICIT
                  </span>
                  <span className="font-mono text-[11px] text-cyan-300 font-bold">
                    PLAN CONFIG: VERSIONED
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section className="border-t border-border/40 py-16 sm:py-20 bg-muted/10">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title="Capability packs"
            description="Additive overlays on volume plans — each maps to real console routes today. Managed reliability is contractual (Managed / Enterprise), not a UI toggle."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {PREMIUM_PACKS.map((pack) => (
              <Card key={pack.code} className="border-border/50 h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg">{pack.name}</CardTitle>
                  <CardDescription className="leading-relaxed">{pack.summary}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end pt-0">
                  {pack.consoleRoutes.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Console surfaces
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1 font-mono">
                        {pack.consoleRoutes.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      Delivered via contract / operator engagement — no dedicated pack page in-app.
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground/80 mt-4">
                    Typical base: <span className="font-medium">{pack.suggestedBasePlan}</span>
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section className="border-t border-border/40 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <SectionHeader
            title="Frequently asked questions"
            description="Common questions about deployment, plans, and reconciliation volume."
          />
          <div className="mt-10 space-y-10">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Can I switch plans later?</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Plan changes use the product billing workflow. Moving between hosted and
                self-managed deployment requires a data and operations review before production
                cutover.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                What constitutes a reconciliation run?
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                A run is any triggered execution that compares a source and target dataset. Our
                pricing is based on reconciliation volume and exception supervision load.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                Is the Enterprise plan available on-prem?
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Enterprise deployment options are engagement-scoped. VPC and on-prem availability
                depend on architecture review, support model, and verified identity/export controls
                in your environment.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section className="bg-muted/10">
        <VisualGrid />
      </Section>

      <Section className="border-y border-border/40 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <SectionHeader
            title="An API-first evaluation path"
            description="Start with run creation, evidence retrieval, and replay routes. Move to Managed or Enterprise only after architecture, support, and reliability terms are agreed."
          />
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/docs/api">Review API contracts</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/openapi.json">Download OpenAPI</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/contact">Talk to solutions engineering</Link>
            </Button>
          </div>
        </div>
      </Section>

      <CTASection
        title="Ready to evaluate Settler?"
        description="Use the pilot guide or read the API documentation to test deterministic runs and evidence against your own acceptance criteria."
        primaryHref="/docs/pilot"
        primaryLabel="Plan an evaluation"
        secondaryHref="/docs"
        secondaryLabel="Read documentation"
      />

      <Footer />
    </div>
  );
}
