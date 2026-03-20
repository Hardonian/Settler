import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { AnimatedHero } from "@/components/AnimatedHero";
import { FeatureComparison } from "@/components/FeatureComparison";
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
    href: "/docs/oss-setup",
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
        title="High-Integrity Infrastructure, Low-Frustation Pricing"
        description="Choose the plan that matches your volume and governance requirements. From open-source developers to global enterprise flows."
      />

      {/* Pricing Cards */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col h-full border-border/40 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${plan.popular ? "border-primary shadow-lg ring-1 ring-primary/20" : ""}`}
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
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
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
      </section>

      {/* Feature Comparison */}
      <FeatureComparison />

      {/* Simple FAQ Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-border/40">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4 italic tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground font-medium">
            Common inquiries regarding Settler deployment and scaling.
          </p>
        </div>

        <div className="space-y-12">
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Can I switch plans later?</h3>
            <p className="text-muted-foreground leading-relaxed">
              Absolutely. Our cloud infrastructure supports seamless migration between plans.
              Downgrading from Commercial to OSS requires setting up your own hosting environment.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-bold">What constitutes a 'Reconciliation Run'?</h3>
            <p className="text-muted-foreground leading-relaxed">
              A run is any triggered execution that compares a source and target dataset. Our
              pricing is based on volume and required data retention rather than just run counts.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Is the Enterprise plan available on-prem?</h3>
            <p className="text-muted-foreground leading-relaxed">
              Yes. For highly regulated industries, we provide a containerized version of the
              Settler stack for air-gapped or VPC deployments.
            </p>
          </div>
        </div>
      </section>

      {/* Pre-footer CTA */}
      <section className="py-24 bg-primary/5 border-y border-primary/10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight italic">
            Ready to Ensure Integrity?
          </h2>
          <p className="text-xl text-muted-foreground mb-10 leading-relaxed font-medium">
            Join the teams building deterministic financial pipelines with Settler today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="h-14 px-8 text-lg font-bold">
              <Link href="/signup">Start Free Trial</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg font-bold">
              <Link href="/docs">Read the Docs</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
