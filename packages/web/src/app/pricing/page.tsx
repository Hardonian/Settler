import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { AnimatedHero } from "@/components/AnimatedHero";
import { FeatureComparison } from "@/components/FeatureComparison";
import { CTASection, Section, SectionHeader } from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowRight, Zap, Shield, Globe, LucideIcon } from "lucide-react";
import Link from "next/link";
import { VisualGrid } from "@/components/site/infographics";
import { COMMERCIAL_OFFERS, OfferCode } from "@/domain/billing/commercialModel";
import { PREMIUM_PACKS } from "@/domain/billing/premiumPacks";

export const metadata = {
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
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <AnimatedHero
        badge="Pricing Plans"
        title="High-Integrity Infrastructure, Low-Frustration Pricing"
        description="Choose the plan that matches your volume and governance requirements. From open-source developers to global enterprise flows."
      />

      {/* Pricing Cards */}
      <Section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl">
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
                      <Link href={offer.ctaHref} className="flex items-center justify-center gap-2">
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

      {/* Feature Comparison */}
      <FeatureComparison />

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
                Absolutely. Our cloud infrastructure supports seamless migration between plans.
                Downgrading from Cloud API to OSS requires moving to self-managed deployment.
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

      <CTASection
        title="Ready to evaluate Settler?"
        description="Start a trial or read the docs to see how deterministic runs and evidence fit your stack."
        primaryHref="/signup"
        primaryLabel="Start free trial"
        secondaryHref="/docs"
        secondaryLabel="Read documentation"
      />

      <Footer />
    </div>
  );
}
