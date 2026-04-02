import { Metadata } from "next";
import Image from "next/image";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { PlatformOverviewDiagram, CapabilityMap } from "@/components/public-visual-proof";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck, Database, Network, Zap, Globe, Layers, ArrowRight } from "lucide-react";
import Link from "next/link";
import { RuleExecutionVisual, AdapterConnectionMap } from "@/components/site/infographics";
import { Section, PageHero } from "@/components/site/primitives";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Architecture | Settler",
  description: "The technical blueprint of the Settler deterministic reconciliation engine.",
};

const components = [
  {
    title: "Ingestion Adapter Layer",
    icon: Database,
    description: "Standardized connectors for Stripe, Adyen, PostgreSQL, and custom sources.",
  },
  {
    title: "Deterministic Match Engine",
    icon: Zap,
    description: "Isolated VM executing reconciliation policies with bit-perfect reproducibility.",
  },
  {
    title: "Merkle-Tree Proof Graph",
    icon: Network,
    description: "The cryptographic core ensuring every match is linked to a signed evidence root.",
  },
  {
    title: "Multi-Region Control Plane",
    icon: Globe,
    description:
      "Global orchestration and synchronization for high-availability enterprise workloads.",
  },
];

export default function ArchitecturePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <PageHero
        eyebrow="Technical Specification"
        title="Architecture & Proof"
        description="Settler is built on a foundation of cryptographic determinism. Every component is designed to be auditable, reproducible, and resilient to state manipulation."
        visual={
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-primary/20 shadow-2xl">
            <Image
              src="/rule_trace_3d.png"
              alt="Rule execution trace visualization"
              fill
              className="object-cover"
            />
          </div>
        }
        actions={
          <Button asChild size="lg">
            <Link href="/docs/architecture/platform-architecture">
              Read the Spec <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        }
      />

      {/* Visual Component Grid */}
      <Section className="py-20 lg:py-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {components.map((item) => (
            <Card
              key={item.title}
              className="border-border/40 bg-card overflow-hidden hover:border-primary/40 transition-all hover:shadow-xl group"
            >
              <CardHeader className="p-8 text-center sm:text-left">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 mx-auto sm:mx-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                  <item.icon size={28} />
                </div>
                <CardTitle className="text-xl font-bold tracking-tight">{item.title}</CardTitle>
                <CardDescription className="text-sm font-medium mt-4 leading-relaxed">
                  {item.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </Section>

      {/* Primary Diagrams */}
      <Section withGrid className="bg-muted/10 space-y-32 border-y border-border/40">
        <div className="space-y-12">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight">Global Service Map</h2>
            <p className="text-muted-foreground font-medium">
              Orchestration across regional boundaries and data isolation protocols.
            </p>
          </div>
          <div className="p-8 bg-background border border-border/60 rounded-3xl shadow-xl">
            <PlatformOverviewDiagram />
          </div>
        </div>

        <div className="space-y-12">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight">Rule Execution Path</h2>
            <p className="text-muted-foreground font-medium">
              Deterministic branching logic with explicit pass/fail state traces.
            </p>
          </div>
          <RuleExecutionVisual />
        </div>

        <div className="space-y-12 text-foreground">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight">Capability Clustering</h2>
            <p className="text-muted-foreground font-medium">
              Module boundaries and programmatic access points.
            </p>
          </div>
          <div className="p-8 bg-background border border-border/60 rounded-3xl shadow-xl">
            <CapabilityMap />
          </div>
        </div>
      </Section>

      <Section className="py-20">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Adapter Ecosystem</h2>
          <p className="text-muted-foreground font-medium">
            Standardized connectors for existing financial infrastructure.
          </p>
        </div>
        <AdapterConnectionMap />
      </Section>

      {/* Deep Technical Deep-dive CTA */}
      <Section
        className="bg-slate-900 text-white overflow-hidden relative"
        containerClassName="max-w-4xl text-center space-y-10"
      >
        <div className="absolute left-0 top-0 p-20 opacity-[0.03]">
          <Layers className="h-96 w-96 text-primary" />
        </div>
        <div className="relative z-10 space-y-8">
          <ShieldCheck size={80} className="text-primary mx-auto mb-8 opacity-40" />
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Immutable Evidence by Design
          </h2>
          <p className="text-lg text-slate-400 font-medium leading-relaxed max-w-3xl mx-auto">
            We don&apos;t just reconcile data; we generate a cryptographically valid proof of every
            outcome. Learn why the world&apos;s leading financial institutions trust our
            deterministic architecture.
          </p>
          <div className="pt-8 flex flex-col sm:flex-row justify-center gap-6">
            <Button size="lg" className="h-14 px-8 font-extrabold bg-primary hover:bg-primary/90">
              Technical Whitepaper
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-14 px-8 font-bold text-white border-white/20 hover:bg-white/10 bg-transparent"
            >
              Security Hardening Spec
            </Button>
          </div>
        </div>
      </Section>

      <Footer />
    </div>
  );
}

function Button({
  children,
  className,
  variant = "default",
  size = "default",
  asChild = false,
}: any) {
  const Comp = asChild ? "div" : "button";
  const variants: any = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-border bg-background hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
  };
  const sizes: any = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
  };
  return (
    <Comp
      className={`inline-flex items-center justify-center rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </Comp>
  );
}
