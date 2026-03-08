import Image from "next/image";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Section } from "@/components/marketing/Section";
import { FeatureList } from "@/components/marketing/FeatureList";
import { Button } from "@/components/ui/button";
import { UiLink } from "@/components/ui/link";
import { ArrowRight } from "lucide-react";

const capabilities = [
  "Deterministic reconciliation engine — same inputs and rules always produce identical outputs",
  "Explicit, version-controlled matching rules written in code and reviewable in PRs",
  "SHA-256 evidence chain on every run — tamper-detectable without re-executing",
  "AI-assisted variance triage layered after deterministic matching; humans retain final authority",
  "Immutable audit logs with actor, timestamp, and payload on every event",
  "Tenant isolation with row-level security and workspace-scoped API keys",
  "Self-hostable under Apache 2.0 — your data stays in your infrastructure",
];

const layers = [
  {
    label: "Data Ingestion",
    description:
      "Adapters normalize data from Stripe, Shopify, QuickBooks, internal ledgers, or any CSV/JSON source into a canonical schema before rules are applied.",
  },
  {
    label: "Deterministic Engine",
    description:
      "Matching rules are evaluated in a deterministic execution environment. Given the same data and rules, the engine produces identical outputs every time. No hidden logic, no stochastic behavior.",
  },
  {
    label: "Evidence Generation",
    description:
      "Every run emits an evidence file: inputs, rule paths, matched pairs, variances, and a SHA-256 hash over the entire payload. The hash allows any reviewer to confirm the file has not been modified.",
  },
  {
    label: "AI Review Layer",
    description:
      "After deterministic matching, an AI layer compresses variance triage — grouping similar mismatches, surfacing likely causes, and estimating confidence. Humans review and resolve each flagged item.",
  },
  {
    label: "Audit Trail",
    description:
      "All actions — runs, approvals, overrides, exports — are logged with tamper-evident, append-only records. Exportable for compliance evidence ingestion.",
  },
];

export default function PlatformPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Section className="pt-20" containerClassName="max-w-6xl" aria-labelledby="platform-heading">
        <h1 id="platform-heading" className="text-fluid-4xl font-semibold text-foreground">
          Deterministic Reconciliation. Verifiable Evidence. Human-in-the-Loop Review.
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-muted-foreground">
          Settler is API-first reconciliation infrastructure: a deterministic engine with explicit
          rules, cryptographic evidence on every run, AI-assisted variance review, and a complete
          audit trail — deployable in your own infrastructure.
        </p>

        <div className="mt-10 rounded-xl border border-border bg-card p-6">
          <Image
            src="/assets/diagrams/data-flow.svg"
            alt="Data flows from adapters through the deterministic reconciliation engine, producing evidence artifacts and a human review queue"
            width={960}
            height={360}
            className="h-auto w-full"
            priority
          />
        </div>

        <section className="mt-14" aria-labelledby="platform-layers-heading">
          <h2 id="platform-layers-heading" className="text-2xl font-semibold text-foreground mb-6">
            How the platform is layered
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {layers.map((layer) => (
              <div key={layer.label} className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-base font-semibold text-foreground mb-1.5">{layer.label}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{layer.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12" aria-labelledby="platform-capabilities-heading">
          <h2
            id="platform-capabilities-heading"
            className="text-2xl font-semibold text-foreground mb-4"
          >
            Platform capabilities
          </h2>
          <div className="max-w-3xl">
            <FeatureList items={capabilities} />
          </div>
        </section>

        <div className="mt-10 flex flex-wrap gap-4">
          <Button asChild>
            <UiLink href="/docs/quickstart">
              Read the Quickstart <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </UiLink>
          </Button>
          <Button variant="outline" asChild>
            <UiLink href="/security-and-audit">Review security architecture</UiLink>
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
