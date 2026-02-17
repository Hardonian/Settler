import Image from "next/image";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Section } from "@/components/marketing/Section";
import { FeatureList } from "@/components/marketing/FeatureList";
import { Button } from "@/components/ui/button";
import { UiLink } from "@/components/ui/link";
import { ArrowRight } from "lucide-react";

const capabilities = [
  "Reconciliation API with deterministic execution",
  "AI-assisted discrepancy review layered after deterministic matching",
  "Feature flags for finance workflows and phased rollouts",
  "Audit logging with immutable evidence trails",
];

export default function PlatformPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Section className="pt-20" containerClassName="max-w-6xl" aria-labelledby="platform-heading">
        <h1 id="platform-heading" className="text-fluid-4xl font-semibold text-foreground">
          Deterministic Reconciliation. AI-Assisted Review.
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-muted-foreground">
          Settler is API-first infrastructure for finance teams: deterministic reconciliation core,
          AI review assist, tenant-safe isolation, and audit-grade traceability.
        </p>

        <div className="mt-10 rounded-xl border border-border bg-card p-6">
          <Image
            src="/assets/diagrams/data-flow.svg"
            alt="Data In to deterministic engine to AI review to audit trail"
            width={960}
            height={360}
            className="h-auto w-full"
            priority
          />
        </div>

        <section className="mt-12" aria-labelledby="platform-capabilities-heading">
          <h2 id="platform-capabilities-heading" className="text-2xl font-semibold text-foreground">
            Platform capabilities
          </h2>
          <div className="mt-4 max-w-3xl">
            <FeatureList items={capabilities} />
          </div>
        </section>

        <div className="mt-10 flex flex-wrap gap-4">
          <Button asChild>
            <UiLink href="/docs/quickstart">
              Start quickstart <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </UiLink>
          </Button>
          <Button variant="outline" asChild>
            <UiLink href="/contact">Talk to our team</UiLink>
          </Button>
        </div>
      </Section>
      <Footer />
    </div>
  );
}
