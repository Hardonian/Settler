import { Metadata } from "next";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Section, PageHero } from "@/components/site/primitives";
import { FeatureList } from "@/components/marketing/FeatureList";
import { Button } from "@/components/ui/button";
import { UiLink } from "@/components/ui/link";
import { RealityEvidencePanel } from "@/components/RealityEvidencePanel";
import {
  EvidenceArtifactPreview,
  VisualGrid,
  IsolationVaultVisual,
} from "@/components/site/infographics";
import { ShieldCheck, Lock, Eye, FileText, Server, KeyRound, ArrowRight } from "lucide-react";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Security & Audit - Settler",
  description:
    "Implemented security controls, verification evidence, and known assurance gaps for Settler deployments.",
};

const securityPillars = [
  {
    icon: Lock,
    title: "Tenant Isolation",
    description:
      "Repository, route, and authorization boundaries require tenant context. RLS definitions exist, while live database verification remains deployment-specific.",
    items: [
      "PostgreSQL RLS definitions with live verification required",
      "API keys scoped to tenant context",
      "Server-side runtime tenant guards",
    ],
  },
  {
    icon: FileText,
    title: "Audit Trails",
    description:
      "Implemented workflows record actors, timestamps, and decision context. Retention and write protections must be verified in the target deployment.",
    items: [
      "Audit-event schema and service paths",
      "Actor, timestamp, and payload context",
      "Export surfaces for downstream review",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Cryptographic Evidence",
    description:
      "Configured runs can produce SHA-256 and Merkle evidence artifacts that support later integrity checks.",
    items: [
      "SHA-256 evidence hashing",
      "Hash-linked run artifacts",
      "Independent verification tooling",
    ],
  },
  {
    icon: Eye,
    title: "Human-in-the-Loop Review",
    description:
      "AI-assisted features are advisory. Approval requirements and operator authority depend on the configured workflow and policy.",
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
      "SSO/OIDC capability is configuration-gated and verified per deployment",
    ],
  },
  {
    icon: Server,
    title: "Deployment Boundary",
    description:
      "Hosted, dedicated, and self-managed options have different data paths. The chosen architecture and operational responsibilities must be agreed before deployment.",
    items: [
      "Local Docker development path",
      "Telemetry and export settings reviewed per deployment",
      "Open-core license boundary documented separately",
    ],
  },
];

const complianceItems = [
  "Audit-trail exports can support a broader SOC 2 evidence program",
  "Data-residency configuration surfaces require deployment validation",
  "Configurable retention policies for reconciliation records",
  "Role-separation between data access and configuration",
  "Webhook delivery with signed payloads for downstream audit systems",
  "AI data handling must be validated against the configured provider and deployment",
];

export default function SecurityAndAuditPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <PageHero
        eyebrow="Security Architecture"
        title="Security, Isolation, and Verifiable Evidence"
        description="Review the controls implemented in code, the checks enforced in CI, and the assurance work that remains specific to a live deployment."
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

      {/* Isolation Vault Section */}
      <Section withGrid className="bg-slate-950 border-y border-white/5 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Tenant Isolation Controls
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              Tenant identifiers are required across repository and route boundaries, with
              authorization checks, runtime guards, and RLS definitions providing layered controls.
              Live RLS and cross-tenant verification must still pass in the deployed database before
              launch.
            </p>
            <IsolationVaultVisual />
          </div>
          <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-white/10 shadow-3xl">
            <Image
              src="/isolation_vault_3d.png"
              alt="Security isolation vault visualization"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent" />
          </div>
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
          evidence collection tractable. The following implemented surfaces still require
          deployment-specific validation and do not establish certification.
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
          Found a security vulnerability? Please report it privately with a sanitized reproduction.
          Reports are triaged according to the available support and incident process.
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
