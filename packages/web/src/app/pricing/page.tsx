import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { AnimatedHero } from "@/components/AnimatedHero";
import { FeatureComparison } from "@/components/FeatureComparison";
import { CTASection, Section, SectionHeader } from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowRight, Zap, Shield, Globe } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Pricing | Settler",
  description: "Transparent pricing for high-integrity reconciliation infrastructure.",
};

const plans = [
  {
    name: "Open Source",
    price: "$0",
    description: "Self-hosted reconciliation for small teams and developers.",
    features: [
      "Core Reconciliation Engine",
      "Standard Platform Adapters",
      "Local Result Export",
      "Community Support",
      "Self-managed Infrastructure",
    ],
    cta: "Download OSS",
    href: "/docs/getting-started",
    icon: Globe,
    popular: false,
  },
  {
    name: "Commercial",
    price: "$99",
    period: "/mo",
    description: "Cloud-hosted with high-availability and advanced drift detection.",
    features: [
      "Everything in OSS",
      "Managed Cloud Deployment",
      "SSO & RBAC Security",
      "Priority Email Support",
      "Unlimited Platform Adapters",
      "30-day History Retention",
    ],
    cta: "Start Free Trial",
    href: "/signup",
    icon: Zap,
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Tailored infrastructure for high-volume financial flows.",
    features: [
      "Everything in Commercial",
      "Custom Adapter Development",
      "Dedicated Infrastructure",
      "Infinite History Retention",
      "24/7 SLA & Incident Response",
      "On-premise Deployment Option",
    ],
    cta: "Contact Sales",
    href: "/contact",
    icon: Shield,
    popular: false,
  },
];

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
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex h-full flex-col border-border/40 transition-all duration-300 hover:shadow-xl motion-reduce:transition-none motion-reduce:hover:translate-y-0 hover:-translate-y-1 ${plan.popular ? "border-primary shadow-lg ring-1 ring-primary/20" : ""}`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest shadow-lg">
                  Most Popular
                </div>
              )}

              <CardHeader className="p-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <plan.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                </div>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                  {plan.period && (
                    <span className="text-sm font-medium text-muted-foreground">{plan.period}</span>
                  )}
                </div>
                <CardDescription className="mt-4 leading-relaxed font-medium min-h-[3rem]">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-8 pt-0">
                <div className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <div className="mt-1 rounded-full bg-primary/10 p-1">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <Button
                  asChild
                  variant={plan.popular ? "default" : "outline"}
                  className={`w-full h-12 font-bold group ${plan.popular ? "text-lg" : ""}`}
                >
                  <Link href={plan.href} className="flex items-center justify-center gap-2">
                    {plan.cta}
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
            ))}
          </div>
        </div>
      </Section>

      {/* Feature Comparison */}
      <FeatureComparison />

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
                Downgrading from Commercial to OSS requires setting up your own hosting environment.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                What constitutes a reconciliation run?
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                A run is any triggered execution that compares a source and target dataset. Our
                pricing is based on volume and required data retention rather than just run counts.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                Is the Enterprise plan available on-prem?
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Yes. For highly regulated industries, we provide a containerized version of the
                Settler stack for air-gapped or VPC deployments.
              </p>
            </div>
          </div>
        </div>
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
