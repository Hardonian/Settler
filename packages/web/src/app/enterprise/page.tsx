import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import Image from "next/image";
import Link from "next/link";
import {
  Shield,
  Lock,
  Server,
  Users,
  ArrowRight,
  Eye,
  GitBranch,
  CheckCircle,
  Layers,
  Target,
} from "lucide-react";
import { Metadata } from "next";

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

const narrativeSections = [
  {
    badge: "The Control Narrative",
    title: "Reconciliation Is a Structural Risk Surface",
    description:
      "Manual reconciliation does not scale. As transaction volume grows, the failure surface expands. Deterministic automation reduces that surface by replacing probabilistic matching with inspectable, rules-based logic. Every variance is traceable. Every rule path is auditable.",
    icon: Target,
    visual: "https://images.pexels.com/photos/17483870/pexels-photo-17483870.png",
    visualAlt: "Abstract data flow representing deterministic reconciliation pipeline architecture",
  },
  {
    badge: "The Governance Narrative",
    title: "AI Compresses Uncertainty. Humans Retain Authority.",
    description:
      "Settler uses AI-assisted review to surface patterns and compress exception triage time. It does not replace human judgment. Every flagged variance includes evidence and confidence context. Final decisions remain with operators who understand the business context.",
    icon: Eye,
    visual: "https://images.pexels.com/photos/17485657/pexels-photo-17485657.png",
    visualAlt: "Abstract visualization representing AI-assisted review layer with human oversight nodes",
  },
];

