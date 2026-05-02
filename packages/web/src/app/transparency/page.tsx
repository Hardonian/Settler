import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { CTASection, PageHero, Section, SectionHeader } from "@/components/site/primitives";
import {
  ShieldCheck,
  Zap,
  Wrench,
  Lock,
  ScrollText,
  BadgeCheck,
  Eye,
  ArrowRight,
} from "lucide-react";

export default function TransparencyDashboard() {
  return (
    <div className="bg-background font-display text-foreground antialiased min-h-screen">
      <div className="relative flex h-full min-h-screen w-full flex-col bg-background">
        <Navigation />

        <main className="flex-1 pt-16">
          <PageHero
            eyebrow="Trust & Transparency"
            title="Deterministic by Design"
            description="Settler is built on the principle of absolute operational truth. Every matching decision is replayable, every exception is auditable, and every run produces verifiable evidence. Zero guessing, zero drift."
            visual={
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-primary/20 shadow-2xl bg-slate-950 flex items-center justify-center p-8">
                <div className="grid grid-cols-3 gap-4 w-full h-full opacity-50">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-primary/20 bg-primary/5 animate-pulse"
                      style={{ animationDelay: `${i * 100}ms` }}
                    />
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <div className="size-16 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                      <ShieldCheck className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xl font-bold text-white tracking-tight">Evidence Ledger</p>
                      <p className="text-sm text-primary/80 font-mono tracking-widest uppercase">
                        Verified & Sealed
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            }
          />

          <Section className="py-24 border-t border-border/40">
            <SectionHeader
              title="The Settlement Lifecycle"
              description="From raw ingestion to immutable evidence, every step in the Settler pipeline is designed for reproducibility."
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-16">
              <div className="space-y-4">
                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">1. Ingestion & Normalization</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Data enters via verified adapters. We map source fields to a canonical schema,
                  ensuring that comparisons are mathematically sound and consistent across systems.
                </p>
              </div>

              <div className="space-y-4">
                <div className="size-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <Wrench className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">2. Deterministic Matching</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Matching logic is executed as pure code. Same inputs always produce the same
                  outputs. Exceptions are flagged with full context, never silently resolved.
                </p>
              </div>

              <div className="space-y-4">
                <div className="size-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <Lock className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">3. Evidence Sealing</h3>
                <p className="text-muted-foreground leading-relaxed">
                  The final state is written to an immutable ledger and hash-linked. This creates a
                  tamper-evident proofpack that satisfies the most rigorous audit requirements.
                </p>
              </div>
            </div>
          </Section>

          <Section className="py-24 bg-muted/30 border-y border-border/40">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <h2 className="text-3xl font-bold tracking-tight">Safety & Governance Guardrails</h2>
              <p className="text-lg text-muted-foreground">
                Settler provides the infrastructure to enforce your financial policies at scale. Our
                safety mechanisms are structural, not elective.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-12 text-left">
                {[
                  {
                    icon: ScrollText,
                    title: "Audit Provenance",
                    desc: "Every record carries a full chain of custody. You know exactly who triggered the run, which policy was used, and what evidence was produced.",
                  },
                  {
                    icon: BadgeCheck,
                    title: "Isolation Bounds",
                    desc: "Tenant data is physically separated at the storage and runtime layer. No shared memory, no leakage risk between organizational workloads.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Policy Enforcement",
                    desc: "Ad-hoc reconciliation is prevented. Only registered, version-controlled policies can be executed against production datasets.",
                  },
                  {
                    icon: Eye,
                    title: "Explainable Adjudication",
                    desc: "When an operator resolves an exception, the rationale is captured and linked to the evidence, building a searchable knowledge base of decisions.",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow"
                  >
                    <item.icon className="h-8 w-8 text-primary mb-4" />
                    <h4 className="font-bold mb-2">{item.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          <CTASection
            title="Review our Trust Packet"
            description="Download the full technical specification of our security controls and deterministic matching protocols."
            primaryHref="/docs/trust-packet"
            primaryLabel="Download Trust Packet"
            secondaryHref="/contact"
            secondaryLabel="Speak with a Trust Engineer"
          />
        </main>

        <Footer />
      </div>
    </div>
  );
}
