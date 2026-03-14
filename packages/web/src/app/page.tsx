import { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import {
  CTASection,
  FeatureCard,
  FeatureGrid,
  PageHero,
  Section,
  SectionHeader,
} from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import { UiLink } from "@/components/ui/link";

export const metadata: Metadata = {
  title: "Settler - Deterministic Reconciliation Platform",
  description:
    "Settler helps teams reconcile financial data with deterministic runs, replayable evidence, and operator-grade controls.",
};

const capabilityClusters = [
  {
    title: "Deterministic engine",
    description: "Rules-based matching with tolerance controls and stable outputs.",
    bullets: ["Rules as code", "Field-level tolerance", "Replay verification"],
  },
  {
    title: "Evidence and auditability",
    description: "Evidence manifests and hash-linked artifacts for each run.",
    bullets: ["Evidence JSON", "Replay reports", "Run provenance"],
  },
  {
    title: "Operator workflows",
    description: "Exception review, diagnostics, and control-plane style operations.",
    bullets: ["Exception queues", "Audit trails", "Diagnostics views"],
  },
  {
    title: "Integration layer",
    description: "Adapters for payment, commerce, accounting, and custom systems.",
    bullets: ["API and CLI execution", "Webhook support", "Custom adapters"],
  },
  {
    title: "Deployment choices",
    description: "Run open-source core yourself or evaluate managed enterprise delivery.",
    bullets: ["Apache 2.0 OSS", "Self-host workflows", "Enterprise controls"],
  },
  {
    title: "Security posture",
    description: "Tenant-aware boundaries and explicit control surfaces for operators.",
    bullets: ["Scoped access", "Policy controls", "Security architecture docs"],
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main id="main-content" className="pt-16">
        <PageHero
          eyebrow="Settler platform"
          title="Deterministic reconciliation for teams that need proof, not guesswork."
          description="Settler is built for reconciliation workflows where correctness, auditability, and operational clarity matter. Run deterministic matching, triage exceptions, and export evidence that can be replayed and reviewed."
          actions={
            <>
              <Button asChild>
                <UiLink href="/platform">
                  Explore platform <ArrowRight className="ml-1 h-4 w-4" />
                </UiLink>
              </Button>
              <Button variant="outline" asChild>
                <UiLink href="/docs">Read docs</UiLink>
              </Button>
            </>
          }
        />

        <Section>
          <SectionHeader
            title="What you can do today"
            description="Core capabilities spanning deterministic matching, evidence generation, operator workflows, and integration adapters."
          />
          <FeatureGrid>
            {capabilityClusters.map((capability) => (
              <FeatureCard key={capability.title} {...capability} />
            ))}
          </FeatureGrid>
        </Section>

        <Section className="bg-muted/20">
          <SectionHeader title="Navigate by intent" />
          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                role: "Developer",
                href: "/capabilities",
                desc: "SDK, CLI, and deterministic run model.",
              },
              {
                role: "Operator",
                href: "/product",
                desc: "Exception handling, controls, and run operations.",
              },
              {
                role: "Architecture reviewer",
                href: "/architecture",
                desc: "System boundaries, data flow, and execution model.",
              },
              {
                role: "Buyer / evaluator",
                href: "/pricing",
                desc: "Packaging and open-source vs enterprise posture.",
              },
            ].map((item) => (
              <UiLink
                key={item.role}
                href={item.href}
                className="rounded-xl border border-border bg-card p-5 hover:border-primary/50"
              >
                <h3 className="text-lg font-semibold text-foreground">{item.role}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
              </UiLink>
            ))}
          </div>
        </Section>

        <CTASection
          title="Start with product truth"
          description="Explore the platform, capabilities, and architecture to evaluate what exists now and what is planned next."
          primaryHref="/platform"
          primaryLabel="View platform overview"
          secondaryHref="/changelog"
          secondaryLabel="View changelog"
        />
      </main>
      <Footer />
    </div>
  );
}