export default function EnterprisePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navigation />

      {/* Hero */}
      <section
        className="relative pt-12 pb-16 md:pt-16 md:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden"
        aria-labelledby="enterprise-heading"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-6 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-2 text-sm font-medium">
                Enterprise Infrastructure
              </Badge>
              <h1
                id="enterprise-heading"
                className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-slate-900 dark:text-white leading-tight mb-6 tracking-tight"
              >
                What Serious Financial Infrastructure Evolves Toward
              </h1>
              <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                Deploy deterministic reconciliation with tenant isolation, governance boundaries,
                and audit-ready evidence trails. Designed for teams where operational confidence
                is not optional.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  asChild
                  className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white px-8 py-6 text-lg font-semibold"
                >
                  <Link href="/contact" className="flex items-center justify-center gap-2">
                    Discuss Your Architecture <ArrowRight className="w-5 h-5" aria-hidden="true" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="px-8 py-6 text-lg"
                >
                  <Link href="/pricing">Explore Engagement Models</Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full" aria-hidden="true" />
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
                <Image
                  src="https://images.pexels.com/photos/25626439/pexels-photo-25626439.jpeg"
                  alt="Enterprise architecture visualization representing institutional-grade reconciliation infrastructure"
                  width={600}
                  height={400}
                  className="w-full h-auto"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Capabilities */}
      <section
        className="py-16 md:py-24 bg-white dark:bg-slate-900 px-4 sm:px-6 lg:px-8"
        aria-label="Enterprise capabilities"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-slate-900 dark:text-white tracking-tight">
              Enterprise Capabilities
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Security, compliance, and governance controls built into the infrastructure layer.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {enterpriseCapabilities.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <SpotlightCard key={index} className="p-6 md:p-8 border-slate-200 dark:border-slate-800">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mb-6">
                    <Icon className="w-6 h-6 text-slate-700 dark:text-slate-300" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold mb-3 text-slate-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </SpotlightCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* Narrative Sections - Control + Governance */}
      {narrativeSections.map((section, index) => {
        const Icon = section.icon;
        const isEven = index % 2 === 0;
        return (
          <section
            key={index}
            className={`py-16 md:py-24 px-4 sm:px-6 lg:px-8 ${isEven ? "bg-slate-50 dark:bg-slate-950" : "bg-white dark:bg-slate-900"}`}
            aria-label={section.badge}
          >
            <div className="max-w-6xl mx-auto">
              <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${isEven ? "" : "lg:[direction:rtl]"}`}>
                <div className={isEven ? "" : "lg:[direction:ltr]"}>
                  <Badge className="mb-4 bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 px-3 py-1 text-xs font-medium uppercase tracking-wider">
                    {section.badge}
                  </Badge>
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 text-slate-900 dark:text-white tracking-tight leading-tight">
                    {section.title}
                  </h2>
                  <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                    {section.description}
                  </p>
                </div>
                <div className={isEven ? "" : "lg:[direction:ltr]"}>
                  <div className="relative rounded-2xl overflow-hidden shadow-lg">
                    <Image
                      src={section.visual}
                      alt={section.visualAlt}
                      width={600}
                      height={340}
                      className="w-full h-auto object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {/* Operational Maturity Narrative */}
      <section
        className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950"
        aria-label="Operational maturity"
      >
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 px-3 py-1 text-xs font-medium uppercase tracking-wider">
            The Operational Maturity Narrative
          </Badge>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 text-slate-900 dark:text-white tracking-tight">
            Manual Reconciliation Is a Phase
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed mb-12">
            Deterministic, API-based reconciliation is the stable end-state that mature financial
            operations evolve toward. The question is not whether to adopt it, but when.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Layers,
                title: "Before",
                description: "Manual exports, fragile scripts, untracked variances. Failure surfaces expand with volume.",
              },
              {
                icon: GitBranch,
                title: "Transition",
                description: "Rules codified, adapters connected, audit trails established. Variance surface compressed.",
              },
              {
                icon: CheckCircle,
                title: "Controlled State",
                description: "Deterministic automation, governance boundaries enforced, every decision reviewable and traceable.",
              },
            ].map((phase, idx) => {
              const Icon = phase.icon;
              return (
                <div
                  key={idx}
                  className="p-6 md:p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800"
                >
                  <Icon className="w-8 h-8 text-slate-700 dark:text-slate-300 mx-auto mb-4" aria-hidden="true" />
                  <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">{phase.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{phase.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Audit Narrative */}
      <section
        className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900"
        aria-label="Audit readiness"
      >
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 px-3 py-1 text-xs font-medium uppercase tracking-wider">
            The Audit Narrative
          </Badge>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 text-slate-900 dark:text-white tracking-tight">
            Every Decision Traceable
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
            Every workflow reproducible. Every adjustment reviewable.
            Settler produces deterministic evidence that auditors can independently verify.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            {[
              "Deterministic outputs with SHA256 evidence hashing",
              "Complete rule path traces for every reconciliation run",
              "Human-in-the-loop approval workflows with full attribution",
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800"
              >
                <CheckCircle className="w-8 h-8 text-slate-700 dark:text-slate-300 mx-auto mb-4" aria-hidden="true" />
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>

          {/* Compliance Badges */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {[
              { label: "SOC 2 TYPE II", sublabel: "Ready" },
              { label: "GDPR", sublabel: "Compliant" },
              { label: "AES-256", sublabel: "Encrypted" },
            ].map((badge, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <Shield className="w-10 h-10 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{badge.label}</span>
                <span className="text-xs text-slate-500 dark:text-slate-500">{badge.sublabel}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white" aria-label="Enterprise engagement">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold mb-6 tracking-tight">
            This matches how your systems should already operate.
          </h2>
          <p className="text-lg md:text-xl text-slate-400 mb-10 leading-relaxed max-w-2xl mx-auto">
            Discuss your reconciliation architecture with our team.
            No dramatic claims. Quiet inevitability.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              asChild
              className="w-full sm:w-auto bg-white text-slate-900 hover:bg-slate-100 px-10 py-7 text-lg font-semibold"
            >
              <Link href="/contact" className="flex items-center justify-center gap-2">
                Schedule an Enterprise Briefing <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="w-full sm:w-auto px-10 py-7 text-lg border-2 border-slate-600 bg-transparent text-white hover:bg-slate-800"
            >
              <Link href="/pricing">Explore Engagement Models</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
