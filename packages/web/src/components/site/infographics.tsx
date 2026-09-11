"use client";

import { useState, useEffect } from "react";
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
  CheckCircle2,
  Cpu,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

/**
 * ReconciliationFlow
 * A step-by-step visual of Source A -> Normalization -> Matching -> Evidence.
 * Includes moving energy beams and interactive step selection.
 */
export function ReconciliationFlow() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      icon: Database,
      label: "Ingest",
      description: "25+ multi-source feeds",
      detail: "Normalized ingestion via verified Stripe, Bank & ERP connectors",
    },
    {
      icon: RefreshCw,
      label: "Normalize",
      description: "Canonical schema v2",
      detail: "Type-safe mapping with timezone and currency ISO alignment",
    },
    {
      icon: Activity,
      label: "Reconcile",
      description: "Sub-ms matching core",
      detail: "Deterministic rules-as-code matching with zero float drift",
    },
    {
      icon: FileText,
      label: "Evidence",
      description: "SHA-256 Merkle proofs",
      detail: "Immutable audit proofpacks sealed with cryptographic hashes",
    },
  ];

  // Auto-cycle through the steps to provide continuous live motion
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <div className="relative flex w-full flex-col items-center gap-6 py-10 md:py-14">
      {/* Desktop Animated Connector Line */}
      <div className="relative w-full">
        <div className="absolute top-8 left-12 right-12 hidden h-1 -translate-y-1/2 rounded-full bg-slate-200/80 dark:bg-slate-800 md:block overflow-hidden">
          {/* Continuous Traveling Energy Beam */}
          <div
            className="h-full w-40 rounded-full bg-gradient-to-r from-transparent via-teal-500 to-transparent animate-beam"
            style={{ animationDuration: "3s" }}
          />
        </div>

        {/* Step Nodes */}
        <div className="relative z-10 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4 md:gap-4">
          {steps.map((step, idx) => {
            const isActive = activeStep === idx;
            const Icon = step.icon;

            return (
              <button
                key={step.label}
                type="button"
                onClick={() => setActiveStep(idx)}
                className={cn(
                  "group relative flex flex-col items-center text-center p-4 rounded-2xl transition-all duration-300 cursor-pointer text-left md:text-center",
                  "border bg-white dark:bg-card/80 backdrop-blur-sm",
                  isActive
                    ? "border-teal-500/60 shadow-lg shadow-teal-500/10 ring-2 ring-teal-500/30 -translate-y-1"
                    : "border-slate-200/80 dark:border-border hover:border-teal-500/40 hover:shadow-md"
                )}
              >
                {/* Node Icon Circle */}
                <div
                  className={cn(
                    "relative flex h-16 w-16 items-center justify-center rounded-2xl border transition-all duration-300",
                    isActive
                      ? "border-teal-500 bg-teal-50 dark:bg-teal-950/50 shadow-inner"
                      : "border-slate-200 dark:border-border bg-slate-50 dark:bg-muted/40 group-hover:border-teal-500/50"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-7 w-7 transition-transform duration-300",
                      isActive
                        ? "text-teal-600 dark:text-teal-400 scale-110"
                        : "text-slate-600 dark:text-muted-foreground group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:scale-105"
                    )}
                  />
                  {isActive && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500" />
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-xs font-mono text-teal-600 dark:text-teal-400 font-bold">
                      0{idx + 1}
                    </span>
                    <h4 className="text-sm font-bold tracking-tight text-slate-900 dark:text-foreground">
                      {step.label}
                    </h4>
                  </div>
                  <p className="mt-1 text-xs font-medium text-slate-500 dark:text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Step Detail Card */}
      <div className="w-full max-w-xl rounded-xl border border-teal-500/20 bg-teal-50/50 dark:bg-teal-950/20 px-4 py-2.5 text-center flex items-center justify-center gap-2 text-xs text-teal-900 dark:text-teal-200 transition-all">
        <Sparkles className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
        <span className="font-semibold">{steps[activeStep]?.label}:</span>
        <span>{steps[activeStep]?.detail}</span>
      </div>
    </div>
  );
}

/**
 * DeterministicCheck
 * A visual comparing "Probabilistic" (fuzzy/gray) vs "Deterministic" (sharp/teal).
 * Elevated with rich high-contrast light mode styling.
 */
export function DeterministicCheck() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* Traditional Fuzzy Side */}
      <div className="group rounded-2xl border border-slate-200 dark:border-border bg-slate-100/70 dark:bg-card/40 p-6 opacity-75 transition-all duration-300 hover:opacity-100 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-muted-foreground">
            Traditional Approach
          </span>
          <span className="rounded-full bg-slate-200 dark:bg-neutral-800 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:text-neutral-300">
            Probabilistic
          </span>
        </div>
        <div className="space-y-3">
          <div className="h-2 w-full rounded-full bg-slate-300/60 dark:bg-muted/40 blur-[1px]" />
          <div className="h-2 w-3/4 rounded-full bg-slate-300/60 dark:bg-muted/40 blur-[1px]" />
          <div className="h-2 w-5/6 rounded-full bg-slate-300/60 dark:bg-muted/40 blur-[2px]" />
        </div>
        <div className="mt-6 flex items-center gap-2 text-xs text-slate-500 dark:text-muted-foreground italic">
          <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <span>&ldquo;Fuzzy match: ~85% confidence score (drift risk)&rdquo;</span>
        </div>
      </div>

      {/* Settler Deterministic Side */}
      <div className="rounded-2xl border border-teal-500/40 bg-gradient-to-br from-teal-50/70 via-white to-emerald-50/60 dark:from-teal-950/30 dark:via-card dark:to-emerald-950/20 p-6 shadow-md ring-1 ring-teal-500/20 transition-all duration-300 hover:shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-teal-700 dark:text-teal-400">
            Settler Engine
          </span>
          <span className="rounded-full bg-teal-500/20 px-2.5 py-1 text-[10px] font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
            Deterministic
          </span>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-full rounded-full bg-teal-500/30" />
            <Check className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400 font-bold" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-3/4 rounded-full bg-teal-500/30" />
            <Check className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400 font-bold" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-5/6 rounded-full bg-teal-500/30" />
            <Check className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400 font-bold" />
          </div>
        </div>
        <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-teal-800 dark:text-teal-300">
          <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
          <span>Exact match sealed. Hash-verified proofpack output.</span>
        </div>
      </div>
    </div>
  );
}

