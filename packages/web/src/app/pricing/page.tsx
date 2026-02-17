/**
 * Pricing Page - Flexible engagement models for serious operators
 */

import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Layers, BarChart3, Building2, Rocket, Settings2, Code2, Phone } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Engagement Models - Settler",
  description: "Flexible deployment and engagement options designed to scale with workflow complexity. Built for integration depth. Structured for serious operators.",
};

const engagementModels = [
  {
    name: "Self-Serve",
    positioning: "For teams ready to deploy immediately",
    description: "Technical self-serve onboarding with full API access, documentation, and community support.",
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
    description: "Modular usage-based scaling with priority support and advanced integration tooling.",
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
    description: "Custom integration engagements with dedicated infrastructure, governance controls, and SLA guarantees.",
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
    description: "Structured pilot engagements designed to validate integration feasibility and measure operational impact before full deployment.",
  },
  {
    icon: Settings2,
    title: "Managed Implementation",
    description: "Guided implementation with dedicated engineering support for complex reconciliation architectures and custom adapter requirements.",
  },
  {
    icon: BarChart3,
    title: "Pay-per-Workflow",
    description: "Usage-based deployment that scales directly with reconciliation volume. No fixed commitments. Costs align with operational throughput.",
  },
  {
    icon: Phone,
    title: "Strategic Consultation",
    description: "Complimentary 30-minute strategic session to evaluate your reconciliation architecture and identify optimal deployment approach.",
  },
];

