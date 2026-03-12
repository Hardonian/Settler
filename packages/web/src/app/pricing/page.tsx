/**
 * Pricing Page - Flexible engagement models for serious operators
 */

import { Metadata } from "next";
import Image from "next/image";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Section } from "@/components/marketing/Section";
import { FeatureList } from "@/components/marketing/FeatureList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UiLink } from "@/components/ui/link";
import {
  ArrowRight,
  Layers,
  BarChart3,
  Building2,
  Rocket,
  Settings2,
  Code2,
  Phone,
} from "lucide-react";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: "Engagement Models - Settler",
  description:
    "Flexible deployment and engagement options designed to scale with workflow complexity. Built for integration depth. Structured for serious operators.",
};

const engagementModels = [
  {
    name: "Self-Serve",
    positioning: "For teams ready to deploy immediately",
    description:
      "Technical self-serve onboarding with full API access, documentation, and community support.",
    capabilities: [
      "Full API and SDK access",
      "Standard integrations",
      "Community support",
      "Deterministic audit trails",
      "Usage-based scaling",
    ],
    cta: "Start Building",
    ctaLink: "/docs/quickstart",
    highlight: false,
    icon: Code2,
  },
  {
    name: "Managed Deployment",
    positioning: "For teams scaling reconciliation workflows",
    description:
      "Modular usage-based scaling with priority support and advanced integration tooling.",
    capabilities: [
      "Priority technical support",
      "Advanced adapter configuration",
      "SOC 2 compliance readiness",
      "Extended data retention",
      "Dedicated onboarding session",
    ],
    cta: "Explore Deployment Options",
    ctaLink: "/contact",
    highlight: true,
    icon: Layers,
  },
  {
    name: "Enterprise Contract",
    positioning: "For institutional-grade requirements",
    description:
      "Custom integration engagements with dedicated infrastructure, governance controls, and SLA guarantees.",
    capabilities: [
      "Dedicated account management",
      "Custom adapter development",
      "On-premise deployment option",
      "Governance boundary controls",
      "Enterprise SLA guarantees",
    ],
    cta: "Discuss Your Architecture",
    ctaLink: "/contact",
    highlight: false,
    icon: Building2,
  },
];

const engagementPathways = [
  {
    icon: Rocket,
    title: "Pilot Programs",
    description:
      "Structured pilot engagements designed to validate integration feasibility and measure operational impact before full deployment.",
  },
  {
    icon: Settings2,
    title: "Managed Implementation",
    description:
      "Guided implementation with dedicated engineering support for complex reconciliation architectures and custom adapter requirements.",
  },
  {
    icon: BarChart3,
    title: "Pay-per-Workflow",
    description:
      "Usage-based deployment that scales directly with reconciliation volume. No fixed commitments. Costs align with operational throughput.",
  },
  {
    icon: Phone,
    title: "Strategic Consultation",
    description:
      "Complimentary 30-minute strategic session to evaluate your reconciliation architecture and identify optimal deployment approach.",
  },
];