/**
 * VisualGrid
 * Abstract visual element with glowing intersections and floating ambient motion.
 */
export function VisualGrid({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative h-64 overflow-hidden rounded-3xl border border-slate-200/80 dark:border-border/50 bg-gradient-to-b from-white via-slate-50/50 to-slate-100/40 dark:from-muted/5 dark:to-transparent shadow-inner",
        className
      )}
    >
      <div className="absolute inset-0 bg-grid-quiet bg-grid" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

      {/* Floating Animated Ambient Blobs */}
      <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-teal-400/15 dark:bg-primary/10 blur-3xl animate-blob" />
      <div
        className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-blue-500/15 dark:bg-blue-500/10 blur-3xl animate-blob"
        style={{ animationDelay: "2s" }}
      />

      <div className="relative flex h-full items-center justify-center p-8 text-center">
        <div className="space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white dark:bg-background border border-slate-200 dark:border-border shadow-md transition-transform duration-300 hover:scale-110">
            <Shield className="h-6 w-6 text-teal-600 dark:text-teal-400" />
          </div>
          <p className="max-w-xs text-sm font-medium tracking-tight text-slate-700 dark:text-muted-foreground">
            Engineered for high-integrity financial operations where every byte counts.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * EvidenceArtifactPreview
 * A stylized visual of an evidence bundle with high-contrast light mode styling.
 */
