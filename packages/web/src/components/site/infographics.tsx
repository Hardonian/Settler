import { Check, Shield, Database, Activity, FileText, Lock, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ReconciliationFlow
 * A step-by-step visual of Source A -> Normalization -> Matching -> Evidence.
 */
export function ReconciliationFlow() {
  const steps = [
    { icon: Database, label: "Ingest", description: "Multi-source raw data" },
    { icon: RefreshCw, label: "Normalize", description: "Canonical transformation" },
    { icon: Activity, label: "Reconcile", description: "Deterministic matching" },
    { icon: FileText, label: "Evidence", description: "Hash-linked manifests" },
  ];

  return (
    <div className="relative flex w-full flex-col items-center gap-8 py-12 md:flex-row md:justify-between md:gap-4 md:py-16">
      {/* Connector Line (Desktop) */}
      <div className="absolute top-1/2 left-0 hidden h-0.5 w-full -translate-y-1/2 bg-border/40 md:block" />

      {steps.map((step, idx) => (
        <div key={idx} className="relative z-10 flex flex-col items-center text-center">
          <div className="group relative flex h-16 w-16 items-center justify-center rounded-2xl bg-card border border-border shadow-sm transition-all duration-300 hover:border-primary/50 hover:shadow-md hover:-translate-y-1">
            <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 transition-opacity group-hover:opacity-100" />
            <step.icon className="h-7 w-7 text-primary transition-transform duration-300 group-hover:scale-110" />
          </div>
          <div className="mt-4">
            <h4 className="text-sm font-bold tracking-tight text-foreground">{step.label}</h4>
            <p className="mt-1 max-w-[120px] text-xs leading-relaxed text-muted-foreground">
              {step.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * DeterministicCheck
 * A visual comparing "Probabilistic" (fuzzy/gray) vs "Deterministic" (sharp/teal).
 */
export function DeterministicCheck() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="group rounded-2xl border border-border bg-card p-6 opacity-60 grayscale transition-all duration-500 hover:opacity-100 hover:grayscale-0">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Traditional
          </span>
          <span className="rounded-full bg-neutral-200/50 px-2.5 py-1 text-[10px] font-bold text-neutral-600">
            Probabilistic
          </span>
        </div>
        <div className="space-y-3">
          <div className="h-2 w-full rounded-full bg-muted/40 blur-[1px]" />
          <div className="h-2 w-3/4 rounded-full bg-muted/40 blur-[1px]" />
          <div className="h-2 w-5/6 rounded-full bg-muted/40 blur-[2px]" />
        </div>
        <p className="mt-6 text-xs text-muted-foreground italic">
          "Likely a match (85% confidence)... maybe?"
        </p>
      </div>

      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 shadow-inner ring-1 ring-primary/20">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Settler</span>
          <span className="rounded-full bg-primary/20 px-2.5 py-1 text-[10px] font-bold text-primary">
            Deterministic
          </span>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-full rounded-full bg-primary/30" />
            <Check className="h-4 w-4 shrink-0 text-primary" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-3/4 rounded-full bg-primary/30" />
            <Check className="h-4 w-4 shrink-0 text-primary" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-5/6 rounded-full bg-primary/30" />
            <Check className="h-4 w-4 shrink-0 text-primary" />
          </div>
        </div>
        <p className="mt-6 text-xs font-medium text-primary">
          "Exact match established. Evidence sealed."
        </p>
      </div>
    </div>
  );
}

/**
 * VisualGrid
 * Abstract visual element to fill white space. A subtle grid with glowing intersections.
 */
export function VisualGrid({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative h-64 overflow-hidden rounded-3xl border border-border/50 bg-muted/5",
        className
      )}
    >
      <div className="absolute inset-0 bg-grid-quiet bg-grid" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

      {/* Floating Blobs */}
      <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl animate-float" />
      <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl animate-float [animation-delay:2s]" />

      <div className="relative flex h-full items-center justify-center p-8 text-center">
        <div className="space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-background border border-border shadow-sm">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <p className="max-w-xs text-sm font-medium tracking-tight text-muted-foreground/80">
            Engineered for high-integrity financial operations where every byte counts.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * EvidenceArtifactPreview
 * A stylized visual of an evidence bundle.
 */
export function EvidenceArtifactPreview() {
  return (
    <div className="relative p-4 sm:p-8">
      <div className="relative z-10 rounded-2xl border border-border bg-card shadow-2xl transition-transform duration-500 hover:scale-[1.02]">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-400" />
            <div className="h-3 w-3 rounded-full bg-amber-400" />
            <div className="h-3 w-3 rounded-full bg-emerald-400" />
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">MANIFEST_v1.0_SIGNED</span>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-2 w-24 rounded bg-muted animate-pulse" />
            <div className="h-2 w-16 rounded bg-primary/20" />
          </div>
          <div className="space-y-2">
            <div className="h-8 w-full rounded bg-muted/40" />
            <div className="h-8 w-full rounded bg-muted/40" />
            <div className="h-8 w-full rounded bg-muted/40" />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Lock className="h-4 w-4 text-success" />
            <span className="text-xs font-bold text-success uppercase tracking-wider">
              Hash Verified
            </span>
          </div>
        </div>
      </div>

      {/* Decorative background cards */}
      <div className="absolute top-12 left-12 right-12 bottom-0 -z-10 translate-y-4 rounded-2xl border border-border bg-card/60 grayscale blur-[2px]" />
      <div className="absolute top-16 left-16 right-16 bottom-0 -z-20 translate-y-8 rounded-2xl border border-border bg-card/30 grayscale blur-[4px]" />
    </div>
  );
}
