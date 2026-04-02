import { Metadata } from "next";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Section, PageHero } from "@/components/site/primitives";
import { FeatureList } from "@/components/marketing/FeatureList";
import { Button } from "@/components/ui/button";
import { UiLink } from "@/components/ui/link";
import { RealityEvidencePanel } from "@/components/RealityEvidencePanel";
import { EvidenceArtifactPreview, VisualGrid } from "@/components/site/infographics";
import { ShieldCheck, Lock, Eye, FileText, Server, KeyRound, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Security & Audit - Settler",
  description:
    "Settler is built on a foundation of tenant isolation, immutable audit trails, and verifiable evidence. Every reconciliation run produces a cryptographic evidence chain.",
};

const securityPillars = [
  {
    icon: Lock,
    title: "Tenant Isolation",
    description:
      "All data is hard-partitioned by tenant at the database, API, and runtime layer. No shared state, no cross-tenant data leakage.",
    items: [
      "Row-level security in PostgreSQL",
      "API keys scoped to tenant context",
      "Runtime isolation enforced server-side",
    ],
  },
  {
    icon: FileText,
    title: "Immutable Audit Trails",
    description:
      "Every action, every reconciliation run, and every mismatch review is logged with tamper-evident records. Logs cannot be modified after creation.",
    items: [
      "Append-only audit log schema",
      "Actor + timestamp + payload on every event",
      "Exportable for compliance ingestion",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Cryptographic Evidence",
    description:
      "Reconciliation runs produce SHA-256 hash chains over the evidence payload. Any post-run modification to results is immediately detectable.",
    items: [
      "SHA-256 per-run evidence hashes",
      "Hash chain links sequential runs",
      "Verifiable without re-running",
    ],
  },
  {
    icon: Eye,
    title: "Human-in-the-Loop Review",
    description:
      "Settler does not make autonomous financial decisions. Every flagged mismatch requires explicit human review and resolution before closing.",
    items: [
      "Manual override with documented reason",
      "Role-based review permissions",
      "Full review history retained",
    ],
  },
  {
    icon: KeyRound,
    title: "Access Controls",
    description:
      "Role-based access control with principle of least privilege. Workspace admins control who can read, approve, and export reconciliation data.",
    items: [
      "Owner / Admin / Reviewer / Viewer roles",
      "Workspace-scoped API keys",
      "SSO / OAuth via standard providers",
    ],
  },
  {
    icon: Server,
    title: "Self-Hostable",
    description:
      "Deploy Settler inside your own infrastructure. Your financial data never transits a Settler-managed network unless you opt into the managed cloud.",
    items: [
      "Docker Compose and Kubernetes targets",
      "No telemetry by default in self-hosted mode",
      "Apache 2.0 license — inspect and audit the source",
    ],
  },
];

const complianceItems = [
  "Audit-trail export compatible with SOC 2 evidence collection",
  "Data residency controls for GDPR and regional requirements",
  "Configurable retention policies for reconciliation records",
  "Role-separation between data access and configuration",
  "Webhook delivery with signed payloads for downstream audit systems",
  "No training data exfiltration — AI review layer is stateless per run",
];

export default function SecurityAndAuditPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <PageHero
        eyebrow="Security Architecture"
        title="Security, Isolation, and Verifiable Evidence"
        description="Settler is designed so that every reconciliation run produces evidence you can verify, every action leaves a traceable record, and your data stays in your infrastructure."
        visual={<EvidenceArtifactPreview />}
        actions={
          <>
            <Button asChild size="lg">
              <UiLink href="/docs/quickstart">
                Read Quickstart <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </UiLink>
            </Button>
            <Button asChild variant="outline" size="lg">
              <UiLink href="/docs">Browse Docs</UiLink>
            </Button>
          </>
        }
      />

      {/* Security Pillars */}
      <Section
        className="py-16 bg-muted/30"
        containerClassName="max-w-6xl"
        aria-labelledby="pillars-heading"
      >
        <h2
          id="pillars-heading"
          className="text-2xl font-bold text-foreground mb-10 tracking-tight"
        >
          Security Architecture
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {securityPillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="rounded-xl border border-border bg-card p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-1.5">{pillar.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {pillar.description}
                  </p>
                  <FeatureList items={pillar.items} />
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section className="bg-muted/10">
        <VisualGrid />
      </Section>

      {/* Compliance Readiness */}
      <Section
        className="py-16"
        containerClassName="max-w-4xl"
        aria-labelledby="compliance-heading"
      >
        <h2
          id="compliance-heading"
          className="text-2xl font-bold text-foreground mb-4 tracking-tight"
        >
          Compliance Readiness
        </h2>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Settler is not a compliance certification. It is infrastructure that makes compliance
          evidence collection tractable. The following properties are structural — not add-ons.
        </p>
        <div className="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-inner">
          <FeatureList items={complianceItems} />
        </div>
      </Section>

      {/* Responsible Disclosure */}
      <Section
        className="py-16 bg-muted/30"
        containerClassName="max-w-4xl"
        aria-labelledby="disclosure-heading"
      >
        <h2
          id="disclosure-heading"
          className="text-2xl font-bold text-foreground mb-4 tracking-tight"
        >
          Responsible Disclosure
        </h2>
        <p className="text-muted-foreground mb-6 leading-relaxed max-w-2xl">
          Found a security vulnerability? Please report it responsibly. We take all reports
          seriously and respond promptly.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild variant="outline">
            <UiLink href="/contact" className="flex items-center gap-2">
              Contact Us
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </UiLink>
          </Button>
        </div>
      </Section>

      <Section className="py-8" containerClassName="max-w-6xl">
        <RealityEvidencePanel scope="security" title="Security evidence references" />
      </Section>

      <Footer />
    </div>
  );
}