export function EvidenceArtifactPreview() {
  return (
    <div className="relative p-4 sm:p-8">
      <div className="relative z-10 rounded-2xl border border-slate-200/80 dark:border-border bg-white dark:bg-card shadow-2xl transition-transform duration-500 hover:scale-[1.02] overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-border bg-slate-50/80 dark:bg-muted/30 p-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-400" />
            <div className="h-3 w-3 rounded-full bg-amber-400" />
            <div className="h-3 w-3 rounded-full bg-emerald-400" />
          </div>
          <span className="text-[10px] font-mono text-slate-600 dark:text-muted-foreground font-semibold">
            MANIFEST_v2.4_SIGNED.json
          </span>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-2 w-28 rounded bg-teal-500/20" />
            <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400 font-bold">
              SHA256_SEALED
            </span>
          </div>
          <div className="space-y-2 font-mono text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/60 dark:border-white/5">
            <div className="text-teal-600 dark:text-teal-400 font-semibold">
              &quot;merkle_root&quot;: &quot;7f4c8b...3e1a09&quot;,
            </div>
            <div>&quot;reconciliation_id&quot;: &quot;rec_882f-119x&quot;,</div>
            <div>&quot;tolerance_drift&quot;: 0.0000,</div>
            <div className="text-emerald-600 dark:text-emerald-400 font-semibold">
              &quot;discrepancy_count&quot;: 0
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              <span className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider">
                Cryptographically Sealed
              </span>
            </div>
            <Badge
              variant="outline"
              className="text-[10px] font-mono border-teal-500/30 text-teal-700 dark:text-teal-300"
            >
              AUDIT READY
            </Badge>
          </div>
        </div>
      </div>

      {/* Decorative background cards with crisp offset shadows */}
      <div className="absolute top-12 left-12 right-12 bottom-0 -z-10 translate-y-4 rounded-2xl border border-slate-200/50 dark:border-border bg-slate-100/50 dark:bg-card/60 blur-[1px]" />
      <div className="absolute top-16 left-16 right-16 bottom-0 -z-20 translate-y-8 rounded-2xl border border-slate-200/30 dark:border-border bg-slate-100/30 dark:bg-card/30 blur-[2px]" />
    </div>
  );
}

/**
 * AdapterConnectionMap
 * Interactive Integration Radar: Click/hover adapters to inspect live throughput and latency.
 */