export default function Pricing() {
  return (
    <ErrorBoundary context="Pricing Page">
      <div className="min-h-screen bg-background">
        <Navigation />

        <Section
          className="pt-20"
          containerClassName="max-w-4xl text-center"
          aria-labelledby="pricing-heading"
        >
          <Badge className="mb-6 px-4 py-2 text-sm font-medium" variant="default">
            Structured for Serious Operators
          </Badge>
          <h1
            id="pricing-heading"
            className="mb-5 text-fluid-4xl font-bold leading-tight tracking-tight text-foreground"
          >
            Engagement Models That Scale With Complexity
          </h1>
          <p className="mx-auto mb-8 max-w-3xl text-lg leading-relaxed text-muted-foreground">
            Designed to scale with workflow complexity. Built for integration depth. Every
            deployment is structured around your operational requirements.
          </p>
          <div className="relative mx-auto mb-8 max-w-4xl overflow-hidden rounded-2xl border border-border">
            <Image
              src="https://images.pexels.com/photos/12634599/pexels-photo-12634599.jpeg"
              alt="Modular deployment architecture representing scalable engagement options"
              width={960}
              height={400}
              className="h-48 w-full rounded-2xl object-cover opacity-80 md:h-64"
              priority
              unoptimized
            />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-slate-900/50 to-transparent" />
          </div>
        </Section>

        <Section aria-label="Engagement models">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
            {engagementModels.map((model) => {
              const Icon = model.icon;
              return (
                <Card
                  key={model.name}
                  className={`relative flex flex-col ${
                    model.highlight
                      ? "border-2 border-foreground/80 shadow-xl"
                      : "border border-border"
                  }`}
                >
                  {model.highlight ? (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge>Most Common</Badge>
                    </div>
                  ) : null}
                  <CardHeader>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                      <Icon className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <CardTitle className="text-xl text-foreground md:text-2xl">
                      {model.name}
                    </CardTitle>
                    <p className="mt-1 text-sm font-medium text-muted-foreground">
                      {model.positioning}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {model.description}
                    </p>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col space-y-4">
                    <div className="flex-1 border-t border-border pt-4">
                      <FeatureList items={model.capabilities} />
                    </div>
                    <Button
                      asChild
                      variant={model.highlight ? "default" : "outline"}
                      className="mt-4 w-full"
                    >
                      <UiLink href={model.ctaLink}>
                        {model.cta} <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                      </UiLink>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </Section>

        <Section aria-label="Console and governance capabilities" containerClassName="max-w-6xl">
          <div className="mb-8 text-center">
            <h2 className="text-fluid-2xl font-bold tracking-tight text-foreground">
              What Premium Unlocks in Product Surfaces
            </h2>
            <p className="mx-auto mt-3 max-w-3xl text-muted-foreground">
              Premium tiers expose additional console surfaces for replay traceability, governance
              workflows, and operator intelligence.
            </p>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Capability</th>
                  <th className="px-4 py-3 text-left font-semibold">Self-Serve</th>
                  <th className="px-4 py-3 text-left font-semibold">Managed</th>
                  <th className="px-4 py-3 text-left font-semibold">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <td className="px-4 py-3">Replay Lab and execution trace diff</td>
                  <td className="px-4 py-3 text-muted-foreground">Limited</td>
                  <td className="px-4 py-3">Included</td>
                  <td className="px-4 py-3">Included + guided rollout</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-4 py-3">Bulk operations and approvals</td>
                  <td className="px-4 py-3 text-muted-foreground">Basic tooling</td>
                  <td className="px-4 py-3">Included</td>
                  <td className="px-4 py-3">Included + governance workflows</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-4 py-3">Audit trail and evidence export</td>
                  <td className="px-4 py-3">Deterministic logs</td>
                  <td className="px-4 py-3">Extended retention</td>
                  <td className="px-4 py-3">Extended retention + SLA</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-4 py-3">Operator control plane and failure intelligence</td>
                  <td className="px-4 py-3 text-muted-foreground">—</td>
                  <td className="px-4 py-3">Available</td>
                  <td className="px-4 py-3">Available + managed support</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <UiLink href="/console">Open Console Overview</UiLink>
            </Button>
            <Button asChild variant="outline">
              <UiLink href="/console/replay">View Replay Surface</UiLink>
            </Button>
          </div>
        </Section>

        <Section className="bg-muted/30" aria-label="Engagement pathways">
          <div className="mb-12 text-center md:mb-16">
            <h2 className="mb-4 text-fluid-3xl font-bold tracking-tight text-foreground">
              Flexible Engagement Pathways
            </h2>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Multiple pathways to deployment. Choose the option that matches your operational
              maturity and integration requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
            {engagementPathways.map((pathway) => {
              const Icon = pathway.icon;
              return (
                <div
                  key={pathway.title}
                  className="rounded-2xl border border-border bg-card p-6 md:p-8"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted">
                      <Icon className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="mb-2 text-lg font-semibold text-foreground">
                        {pathway.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {pathway.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        <Section
          className="bg-slate-900 text-white"
          containerClassName="max-w-4xl text-center"
          aria-label="Strategic consultation"
        >
          <h2 className="mb-4 text-fluid-3xl font-bold tracking-tight">Not Sure Where to Start?</h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-slate-300">
            Schedule a complimentary 30-minute strategic session. We will review your reconciliation
            architecture and recommend an engagement model matched to your operational requirements.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              asChild
              className="w-full bg-white px-8 py-6 text-lg font-semibold text-slate-900 hover:bg-slate-100 sm:w-auto"
            >
              <UiLink href="/contact">
                Schedule a Strategic Session <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </UiLink>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="w-full border-slate-600 bg-transparent px-8 py-6 text-lg text-white hover:bg-slate-800 sm:w-auto"
            >
              <UiLink href="/contact">Request an Integration Review</UiLink>
            </Button>
          </div>
        </Section>

        <Section aria-label="Frequently asked questions" containerClassName="max-w-3xl">
          <h2 className="mb-8 text-center text-fluid-2xl font-bold text-foreground md:mb-10">
            Common Questions
          </h2>
          <Accordion type="single" collapsible className="w-full space-y-3">
            <AccordionItem
              value="how-pricing-works"
              className="rounded-xl border border-border bg-card px-6"
            >
              <AccordionTrigger className="py-4 text-base font-semibold hover:no-underline md:text-lg">
                How does Settler structure its engagement?
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground md:text-base">
                Settler offers multiple deployment pathways matched to workflow complexity and
                integration depth. Self-serve onboarding provides immediate API access. Managed
                deployments include priority support and guided implementation. Enterprise contracts
                are structured around custom requirements with dedicated infrastructure and
                governance controls. All models scale with operational throughput.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="pilot" className="rounded-xl border border-border bg-card px-6">
              <AccordionTrigger className="py-4 text-base font-semibold hover:no-underline md:text-lg">
                Can I start with a pilot?
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground md:text-base">
                Yes. Pilot programs are designed to validate integration feasibility and measure
                operational impact before committing to a full deployment. Pilots typically run for
                30-60 days and include dedicated technical support to ensure your evaluation is
                conclusive.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="enterprise-needs"
              className="rounded-xl border border-border bg-card px-6"
            >
              <AccordionTrigger className="py-4 text-base font-semibold hover:no-underline md:text-lg">
                What if I need custom integrations?
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground md:text-base">
                Custom integration engagements are available for teams with specific adapter
                requirements, proprietary data formats, or regulatory constraints. Contact us to
                discuss your integration architecture and we will scope a custom engagement.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="self-host"
              className="rounded-xl border border-border bg-card px-6"
            >
              <AccordionTrigger className="py-4 text-base font-semibold hover:no-underline md:text-lg">
                Can I self-host Settler?
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground md:text-base">
                Settler is open source under Apache 2.0. Self-hosting is a first-class deployment
                model. Your data never leaves your infrastructure. Managed and enterprise
                engagements provide additional operational tooling and support for self-hosted
                deployments.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="consultation"
              className="rounded-xl border border-border bg-card px-6"
            >
              <AccordionTrigger className="py-4 text-base font-semibold hover:no-underline md:text-lg">
                What is included in the strategic consultation?
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground md:text-base">
                A complimentary 30-minute session with a Settler solutions architect. We review your
                current reconciliation workflows, identify failure surfaces, and recommend an
                engagement model aligned with your operational requirements. No commitment required.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Section>

        <Footer />
      </div>
    </ErrorBoundary>
  );
}
