"use client";

import React, { useState } from "react";
import { Download, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Pillar {
  id: string;
  number: string;
  title: string;
  category: string;
  subtitle: string;
  impactMetrics: string;
  detail: string;
}

const PILLARS: Pillar[] = [
  {
    id: "neutrality",
    number: "01",
    category: "STRATEGIC PLATFORM MOAT",
    title: "The Sovereign Neutrality Enclave",
    subtitle: "Cross-Rail Invariant Between Stripe, PayPal & Adyen",
    impactMetrics: "100% Cross-Rail Visibility",
    detail:
      "Enterprise merchants route volume across multiple processors. Neither processor can audit the other's fees, reserves, or batch deposits. By acquiring Settler, a payment leader captures the neutral source-of-truth across the entire merchant payment stack.",
  },
  {
    id: "cash_velocity",
    number: "02",
    category: "CFO WORKING CAPITAL",
    title: "Zero-Float Drag Cash Velocity",
    subtitle: "T+0 Continuous Close Replacing T+30 Spreadsheet Delays",
    impactMetrics: "2.4 Days Float Unlocked",
    detail:
      "Batch payout settlement latencies lock up millions in operating float. Settler automatically decomposes 1-to-N batch deposits against bank clearing accounts in real time, accelerating working capital velocity by days.",
  },
  {
    id: "dispute_arbitrage",
    number: "03",
    category: "REVENUE RECOVERY",
    title: "Cross-Rail Dispute Double-Clawback Defense",
    subtitle: "Automated Multi-Processor Chargeback & Refund Adjudication",
    impactMetrics: "$140K+ Annual Recapture",
    detail:
      "Consumers frequently file refunds through PayPal while initiating card chargebacks on Stripe. Without a bilateral reconciliation engine, merchants get dinged twice. Settler detects and halts cross-rail duplicate clawbacks automatically.",
  },
  {
    id: "audit_certainty",
    number: "04",
    category: "COMPLIANCE & GOVERNANCE",
    title: "SOX-404 Cryptographic Merkle Guarantee",
    subtitle: "Full Run Replay with RFC 6962 SHA-256 Proofpacks",
    impactMetrics: "100% Unqualified Audit Ready",
    detail:
      "Eliminates statistical sampling. Every single transaction, fee breakdown, and FX conversion is sealed in a Merkle tree proof bundle that Big-4 auditors can independently verify in seconds using browser WASM.",
  },
];

export function InstitutionalValueProposition() {
  const [selectedPillar, setSelectedPillar] = useState<Pillar>(PILLARS[0]!);
  const [downloadedMemo, setDownloadedMemo] = useState(false);

  const handleDownloadMemo = () => {
    const memoData = {
      title: "Settler Institutional Acquisition & Architecture Memorandum",
      classification: "CONFIDENTIAL // STRATEGIC VALUE PROPOSITION",
      date: new Date().toISOString(),
      targetProfile:
        "Global Payment Networks & Enterprise Infrastructure Acquirers (Stripe / PayPal / Adyen)",
      strategicPillars: PILLARS.map((p) => ({
        pillarNumber: p.number,
        title: p.title,
        subtitle: p.subtitle,
        impactMetrics: p.impactMetrics,
        summary: p.detail,
      })),
      financialThesis: {
        merchantLtvExpansion:
          "14x lower churn among merchants running deterministic settlement audits",
        directRevenueRecovery: "12–28 bps recaptured per dollar of gross payment volume",
        complianceOpExReduction: "75% reduction in manual accounting FTE month-end close overhead",
      },
      cryptographicStandard: "RFC 6962 SHA-256 Merkle Evidence Enclave",
    };

    const blob = new Blob([JSON.stringify(memoData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Settler-Strategic-Acquisition-Memorandum.json";
    a.click();
    URL.revokeObjectURL(url);
    setDownloadedMemo(true);
    setTimeout(() => setDownloadedMemo(false), 3000);
  };

  return (
    <div className="relative w-full rounded-3xl border border-slate-200/90 dark:border-white/10 bg-gradient-to-b from-white via-slate-50/50 to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 p-6 sm:p-8 md:p-10 backdrop-blur-xl shadow-2xl overflow-hidden">
      {/* Dynamic Background Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-200/80 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge
              variant="outline"
              className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 text-xs font-mono font-semibold"
            >
              EXECUTIVE VALUE PROPOSITION
            </Badge>
            <Badge
              variant="outline"
              className="bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30 text-xs font-mono"
            >
              M&amp;A STRATEGIC DOSSIER
            </Badge>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            The Institutional Strategic Value Proposition
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            A comprehensive, shareable briefing on why the neutral settlement enclave compounds
            enterprise valuation, unravels processor fee friction, and establishes the foundational
            audit operating system.
          </p>
        </div>

        <Button
          onClick={handleDownloadMemo}
          className="bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-700 hover:to-teal-700 text-white font-semibold shadow-md shadow-indigo-600/20 text-xs flex items-center gap-2 shrink-0"
        >
          {downloadedMemo ? <CheckCircle2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
          <span>{downloadedMemo ? "Memorandum Downloaded" : "Export Strategic Memo JSON"}</span>
        </Button>
      </div>

      {/* 4 Pillars Interactive Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-8">
        {PILLARS.map((pillar) => {
          const isSelected = selectedPillar.id === pillar.id;
          return (
            <button
              key={pillar.id}
              type="button"
              onClick={() => setSelectedPillar(pillar)}
              className={cn(
                "p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer space-y-2",
                isSelected
                  ? "border-teal-500 bg-teal-50/70 dark:bg-teal-950/40 shadow-sm ring-2 ring-teal-500/20 font-semibold"
                  : "border-slate-200 dark:border-white/5 bg-white dark:bg-slate-800/60 hover:border-slate-300"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-teal-600 dark:text-teal-400 font-bold">
                  {pillar.number}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{pillar.impactMetrics}</span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                {pillar.title}
              </h4>
              <p className="text-[10px] text-slate-500 font-medium line-clamp-2">
                {pillar.subtitle}
              </p>
            </button>
          );
        })}
      </div>

      {/* Deep-Dive Pillar Details Showcase */}
      <div className="mt-6 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-slate-800/40 p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
              {selectedPillar.category}
            </span>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
              {selectedPillar.title}
            </h3>
            <p className="text-xs font-mono text-slate-500 mt-0.5">{selectedPillar.subtitle}</p>
          </div>
          <Badge className="bg-emerald-500 text-white font-mono text-xs px-3 py-1 self-start sm:self-auto">
            {selectedPillar.impactMetrics}
          </Badge>
        </div>

        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed max-w-4xl">
          {selectedPillar.detail}
        </p>

        {/* Velocity Comparison Table */}
        <div className="pt-4 mt-4 border-t border-slate-200/80 dark:border-white/10">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Cadence &amp; Operating Comparison:
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-950/10 space-y-2 text-xs">
              <span className="font-bold text-amber-700 dark:text-amber-400 font-mono">
                Status Quo (Manual Spreadsheet Matching)
              </span>
              <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                <li>
                  • <strong>35 Days</strong> average latency to close books
                </li>
                <li>
                  • <strong>1.8%</strong> undetected processor fee rate creep
                </li>
                <li>
                  • <strong>$142,000/yr</strong> spent on manual accountant matching time
                </li>
                <li>• High audit friction &amp; statistical sampling risk</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-950/10 space-y-2 text-xs">
              <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                Settler Sovereign Operating Cadence
              </span>
              <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                <li>
                  • <strong>T+0 Continuous Close</strong> with intraday batch sweep
                </li>
                <li>
                  • <strong>0.00% Variance</strong> with sub-cent fee schedule audit
                </li>
                <li>
                  • <strong>100% Automated</strong> exception triage and proof sealing
                </li>
                <li>• RFC 6962 SHA-256 Merkle proofs for Big-4 auditors</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