export function AdapterConnectionMap() {
  const [selectedIdx, setSelectedIdx] = useState(0);

  const adapters = [
    { name: "Stripe", latency: "1.2ms", throughput: "1,840 tx/s", category: "Payments" },
    { name: "Shopify", latency: "2.1ms", throughput: "920 orders/s", category: "Commerce" },
    { name: "QuickBooks", latency: "3.4ms", throughput: "GL Sync", category: "Accounting" },
    { name: "NetSuite", latency: "3.8ms", throughput: "ERP Journal", category: "Enterprise" },
    { name: "Chase", latency: "0.8ms", throughput: "FedNow/ACH", category: "Banking" },
    { name: "Plaid", latency: "1.9ms", throughput: "Balance Feed", category: "Aggregator" },
  ];

  const activeAdapter = adapters[selectedIdx] ?? adapters[0]!;

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-slate-200/80 dark:border-border bg-gradient-to-br from-white via-slate-50 to-slate-100/50 dark:from-card dark:via-muted/20 dark:to-card p-6 sm:p-8 shadow-sm">
      <div className="absolute inset-0 bg-grid-quiet bg-grid opacity-25" />

      {/* Header telemetry badge */}
      <div className="relative z-10 flex items-center justify-between mb-6 pb-4 border-b border-slate-200/80 dark:border-border">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-foreground">
            Verified Ingestion Feeds
          </span>
        </div>
        <Badge
          variant="outline"
          className="text-[10px] font-mono border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40"
        >
          25+ CONNECTORS ACTIVE
        </Badge>
      </div>

      {/* Interactive Adapter Pills */}
      <div className="relative z-10 flex flex-wrap justify-center gap-3">
        {adapters.map((adapter, i) => {
          const isSelected = selectedIdx === i;

          return (
            <button
              key={adapter.name}
              type="button"
              onClick={() => setSelectedIdx(i)}
              className={cn(
                "group flex items-center gap-2 rounded-full border px-3.5 py-1.5 transition-all duration-200 cursor-pointer",
                isSelected
                  ? "bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/20 scale-105"
                  : "bg-white dark:bg-card border-slate-200/80 dark:border-border text-slate-700 dark:text-slate-200 hover:border-teal-500/50 hover:bg-slate-50 dark:hover:bg-muted/50"
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  isSelected ? "bg-white animate-pulse" : "bg-emerald-500"
                )}
              />
              <span className="text-xs font-semibold">{adapter.name}</span>
            </button>
          );
        })}
      </div>

      {/* Live Telemetry Display for Selected Adapter */}
      <div className="relative z-10 mt-6 rounded-2xl border border-teal-500/20 bg-teal-50/60 dark:bg-teal-950/30 p-4 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            <span className="font-bold text-slate-900 dark:text-foreground">
              {activeAdapter.name} Normalizer
            </span>
            <span className="text-slate-500 dark:text-muted-foreground">
              ({activeAdapter.category})
            </span>
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span className="text-slate-600 dark:text-slate-300">
              Throughput:{" "}
              <strong className="text-teal-700 dark:text-teal-300">
                {activeAdapter.throughput}
              </strong>
            </span>
            <span className="text-slate-600 dark:text-slate-300">
              Latency:{" "}
              <strong className="text-emerald-700 dark:text-emerald-300">
                {activeAdapter.latency}
              </strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * RuleExecutionVisual
 * Stylized tree-like branching visual representing a rule execution path.
 */
export function RuleExecutionVisual() {
  return (
    <div className="relative h-84 w-full overflow-hidden rounded-3xl border border-slate-200/80 dark:border-border bg-white dark:bg-card p-6 sm:p-8 shadow-sm">
      <div className="flex h-full flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center border border-teal-500/20">
              <GitBranch className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-foreground">
                Rule Engine Execution
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-muted-foreground uppercase tracking-widest font-mono">
                TRACE_ID: 882f-119x-001
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] font-mono border-teal-500/30 text-teal-700 dark:text-teal-300"
          >
            DETERMINISTIC
          </Badge>
        </div>

        <div className="flex-1 mt-6 relative">
          {/* Branching Logic Visual */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200 dark:bg-border" />
          <div className="space-y-4">
            {[
              {
                label: "Amount Match",
                status: "PASS",
                detail: "Exact $0.00 delta",
                color: "text-emerald-600 dark:text-emerald-400",
              },
              {
                label: "Currency Alignment",
                status: "PASS",
                detail: "ISO-4217 EUR==EUR",
                color: "text-emerald-600 dark:text-emerald-400",
              },
              {
                label: "Date Tolerance",
                status: "APPLIED",
                detail: "±48h window approved",
                color: "text-teal-600 dark:text-teal-400",
              },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 pl-10 relative">
                <div className="absolute left-5 top-1/2 w-5 h-px bg-slate-200 dark:bg-border" />
                <div className="h-2.5 w-2.5 rounded-full bg-teal-500 shadow-sm shadow-teal-500/50" />
                <div className="flex flex-1 items-center justify-between bg-slate-50 dark:bg-muted/20 px-3 py-1.5 rounded-lg border border-slate-200/60 dark:border-border/40">
                  <span className="text-xs font-semibold text-slate-800 dark:text-foreground">
                    {item.label}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-muted-foreground">
                    {item.detail}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-bold font-mono uppercase tracking-wider",
                      item.color
                    )}
                  >
                    [{item.status}]
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200/80 dark:border-border mt-auto">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-muted-foreground">
            <span>EXECUTION: 0.38ms</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              DRIFT: 0.00% • STATE: SEALED
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * IsolationVaultVisual
 * Visual representing high-security tenant isolation with sleek cryptographic enclave aesthetic.
 */
export function IsolationVaultVisual() {
  return (
    <div className="relative h-68 overflow-hidden rounded-3xl border border-slate-800 dark:border-primary/30 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white p-8 flex items-center justify-center shadow-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(13,148,136,0.15)_0%,transparent_70%)]" />
      <div className="absolute inset-0 bg-grid-white/[0.03]" />

      <div className="relative group">
        <div className="h-24 w-24 rounded-2xl bg-teal-950/80 border border-teal-500/50 shadow-[0_0_50px_rgba(20,184,166,0.3)] flex items-center justify-center transition-transform hover:scale-105 duration-500">
          <Server className="h-10 w-10 text-teal-400" />
        </div>
        {/* Orbiting Security Enclave Elements */}
        <div className="absolute -inset-4 border border-teal-500/20 rounded-full animate-spin-slow" />
        <div
          className="absolute -inset-8 border border-teal-500/10 rounded-full animate-spin-slow"
          style={{ animationDirection: "reverse" }}
        />
      </div>

      <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-[11px] font-mono text-teal-300/80">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-teal-400 animate-ping" />
          TENANT_ID: PRD_001
        </span>
        <span className="flex items-center gap-1 text-emerald-400 font-semibold">
          <Lock className="h-3.5 w-3.5" /> AES-256 RLS ENFORCED
        </span>
      </div>
    </div>
  );
}

/**
 * ExceptionTriageVisual
 * Visual representing the triage and adjudication flow of exceptions with interactive resolve button.
 */
export function ExceptionTriageVisual() {
  const [resolved, setResolved] = useState(false);

  return (
    <div className="relative w-full rounded-2xl border border-slate-200/80 dark:border-border bg-white dark:bg-card p-6 shadow-sm overflow-hidden transition-all">
      <div className="absolute top-0 right-0 p-4">
        <TrendingUp className="h-5 w-5 text-emerald-500 opacity-60" />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center border border-amber-500/20">
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-foreground">
              Deterministic Exception Adjudication
            </h4>
          </div>

          <Badge
            variant="outline"
            className={cn(
              "text-[10px] font-mono transition-colors",
              resolved
                ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30"
                : "border-amber-500/30 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30"
            )}
          >
            {resolved ? "ALL CLEARED" : "2 PENDING AUDIT"}
          </Badge>
        </div>

        {/* Exception Items */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between rounded-xl border border-slate-200/70 dark:border-border/60 bg-slate-50/70 dark:bg-muted/20 p-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-900 dark:text-foreground">
                  EX-9041
                </span>
                <span className="text-slate-500 dark:text-muted-foreground">
                  Stripe fee variance ($0.02)
                </span>
              </div>
              <p className="text-[10px] text-teal-600 dark:text-teal-400 font-mono">
                Policy &ldquo;Stripe Standard Fee (2.9% + $0.30)&rdquo; applies
              </p>
            </div>
            <span
              className={cn(
                "rounded-lg px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider",
                resolved
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
              )}
            >
              {resolved ? "RESOLVED" : "REVIEW"}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200/70 dark:border-border/60 bg-slate-50/70 dark:bg-muted/20 p-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-900 dark:text-foreground">
                  EX-9042
                </span>
                <span className="text-slate-500 dark:text-muted-foreground">
                  EUR/USD FX Rate (14:00 ECB)
                </span>
              </div>
              <p className="text-[10px] text-teal-600 dark:text-teal-400 font-mono">
                ECB benchmark rate matched within 0.001%
              </p>
            </div>
            <span
              className={cn(
                "rounded-lg px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider",
                resolved
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
              )}
            >
              {resolved ? "RESOLVED" : "REVIEW"}
            </span>
          </div>
        </div>

        {/* Progress & Interactive Action */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-slate-600 dark:text-muted-foreground">
              {resolved ? "100% Adjudicated" : "67% Adjudicated"}
            </span>
            <button
              type="button"
              onClick={() => setResolved((prev) => !prev)}
              className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 cursor-pointer underline underline-offset-2"
            >
              {resolved ? "Reset Test" : "Auto-Resolve via Policy"}
            </button>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200/80 dark:bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-500 bg-gradient-to-r from-teal-500 to-emerald-500",
                resolved ? "w-full" : "w-2/3"
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
