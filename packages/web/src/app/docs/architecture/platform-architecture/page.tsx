import { Metadata } from "next";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, ShieldCheck, Lock, Globe, ArrowRight, Server, Terminal } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Platform Architecture | Settler Docs",
  description:
    "Deep-dive technical specification of the Settler distributed reconciliation engine.",
};

export default function DocsPlatformArchitecturePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Header Section */}
      <section className="relative pt-32 pb-24 border-b border-border/40 overflow-hidden bg-muted/10 dark:bg-card/20 shadow-2xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 space-y-10">
          <div className="flex flex-col items-center text-center space-y-6">
            <Badge
              variant="outline"
              className="px-4 py-1.5 bg-primary/10 text-primary border-primary/20 text-xs font-black tracking-[0.2em] uppercase"
            >
              Architecture Spec v2.4
            </Badge>
            <h1 className="text-4xl md:text-7xl font-bold tracking-tight text-foreground italic">
              Platform Architecture
            </h1>
            <p className="text-xl text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed italic underline">
              A comprehensive technical deep-dive into the distributed, deterministic engine that
              powers Settler's cryptographic reconciliation outcomes.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col lg:flex-row gap-16">
        {/* Table of Contents */}
        <aside className="lg:w-64 space-y-10 flex-shrink-0 relative">
          <div className="sticky top-32 space-y-10">
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Architectural Layers
              </h3>
              <nav className="space-y-2">
                {[
                  "Hardware Neutrality",
                  "Isolated Runtime",
                  "Storage Engines",
                  "The Trust Graph",
                ].map((item) => (
                  <Link
                    key={item}
                    href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                    className="block text-sm font-bold text-muted-foreground hover:text-primary transition-colors italic"
                  >
                    {item}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="p-6 rounded-2xl bg-muted/20 border border-border/40 space-y-3">
              <Server size={24} className="text-primary opacity-40 mx-auto" strokeWidth={3} />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-center leading-tight">
                Native Cluster Specs
              </p>
              <p className="text-xs font-bold text-foreground text-center italic border-b border-primary/20 pb-2 text-nowrap">
                Tier-4 Infrastructure
              </p>
            </div>
          </div>
        </aside>

        {/* Technical Spec Narrative */}
        <main className="flex-1 space-y-32">
          {/* Layer 1: Hardware Neutrality */}
          <section id="hardware-neutrality" className="space-y-12">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold tracking-tight italic border-l-4 border-l-primary/60 pl-8 underline underline-offset-8">
                Layer 1: Hardware Neutrality
              </h2>
              <p className="text-xl text-muted-foreground font-medium italic underline underline-offset-8 leading-relaxed max-w-3xl">
                Settler uses a specialized abstraction layer to ensure that reconciliation outcomes
                are identical regardless of the underlying CPU architecture (x86_64, ARM) or cloud
                provider.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="border-border/40 bg-card/60 shadow-none border-dashed hover:border-primary/20 transition-all">
                <CardHeader className="pb-4 border-b border-border/20">
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-primary" />
                    <CardTitle className="text-sm font-bold italic">
                      Bit-level Reproducibility
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-sm leading-relaxed text-muted-foreground font-medium italic">
                    Ensures floating point arithmetic and map iteration orders are pinned to a
                    global standard across all clusters.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/40 bg-card/60 shadow-none border-dashed hover:border-primary/20 transition-all">
                <CardHeader className="pb-4 border-b border-border/20">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-primary" />
                    <CardTitle className="text-sm font-bold italic">Region Consistency</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-sm leading-relaxed text-muted-foreground font-medium italic">
                    Automatic clock-drift compensation ensures that time-decaying predicates execute
                    identically globally.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Layer 2: Isolated Runtime */}
          <section id="isolated-runtime" className="space-y-12">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold tracking-tight italic border-l-4 border-l-primary/60 pl-8 underline underline-offset-8">
                Layer 2: Isolated Runtime VM
              </h2>
              <p className="text-xl text-muted-foreground font-medium leading-relaxed max-w-2xl italic underline underline-offset-8">
                Policies are executed inside an ephemeral, hardened VM. This sandbox prevents
                leakage between tenants and provides a pure functional environment for
                reconciliation logic.
              </p>
            </div>
            <Card className="bg-card border-white/5 shadow-2xl overflow-hidden glass group">
              <CardHeader className="bg-white/5 border-b border-white/5 p-4 flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                  <Terminal size={14} className="text-muted-foreground" />
                  <span className="text-[10px] font-mono text-muted-foreground/60 tracking-widest font-black italic">
                    RUNTIME_INIT OUTPUT
                  </span>
                </div>
                <Badge className="bg-primary/20 text-primary border-primary/40 text-[9px] font-black tracking-widest h-5">
                  STRICT_REPRO_ENABLED
                </Badge>
              </CardHeader>
              <CardContent className="p-8 font-mono text-sm text-muted-foreground/60 leading-relaxed overflow-x-auto whitespace-pre">
                <span className="text-success">[SEC]</span> Initializing secure enclave sandbox...
                <br />
                <span className="text-success">[RES]</span> Resource limits: CPU=2.0c, MEM=512MB
                <br />
                <span className="text-success">[ENV]</span> Determinism-Seed:{" "}
                <span className="text-amber-200">f928e1...821a</span>
                <br />
                <span className="text-success">[LOG]</span> Executing policy snapshot{" "}
                <span className="text-primary font-bold">@v2.4.1</span>
              </CardContent>
            </Card>
            <p className="text-sm font-bold text-muted-foreground/60 italic underline underline-offset-4 decoration-primary/20">
              Every runtime initialization event is logged to the immutable Audit Trail.
            </p>
          </section>

          {/* Layer 3: Storage Engines */}
          <section id="storage-engines" className="space-y-12">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold tracking-tight italic border-l-4 border-l-primary/60 pl-8 underline underline-offset-8">
                Layer 3: Hybrid Storage
              </h2>
              <p className="text-xl text-muted-foreground font-medium italic underline underline-offset-8 leading-relaxed max-w-3xl">
                Cold storage for large-scale transaction archives combined with hot, indexed storage
                for active reconciliation loops.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-8 rounded-3xl bg-muted/10 border border-border/40 space-y-4 shadow-xl border-t-4 border-t-primary/40">
                <Database className="text-primary" size={32} />
                <h4 className="text-lg font-bold italic underline">Truth Cluster</h4>
                <p className="text-sm text-muted-foreground font-medium italic leading-relaxed">
                  High-availability cluster storing active match data and threshold counters.
                </p>
              </div>
              <div className="p-8 rounded-3xl bg-muted/10 border border-border/40 space-y-4 shadow-xl border-t-4 border-t-primary/40">
                <Archive className="text-primary" size={32} />
                <h4 className="text-lg font-bold italic underline">The Glacier</h4>
                <p className="text-sm text-muted-foreground font-medium italic leading-relaxed">
                  Read-only, compressed archive for older reconciliation sessions.
                </p>
              </div>
              <div className="p-8 rounded-3xl bg-muted/10 border border-border/40 space-y-4 shadow-xl border-t-4 border-t-primary/40">
                <ShieldCheck className="text-primary" size={32} />
                <h4 className="text-lg font-bold italic underline">Root Vault</h4>
                <p className="text-sm text-muted-foreground font-medium italic leading-relaxed">
                  Hardened vault for storing Merkle roots and cryptographic signatures.
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* Footer CTA */}
      <section className="py-32 px-4 border-t border-border/40 bg-card text-white text-center space-y-12 relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/[0.05]" />
        <div className="max-w-4xl mx-auto space-y-12 relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight italic underline underline-offset-8">
            Ready to Inspect the Source?
          </h2>
          <p className="text-xl text-muted-foreground/60 font-medium italic underline">
            The Settler engine core is open-source. Audit our determinism primitives and
            cryptographic foundation on GitHub.
          </p>
          <div className="flex justify-center gap-6">
            <Button className="h-14 px-8 font-extrabold shadow-2xl ring-1 ring-primary/40 group">
              Visit GitHub Repository
              <ArrowRight
                size={18}
                className="ml-2 group-hover:translate-x-1 transition-transform"
              />
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
  ...props
}: any) {
  const Comp = asChild ? "div" : "button";
  const variants: any = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
    outline:
      "border border-border bg-background hover:bg-accent hover:text-accent-foreground shadow-sm",
    ghost: "hover:bg-accent hover:text-accent-foreground font-black",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
  };
  const sizes: any = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
  };
  return (
    <Comp
      className={`inline-flex items-center justify-center rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </Comp>
  );
}

function Archive({ className, size }: any) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="21 8 21 21 3 21 3 8"></polyline>
      <rect x="1" y="3" width="22" height="5"></rect>
      <line x1="10" y1="12" x2="14" y2="12"></line>
    </svg>
  );
}
