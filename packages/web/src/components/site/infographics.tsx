import {
  Check,
  Shield,
  Database,
  Activity,
  FileText,
  Lock,
  RefreshCw,
  Network,
  GitBranch,
  Server,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
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

/**
 * AdapterConnectionMap
 * Visual showing multiple sources connecting to a central hub.
 */
export function AdapterConnectionMap() {
  const sources = ["Stripe", "Salesforce", "Custom ERP", "Legacy DB", "API Hub"];
  return (
    <div className="relative h-64 w-full flex items-center justify-center overflow-hidden rounded-3xl border border-border bg-muted/10 p-12">
      <div className="absolute inset-0 bg-grid-quiet bg-grid opacity-20" />
      <div className="relative z-10 flex flex-wrap justify-center gap-4">
        {sources.map((source, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-sm animate-fade-in"
            style={{ animationDelay: `${i * 150}ms` }}
          >
            <Network className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold">{source}</span>
          </div>
        ))}
      </div>
      {/* Central Connector Lines (Abstract) */}
      <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="absolute inset-y-0 left-1/2 w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent" />
    </div>
  );
}

/**
 * RuleExecutionVisual
 * Stylized tree-like branching visual representing a rule execution path.
 */
export function RuleExecutionVisual() {
  return (
    <div className="relative h-80 w-full overflow-hidden rounded-3xl border border-border bg-card p-8">
      <div className="flex h-full flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <GitBranch className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-bold">Rule Engine Execution</h4>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
              TRACE_ID: 882f-119x-001
            </p>
          </div>
        </div>

        <div className="flex-1 mt-6 relative">
          {/* Branching Logic Visual */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-border group" />
          <div className="space-y-6">
            {[
              { label: "Amount Match", status: "PASS", color: "text-success" },
              { label: "Currency Alignment", status: "PASS", color: "text-success" },
              { label: "Date Tolerance", status: "FLAG", color: "text-warning" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 pl-10 relative">
                <div className="absolute left-5 top-1/2 w-5 h-px bg-border" />
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    item.status === "PASS" ? "bg-success" : "bg-warning animate-pulse"
                  )}
                />
                <span className="text-xs font-medium w-32">{item.label}</span>
                <span className={cn("text-[10px] font-bold uppercase tracking-widest", item.color)}>
                  [{item.status}]
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-border mt-auto">
          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
            <span>EXECUTION_TIME: 42ms</span>
            <span className="text-success font-bold">STATE: SEALED</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * IsolationVaultVisual
 * Visual representing high-security tenant isolation.
 */
export function IsolationVaultVisual() {
  return (
    <div className="relative h-64 overflow-hidden rounded-3xl border-2 border-primary/20 bg-slate-950 p-8 flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--primary-rgb),0.1)_0%,transparent_70%)]" />
      <div className="absolute inset-0 bg-grid-slate-900/[0.2] [mask-image:radial-gradient(white,transparent_85%)]" />

      <div className="relative group">
        <div className="h-24 w-24 rounded-2xl bg-primary/20 border border-primary/50 shadow-[0_0_50px_rgba(var(--primary-rgb),0.3)] flex items-center justify-center transition-transform hover:scale-105 duration-500">
          <Server className="h-10 w-10 text-primary" />
        </div>
        {/* Orbiting Elements */}
        <div className="absolute -inset-4 border border-primary/10 rounded-full animate-spin-slow" />
        <div className="absolute -inset-8 border border-primary/5 rounded-full animate-spin-slow [animation-direction:reverse]" />
      </div>

      <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-[10px] font-mono text-primary/60">
        <span>TENANT_ID: PRD_001</span>
        <span className="flex items-center gap-1">
          <Lock className="h-3 w-3" /> ENCRYPTED
        </span>
      </div>
    </div>
  );
}

/**
 * ExceptionTriageVisual
 * Visual representing the triage and resolution flow of exceptions.
 */
export function ExceptionTriageVisual() {
  return (
    <div className="relative h-64 w-full rounded-2xl border border-border bg-card p-6 overflow-hidden">
      <div className="absolute top-0 right-0 p-4">
        <TrendingUp className="h-5 w-5 text-success opacity-50" />
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center border border-warning/20">
            <AlertCircle className="h-4 w-4 text-warning" />
          </div>
          <h4 className="text-sm font-bold">Unresolved Exceptions</h4>
        </div>

        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-3 animate-pulse"
            >
              <div className="space-y-1">
                <div className="h-1.5 w-24 rounded bg-muted-foreground/20" />
                <div className="h-1.5 w-16 rounded bg-muted-foreground/10" />
              </div>
              <div className="h-6 w-12 rounded bg-primary/10 border border-primary/20" />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full w-2/3 bg-primary animate-progress" />
          </div>
          <span className="text-[10px] font-bold text-primary">67% Resolved</span>
        </div>
      </div>
    </div>
  );
}
