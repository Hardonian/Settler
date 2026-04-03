import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Section, PageHero } from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import {
  RuleExecutionVisual,
  IsolationVaultVisual,
  VisualGrid,
} from "@/components/site/infographics";
import {
  Shield,
  Lock,
  Server,
  Users,
  ArrowRight,
  GitBranch,
  CheckCircle,
  Layers,
} from "lucide-react";
import { getSiteMode } from "@/lib/site-mode";

export const metadata: Metadata = {
  title: "Enterprise - Settler",
  description:
    "Institutional-grade reconciliation infrastructure with tenant isolation, governance boundaries, and deterministic audit trails. Designed for serious financial operations.",
};

const enterpriseCapabilities = [
  {
    title: "Tenant Isolation",
    description:
      "Logically or physically isolated tenants with strict data residency controls. Each tenant operates within deterministic governance boundaries.",
    icon: Shield,
  },
  {
    title: "Policy-Based Access Controls",
    description:
      "Granular RBAC and policy-based gating for all reconciliation workflows and state changes. Authority boundaries are structural, not optional.",
    icon: Lock,
  },
  {
    title: "Self-Hosted Deployment",
    description:
      "Deploy in your own VPC or on-premise for full control over your financial data. Your infrastructure, your governance perimeter.",
    icon: Server,
  },
  {
    title: "Custom Adapter Development",
    description:
      "Native adapters developed for your specific core banking, ERP, or payment systems. Integration depth matched to your operational requirements.",
    icon: Users,
  },
];

export default function EnterprisePage() {
  if (getSiteMode() !== "enterprise") {
    return (
      <div className="min-h-screen bg-muted/20">
        <Navigation />
        <main className="mx-auto max-w-3xl px-6 py-32 text-center">
          <Badge className="mb-4">Enterprise feature unavailable</Badge>
          <h1 className="text-3xl font-semibold mb-4">
            Enterprise surface is disabled for this host.
          </h1>
          <p className="text-muted-foreground">
            Set SITE_MODE=enterprise to enable enterprise marketing content.
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <PageHero
        eyebrow="Enterprise Infrastructure"
        title="What Serious Financial Infrastructure Evolves Toward"
        description="Deploy deterministic reconciliation with tenant isolation, governance boundaries, and audit-ready evidence trails. Designed for teams where operational confidence is not optional."
        visual={
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-primary/20 shadow-2xl">
            <Image
              src="/enterprise_arch_3d.png"
              alt="Enterprise architecture visualization"
              fill
              className="object-cover"
            />
          </div>
        }
        actions={
          <>
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
              <Link href="/contact" className="gap-2">
                Discuss Your Architecture <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">Explore Engagement Models</Link>
            </Button>
          </>
        }
      />

      <Section className="py-24">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight">Institutional-Grade Capabilities</h2>
          <p className="text-muted-foreground font-medium">
            Security, compliance, and governance controls built into the infrastructure layer.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {enterpriseCapabilities.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <SpotlightCard key={index} className="p-8 border border-border bg-card">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </SpotlightCard>
            );
          })}
        </div>
      </Section>

      {/* Isolation Narrative */}
      <Section withGrid className="bg-slate-950 border-y border-white/5 py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-10">
            <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
              The Governance Narrative
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
              AI Compresses Uncertainty. <br />
              <span className="text-primary">Humans Retain Authority.</span>
            </h2>
            <p className="text-xl text-slate-400 leading-relaxed max-w-2xl">
              Settler uses AI-assisted review to surface patterns and compress exception triage
              time. It does not replace human judgment. Every decision remains reviewable.
            </p>
            <IsolationVaultVisual />
          </div>
          <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-white/10 shadow-3xl">
            <Image
              src="/ai_review_nodes_3d.png"
              alt="AI review node visualization"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-transparent" />
          </div>
        </div>
      </Section>

      {/* Control Narrative */}
      <Section className="py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border shadow-2xl order-2 lg:order-1">
            <Image
              src="/hero_abstract_reconciliation.png"
              alt="Deterministic reconciliation"
              fill
              className="object-cover"
            />
          </div>
          <div className="space-y-10 order-1 lg:order-2 text-center lg:text-left">
            <Badge variant="outline" className="px-3 py-1 text-primary border-primary/30">
              The Control Narrative
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Reconciliation Is a Structural Risk Surface
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Manual reconciliation does not scale. As transaction volume grows, the failure surface
              expands. Deterministic automation reduces that surface by replacing probabilistic
              matching with inspectable, rules-based logic.
            </p>
            <RuleExecutionVisual />
          </div>
        </div>
      </Section>

      {/* Operational Maturity */}
      <Section withGrid className="bg-muted/10 border-y border-border/40 py-32">
        <div className="max-w-4xl mx-auto text-center space-y-10">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            Manual Reconciliation Is a Phase
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed italic">
            Deterministic, API-based reconciliation is the stable end-state that mature financial
            operations evolve toward.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Layers,
                title: "Before",
                description: "Manual exports, fragile scripts, untracked variances.",
              },
              {
                icon: GitBranch,
                title: "Transition",
                description: "Rules codified, adapters connected, audit trails established.",
              },
              {
                icon: CheckCircle,
                title: "Controlled State",
                description: "Deterministic automation, governance boundaries enforced.",
              },
            ].map((phase, idx) => {
              const Icon = phase.icon;
              return (
                <div key={idx} className="p-8 bg-card rounded-2xl border border-border shadow-md">
                  <Icon className="w-10 h-10 text-primary mx-auto mb-6" />
                  <h3 className="text-xl font-bold mb-3">{phase.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {phase.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      <Section className="bg-muted/10">
        <VisualGrid />
      </Section>

      <Section className="py-24" containerClassName="max-w-4xl text-center">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-8">
          This matches how your systems should already operate.
        </h2>
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Button size="lg" className="h-16 px-10 text-lg font-bold bg-primary hover:bg-primary/90">
            <Link href="/contact" className="gap-2">
              Schedule Enterprise Briefing <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="h-16 px-10 text-lg font-bold border-2">
            <Link href="/docs">View Specifications</Link>
          </Button>
        </div>
      </Section>

      <Footer />
    </div>
  );
}
