"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Fingerprint,
  Scale,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FrontierFeatureId = "time-travel" | "audit-dossier" | "ledger-parity";

interface FrontierFeature {
  id: FrontierFeatureId;
  eyebrow: string;
  title: string;
  description: string;
  outcome: string;
  href: string;
  icon: LucideIcon;
}

const FRONTIER_FEATURES: FrontierFeature[] = [
  {
    id: "time-travel",
    eyebrow: "Forensic replay",
    title: "Rewind to the moment the numbers diverged",
    description:
      "Move through historical state transitions and isolate the transfer, balance change, and proof root behind a discrepancy.",
    outcome:
      "Move from variance to exact state change without reconstructing the incident by hand.",
    href: "/console/time-travel",
    icon: Clock3,
  },
  {
    id: "audit-dossier",
    eyebrow: "Portable evidence",
    title: "Package the proof, not another spreadsheet",
    description:
      "Collect run provenance, transaction evidence, and verification material in one exportable audit dossier.",
    outcome:
      "Give operators and reviewers the same evidence package with an offline verification path.",
    href: "/console/audit-dossier",
    icon: FileCheck2,
  },
  {
    id: "ledger-parity",
    eyebrow: "Continuous controls",
    title: "See ledger drift before close",
    description:
      "Compare double-entry and relational ledger state continuously, with explicit invariant status and pending commitments.",
    outcome: "Turn parity checks into an operating control instead of a month-end investigation.",
    href: "/console/ledger-parity",
    icon: Scale,
  },
];

function TimeTravelPreview() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-slate-400">Historical state</p>
          <p className="mt-1 font-mono text-sm text-white">run_7f31 · epoch 04</p>
        </div>
        <Badge className="border-cyan-400/30 bg-cyan-400/10 text-cyan-200" variant="outline">
          Replay paused
        </Badge>
      </div>

      <div className="relative py-3">
        <div className="absolute left-3 right-3 top-6 h-px bg-slate-700" />
        <div className="relative grid grid-cols-5 gap-2">
          {["Ingest", "Match", "Post", "Settle", "Verify"].map((label, index) => (
            <div key={label} className="flex flex-col items-center gap-3 text-center">
              <span
                className={cn(
                  "relative z-10 h-6 w-6 rounded-full border-4 border-slate-950",
                  index < 3 ? "bg-emerald-400" : index === 3 ? "bg-amber-400" : "bg-slate-700"
                )}
              />
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            State transition
          </p>
          <p className="mt-2 font-mono text-xs text-slate-200">transfer_01842</p>
          <p className="mt-1 text-sm text-amber-200">Fee clearing · −$14.80</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Proof root
          </p>
          <p className="mt-2 font-mono text-xs text-cyan-200">0x7f31…a902</p>
          <p className="mt-1 text-sm text-slate-300">Previous root preserved</p>
        </div>
      </div>
    </div>
  );
}

function AuditDossierPreview() {
  const artifacts = [
    ["run-manifest.json", "Provenance sealed"],
    ["exceptions.json", "Decisions included"],
    ["verify.wasm", "Offline check ready"],
  ] as const;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-slate-400">Audit dossier</p>
          <p className="mt-1 font-mono text-sm text-white">close_2026_09</p>
        </div>
        <Fingerprint className="h-5 w-5 text-emerald-300" aria-hidden="true" />
      </div>

      <div className="space-y-2">
        {artifacts.map(([name, status]) => (
          <div
            key={name}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <FileCheck2 className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
              <span className="truncate font-mono text-xs text-slate-200">{name}</span>
            </div>
            <span className="text-right text-[11px] text-slate-400">{status}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] p-4">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-emerald-100">Package integrity verified</p>
          <p className="mt-0.5 text-xs text-emerald-100/60">Sample manifest and artifacts agree.</p>
        </div>
      </div>
    </div>
  );
}

function LedgerParityPreview() {
  const checks = [
    ["Posted debits = credits", "Passing"],
    ["Clearing volume parity", "Passing"],
    ["Pending commitments", "2 observed"],
  ] as const;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-slate-400">Dual-ledger control</p>
          <p className="mt-1 font-mono text-sm text-white">operating_cash · clearing</p>
        </div>
        <Badge
          className="border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
          variant="outline"
        >
          Invariants healthy
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          ["Transaction ledger", "$48,620.40"],
          ["Relational ledger", "$48,620.40"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              {label}
            </p>
            <p className="mt-2 font-mono text-base font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {checks.map(([label, status], index) => (
          <div key={label} className="flex items-center justify-between py-2 text-sm">
            <span className="text-slate-300">{label}</span>
            <span className={index === 2 ? "text-amber-200" : "text-emerald-300"}>{status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeaturePreview({ featureId }: { featureId: FrontierFeatureId }) {
  if (featureId === "audit-dossier") return <AuditDossierPreview />;
  if (featureId === "ledger-parity") return <LedgerParityPreview />;
  return <TimeTravelPreview />;
}

export function FrontierFeatureShowcase() {
  const [activeId, setActiveId] = useState<FrontierFeatureId>("time-travel");
  const activeFeature =
    FRONTIER_FEATURES.find((feature) => feature.id === activeId) ?? FRONTIER_FEATURES[0]!;

  return (
    <div id="frontier-release" className="scroll-mt-24">
      <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div className="max-w-3xl">
          <div className="mb-5 flex items-center gap-3">
            <Badge className="border-primary/30 bg-primary/10 text-primary" variant="outline">
              New in Settler 1.6
            </Badge>
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Autonomous frontier
            </span>
          </div>
          <h2 className="text-fluid-2xl font-semibold tracking-tight text-foreground md:text-fluid-3xl">
            Investigate financial state, not screenshots
          </h2>
          <p className="mt-4 max-w-2xl text-fluid-sm leading-relaxed text-muted-foreground sm:text-fluid-base">
            The newest operator workbenches connect replay, evidence, and ledger controls into one
            inspection path—from the first variance to the proof package.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/changelog/2026-10-18-settler-autonomous-frontier">
            Read the release notes <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-2xl shadow-primary/[0.06]">
        <div className="grid lg:grid-cols-[0.88fr_1.12fr]">
          <div className="border-b border-border/70 p-5 sm:p-7 lg:border-b-0 lg:border-r">
            <div className="space-y-3" role="tablist" aria-label="New Settler capabilities">
              {FRONTIER_FEATURES.map((feature) => {
                const Icon = feature.icon;
                const isActive = feature.id === activeId;

                return (
                  <button
                    key={feature.id}
                    id={`frontier-tab-${feature.id}`}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls="frontier-panel"
                    onClick={() => setActiveId(feature.id)}
                    className={cn(
                      "w-full rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                      isActive
                        ? "border-primary/35 bg-primary/[0.07]"
                        : "border-transparent hover:border-border hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        )}
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          {feature.eyebrow}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-foreground sm:text-base">
                          {feature.title}
                        </p>
                        {isActive ? (
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            {feature.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-950 p-5 text-white sm:p-7 lg:p-9">
            <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
              </div>
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                <Bot className="h-3.5 w-3.5" aria-hidden="true" />
                Illustrative operator view
              </div>
            </div>

            <div
              id="frontier-panel"
              role="tabpanel"
              aria-labelledby={`frontier-tab-${activeFeature.id}`}
              className="min-h-[320px]"
            >
              <FeaturePreview featureId={activeFeature.id} />
            </div>

            <div className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-md text-xs leading-relaxed text-slate-400">
                {activeFeature.outcome}
              </p>
              <Link
                href={activeFeature.href}
                className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-cyan-200 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                Open workbench <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
