import { Metadata } from "next";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { PlatformOverviewDiagram, CapabilityMap } from "@/components/public-visual-proof";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Database, Network, Zap, Globe, Layers, ArrowRight } from "lucide-react";
import Link from "next/link";

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

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 border-b border-border/40 overflow-hidden bg-muted/10">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-10">
          <div className="flex flex-col items-center space-y-6">
            <Badge
              variant="outline"
              className="px-4 py-1.5 bg-primary/10 text-primary border-primary/20 text-xs font-black tracking-[0.2em] uppercase h-auto"
            >
              Technical Specification
            </Badge>
            <h1 className="text-4xl md:text-7xl font-bold tracking-tight text-foreground italic">
              Architecture & Proof
            </h1>
            <p className="text-xl text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed">
              Settler is built on a foundation of cryptographic determinism. Every component is
              designed to be auditable, reproducible, and resilient to state manipulation.
            </p>
          </div>
          <div className="flex justify-center gap-6">
            <Button asChild size="lg" className="h-14 px-8 text-lg font-bold gap-2">
              <Link href="/docs/architecture/platform-architecture">
                Read the Spec
                <ArrowRight size={18} />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Visual Component Grid */}
      <section className="py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {components.map((item) => (
            <Card
              key={item.title}
              className="border-border/40 bg-card overflow-hidden hover:border-primary/40 transition-all hover:shadow-2xl group border-t-2"
            >
              <CardHeader className="p-8">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                  <item.icon size={28} />
                </div>
                <CardTitle className="text-xl font-bold italic">{item.title}</CardTitle>
                <CardDescription className="font-medium mt-4 leading-relaxed italic">
                  {item.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Primary Diagrams */}
      <section className="py-24 space-y-32 bg-slate-50 dark:bg-slate-950/50 border-y border-border/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold italic tracking-tight underline underline-offset-8">
              Global Service Map
            </h2>
            <p className="text-muted-foreground font-medium italic underline underline-offset-4">
              Orchestration across regional boundaries and data isolation protocols.
            </p>
          </div>
          <div className="p-8 bg-background border border-border/60 rounded-3xl shadow-2xl">
            <PlatformOverviewDiagram />
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold italic tracking-tight underline underline-offset-8">
              Capability Clustering
            </h2>
            <p className="text-muted-foreground font-medium italic underline underline-offset-4">
              Module boundaries and programmatic access points.
            </p>
          </div>
          <div className="p-8 bg-background border border-border/60 rounded-3xl shadow-2xl">
            <CapabilityMap />
          </div>
        </div>
      </section>

      {/* Deep Technical Deep-dive CTA */}
      <section className="py-32 bg-slate-900 text-white overflow-hidden relative border-t border-white/5 shadow-2xl">
        <div className="absolute left-0 top-0 p-20 opacity-[0.03]">
          <Layers className="h-96 w-96 text-primary" />
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center space-y-12 relative z-10">
          <ShieldCheck size={80} className="text-primary mx-auto mb-8 opacity-40 shadow-2xl" />
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight italic underline underline-offset-8">
            Immutable Evidence by Design
          </h2>
          <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-3xl mx-auto">
            We don&apos;t just reconcile data; we generate a cryptographically valid proof of every
            outcome. Learn why the world&apos;s leading financial institutions trust our
            deterministic architecture.
          </p>
          <div className="pt-8 flex flex-col sm:flex-row justify-center gap-6">
            <Button
              size="lg"
              className="h-14 px-8 font-extrabold gap-2 shadow-2xl ring-1 ring-primary/40"
            >
              Technical Whitepaper
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="h-14 px-8 font-bold text-slate-300 hover:text-white border border-white/10 hover:bg-white/5"
            >
              Security Hardening Spec
            </Button>
          </div>
        </div>
      </section>

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