export default function Pricing() {
  return (
    <ErrorBoundary context="Pricing Page">
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navigation />

        {/* Hero */}
        <section className="px-4 sm:px-6 lg:px-8 pt-12 pb-16 md:pt-16 md:pb-20" aria-labelledby="pricing-heading">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-2 text-sm font-medium">
              Structured for Serious Operators
            </Badge>
            <h1
              id="pricing-heading"
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 text-slate-900 dark:text-white leading-tight tracking-tight"
            >
              Engagement Models That Scale With Complexity
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-3xl mx-auto leading-relaxed">
              Designed to scale with workflow complexity. Built for integration depth.
              Every deployment structured around your operational requirements.
            </p>
            <div className="relative max-w-4xl mx-auto rounded-2xl overflow-hidden mb-8">
              <Image
                src="https://images.pexels.com/photos/12634599/pexels-photo-12634599.jpeg"
                alt="Modular deployment architecture representing scalable engagement options"
                width={960}
                height={400}
                className="w-full h-48 md:h-64 object-cover rounded-2xl opacity-80"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent rounded-2xl" />
            </div>
          </div>
        </section>

        {/* Engagement Model Cards */}
        <section className="px-4 sm:px-6 lg:px-8 py-12 md:py-16" aria-label="Engagement models">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {engagementModels.map((model, index) => {
                const Icon = model.icon;
                return (
                  <Card
                    key={index}
                    className={`relative transition-all duration-200 flex flex-col ${model.highlight ? "border-2 border-slate-900 dark:border-white shadow-xl" : "border border-slate-200 dark:border-slate-800"}`}
                  >
                    {model.highlight && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-slate-900 dark:bg-white text-white dark:text-slate-900">
                          Most Common
                        </Badge>
                      </div>
                    )}
                    <CardHeader>
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6 text-slate-700 dark:text-slate-300" aria-hidden="true" />
                      </div>
                      <CardTitle className="text-xl md:text-2xl text-slate-900 dark:text-white">{model.name}</CardTitle>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">{model.positioning}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">{model.description}</p>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1 flex flex-col">
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex-1">
                        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2.5 leading-relaxed">
                          {model.capabilities.map((capability, idx) => (
                            <li key={idx} className="flex items-start gap-2.5">
                              <span className="text-slate-900 dark:text-white mt-0.5 flex-shrink-0 font-medium" aria-hidden="true">
                                --
                              </span>
                              <span>{capability}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Button
                        asChild
                        className={`w-full mt-4 ${model.highlight ? "bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100" : ""}`}
                        variant={model.highlight ? "default" : "outline"}
                      >
                        <Link href={model.ctaLink}>
                          {model.cta} <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Engagement Pathways */}
        <section className="px-4 sm:px-6 lg:px-8 py-16 md:py-20 bg-white dark:bg-slate-900" aria-label="Engagement pathways">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-slate-900 dark:text-white tracking-tight">
                Flexible Engagement Pathways
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Multiple pathways to deployment. Choose what matches your operational maturity and integration requirements.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {engagementPathways.map((pathway, index) => {
                const Icon = pathway.icon;
                return (
                  <div
                    key={index}
                    className="p-6 md:p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-slate-700 dark:text-slate-300" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">{pathway.title}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{pathway.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Architecture Review CTA */}
        <section className="px-4 sm:px-6 lg:px-8 py-16 md:py-20 bg-slate-900 text-white" aria-label="Strategic consultation">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 tracking-tight">
              Not Sure Where to Start?
            </h2>
            <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed">
              Schedule a complimentary 30-minute strategic session. We will review your
              reconciliation architecture and recommend an engagement model matched to your operational requirements.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                asChild
                className="w-full sm:w-auto bg-white text-slate-900 hover:bg-slate-100 px-8 py-6 text-lg font-semibold"
              >
                <Link href="/contact" className="flex items-center justify-center gap-2">
                  Schedule a Strategic Session <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="w-full sm:w-auto px-8 py-6 text-lg border-2 border-slate-600 bg-transparent text-white hover:bg-slate-800"
              >
                <Link href="/contact">
                  Request an Integration Review
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-4 sm:px-6 lg:px-8 py-12 md:py-16" aria-label="Frequently asked questions">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-10 text-slate-900 dark:text-white">
              Common Questions
            </h2>
            <Accordion type="single" collapsible className="w-full space-y-3">
              <AccordionItem value="how-pricing-works" className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-6">
                <AccordionTrigger className="text-base md:text-lg font-semibold py-4 hover:no-underline">
                  How does Settler structure its engagement?
                </AccordionTrigger>
                <AccordionContent className="text-sm md:text-base text-slate-600 dark:text-slate-400 pb-4 leading-relaxed">
                  Settler offers multiple deployment pathways matched to workflow complexity and integration depth. Self-serve onboarding provides immediate API access. Managed deployments include priority support and guided implementation. Enterprise contracts are structured around custom requirements with dedicated infrastructure and governance controls. All models scale with operational throughput.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="pilot" className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-6">
                <AccordionTrigger className="text-base md:text-lg font-semibold py-4 hover:no-underline">
                  Can I start with a pilot?
                </AccordionTrigger>
                <AccordionContent className="text-sm md:text-base text-slate-600 dark:text-slate-400 pb-4 leading-relaxed">
                  Yes. Pilot programs are designed to validate integration feasibility and measure operational impact before committing to a full deployment. Pilots typically run for 30-60 days and include dedicated technical support to ensure your evaluation is conclusive.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="enterprise-needs" className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-6">
                <AccordionTrigger className="text-base md:text-lg font-semibold py-4 hover:no-underline">
                  What if I need custom integrations?
                </AccordionTrigger>
                <AccordionContent className="text-sm md:text-base text-slate-600 dark:text-slate-400 pb-4 leading-relaxed">
                  Custom integration engagements are available for teams with specific adapter requirements, proprietary data formats, or regulatory constraints. Contact us to discuss your integration architecture and we will scope a custom engagement.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="self-host" className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-6">
                <AccordionTrigger className="text-base md:text-lg font-semibold py-4 hover:no-underline">
                  Can I self-host Settler?
                </AccordionTrigger>
                <AccordionContent className="text-sm md:text-base text-slate-600 dark:text-slate-400 pb-4 leading-relaxed">
                  Settler is open source under Apache 2.0. Self-hosting is a first-class deployment model. Your data never leaves your infrastructure. Managed and enterprise engagements provide additional operational tooling and support for self-hosted deployments.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="consultation" className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-6">
                <AccordionTrigger className="text-base md:text-lg font-semibold py-4 hover:no-underline">
                  What is included in the strategic consultation?
                </AccordionTrigger>
                <AccordionContent className="text-sm md:text-base text-slate-600 dark:text-slate-400 pb-4 leading-relaxed">
                  A complimentary 30-minute session with a Settler solutions architect. We review your current reconciliation workflows, identify failure surfaces, and recommend an engagement model aligned with your operational requirements. No commitment required.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        <Footer />
      </div>
    </ErrorBoundary>
  );
}
