import { Metadata } from "next";
import Image from "next/image";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Section, PageHero } from "@/components/site/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UiLink } from "@/components/ui/link";
import { RealityEvidencePanel } from "@/components/RealityEvidencePanel";
import {
  ExceptionTriageVisual,
  ReconciliationFlow,
  VisualGrid,
} from "@/components/site/infographics";
import {
  ArrowRight,
  Code2,
  Shield,
  RefreshCw,
  Eye,
  Database,
  GitBranch,
  CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Platform - Settler",
  description:
    "Settler is API-first reconciliation infrastructure: deterministic matching core, AI-assisted exception review, tenant-safe isolation, and audit-grade evidence trails.",
};

const platformLayers = [
  {
    icon: Code2,
    title: "Deterministic Engine",
    description:
      "Rules-based matching with field-level tolerance. Same inputs and same rules always produce identical output and identical evidence hash. No hidden logic.",
    features: [
      "Configurable matching rules in code",
      "Field-level variance with tolerance windows",
      "Multi-source joins across adapters",
      "Floating-point safe (integer cent arithmetic)",
    ],
  },
  {
    icon: Eye,
    title: "AI-Assisted Review",
    description:
      "AI compresses exception triage time by surfacing context, suggesting classifications, and flagging anomalies. Humans retain final authority on every decision.",
    features: [
      "Exception context summarization",
      "Anomaly pattern detection",
      "Suggested resolution classifications",
      "Review history and audit trail",
    ],
  },
  {
    icon: Shield,
    title: "Governance & Controls",
    description:
      "Role-based access, tenant isolation, and configurable policy controls. Every decision is logged with actor, timestamp, and documented reason.",
    features: [
      "Owner / Admin / Reviewer / Viewer roles",
      "Tenant-scoped API keys",
      "Policy-gated mismatch resolution",
      "Exportable compliance evidence",
    ],
  },
  {
    icon: RefreshCw,
    title: "Replay & Provenance",
    description:
      "Any historical run can be replayed from stored inputs and rules. The output hash must match the original. Debug mismatches or prepare for audit without re-running live systems.",
    features: [
      "Hash-verified replay of any run",
      "Rule version fingerprints in evidence",
      "Provenance chain across sequential runs",
      "Determinism CI enforcement",
    ],
  },
];

const integrationAdapters = [
  "Stripe",
  "QuickBooks",
  "Xero",
  "Shopify",
  "NetSuite",
  "PostgreSQL",
  "MySQL",
  "CSV / JSON",
  "Webhooks",
  "Custom adapters via SDK",
];

export default function PlatformPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <PageHero
        eyebrow="Platform Core"
        title="Deterministic Reconciliation. AI-Assisted Review."
        description="Settler is API-first infrastructure for finance and fintech teams: a deterministic matching core, AI-assisted exception triage, tenant-safe isolation, and audit-grade evidence trails built into every run."
        visual={
          <div className="relative aspect-square w-full max-w-[500px] overflow-hidden rounded-3xl border border-primary/20 shadow-2xl">
            <Image
              src="/platform_core_3d.png"
              alt="Platform core visualization"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent" />
          </div>
        }
        actions={
          <>
            <Button asChild size="lg">
              <UiLink href="/docs/quickstart">
                Start Quickstart <ArrowRight className="h-4 w-4 ml-1" />
              </UiLink>
            </Button>
            <Button variant="outline" asChild size="lg">
              <UiLink href="/contact">Talk to our team</UiLink>
            </Button>
          </>
        }
      />

      {/* Data flow diagram */}
      <Section withGrid className="py-20 border-y border-border/40 bg-muted/10">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight">The Settlement Pipeline</h2>
          <p className="text-muted-foreground font-medium">
            From raw data ingestion to verifiable evidence, every stage is deterministic.
          </p>
        </div>
        <ReconciliationFlow />
      </Section>

      {/* Triage Section */}
      <Section className="py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-3xl font-bold tracking-tight">AI-Assisted Exception Review</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Don&apos;t waste time on trivial variances. Our AI layer surfaces the context you need
              to resolve exceptions with institutional confidence.
            </p>
            <ExceptionTriageVisual />
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-xl">
            <RealityEvidencePanel scope="architecture" title="Review Governance" />
          </div>
        </div>
      </Section>

      {/* Platform layers */}
      <Section className="py-16 bg-muted/5 border-t border-border/40">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {platformLayers.map((layer) => {
            const Icon = layer.icon;
            return (
              <div
                key={layer.title}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{layer.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {layer.description}
                </p>
                <ul className="space-y-2">
                  {layer.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-xs text-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </Section>

      <Section className="bg-muted/10">
        <VisualGrid />
      </Section>

      <Section className="py-12" containerClassName="max-w-6xl">
        <RealityEvidencePanel scope="architecture" title="Platform implementation references" />
      </Section>

      {/* Integrations */}
      <Section className="py-12 border-t border-border" containerClassName="max-w-6xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">Integrations &amp; Adapters</h2>
            <p className="text-muted-foreground">
              Connect the systems you already use. Adapters handle schema normalization so your
              rules stay clean.
            </p>
          </div>
          <Button variant="outline" asChild size="sm">
            <UiLink href="/integrations">
              <Database className="w-4 h-4 mr-1.5" />
              All Integrations
            </UiLink>
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {integrationAdapters.map((adapter) => (
            <span
              key={adapter}
              className="inline-flex items-center rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-foreground"
            >
              {adapter}
            </span>
          ))}
        </div>
      </Section>

      {/* Self-host / open-source */}
      <Section className="py-12 border-t border-border" containerClassName="max-w-6xl">
        <div className="rounded-2xl bg-slate-900 dark:bg-slate-800 p-8 grid sm:grid-cols-2 gap-8 items-center">
          <div>
            <Badge variant="outline" className="border-slate-600 text-slate-400 mb-4">
              Apache 2.0
            </Badge>
            <h2 className="text-2xl font-bold text-white mb-3">Self-Host or Managed</h2>
            <p className="text-slate-400 leading-relaxed">
              Deploy Settler inside your own infrastructure. Your financial data never transits a
              Settler-managed network unless you choose the managed cloud deployment.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {[
              "Docker Compose and Kubernetes targets in the repo",
              "Apache 2.0 — inspect and audit every line",
              "No telemetry in self-hosted mode by default",
              "Managed cloud available for teams that prefer it",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2.5">
                <GitBranch className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-300">{item}</span>
              </div>
            ))}
            <div className="flex gap-3 mt-2">
              <Button asChild size="sm">
                <UiLink href="/open-source">OSS Details</UiLink>
              </Button>
              <Button
                variant="outline"
                asChild
                size="sm"
                className="border-slate-600 text-white hover:bg-slate-700"
              >
                <UiLink href="/contact">Talk to us</UiLink>
              </Button>
            </div>
          </div>
        </div>
      </Section>

      <Footer />
    </div>
  );
}
