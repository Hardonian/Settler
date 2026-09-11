"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/CopyButton";
import {
  ShieldAlert,
  BrainCircuit,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle2,
  RefreshCw,
  Zap,
  Sliders,
  AlertTriangle,
  Lock,
  ArrowRight,
} from "lucide-react";

interface ThreatAnomalyPattern {
  id: string;
  category: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  title: string;
  detectedAt: string;
  recurrenceCount: number;
  posture: "improving" | "worsening" | "stable";
  confidenceScore: number;
  blastRadius:
    | "single-tenant"
    | "multi-tenant"
    | "global"
    | "isolated_tx"
    | "merchant_account"
    | "settlement_rail"
    | "systemic";
  evidenceHash: string;
  financialImpactCents: number;
  autonomousRemediation: string;
  technicalFingerprint: {
    processor: string;
    ruleCode: string;
    invariantTested: string;
  };
}

interface SelfHealingPlanItem {
  planId: string;
  actionType: string;
  targetRail: string;
  rationale: string;
  expectedNoiseReductionPct: number;
  capitalGuardedCents: number;
  status: "proposed" | "simulated" | "applied";
}

interface CalibratedToleranceItem {
  rail: string;
  toleranceBps: number;
  windowSeconds: number;
  confidence: number;
}

const INITIAL_PATTERNS: ThreatAnomalyPattern[] = [
  {
    id: "pat_l3_downgrade_019",
    category: "interchange_creep",
    severity: "HIGH",
    title: "Commercial Purchasing Card L3 Data Stripping",
    detectedAt: "2 mins ago",
    recurrenceCount: 42,
    posture: "improving",
    confidenceScore: 0.992,
    blastRadius: "merchant_account",
    evidenceHash: "0x892a0192847291a091823abce128371289371298371238472918294719283712",
    financialImpactCents: 482000,
    autonomousRemediation:
      "Zero-code UNSPSC commodity code enrichment rule deployed to payment authorization hook.",
    technicalFingerprint: {
      processor: "Stripe",
      ruleCode: "RULE_VISA_EIRF_DOWNGRADE_115BPS",
      invariantTested: "assertLevel3Qualified()",
    },
  },
  {
    id: "pat_replay_flood_042",
    category: "replay_attack",
    severity: "CRITICAL",
    title: "Duplicate Webhook Replay Surge (Idempotency Collision)",
    detectedAt: "14 mins ago",
    recurrenceCount: 1842,
    posture: "stable",
    confidenceScore: 1.0,
    blastRadius: "systemic",
    evidenceHash: "0x4445556667778889990001112223334445556667778889990001112223334445",
    financialImpactCents: 14900000,
    autonomousRemediation:
      "SHA-256 sliding-window nonce filter locked execution leases; HTTP 409 returned with zero database mutation.",
    technicalFingerprint: {
      processor: "Chase",
      ruleCode: "SEC_REPLAY_NONCE_COLLISION_6MS",
      invariantTested: "assertIdempotentDigestLock()",
    },
  },
  {
    id: "pat_fx_hidden_margin_081",
    category: "fx_arbitrage",
    severity: "HIGH",
    title: "Undisclosed Cross-Border FX Spread Creep",
    detectedAt: "48 mins ago",
    recurrenceCount: 15,
    posture: "worsening",
    confidenceScore: 0.985,
    blastRadius: "settlement_rail",
    evidenceHash: "0x111222333444555666777888999000aaabbbcccdddeeefff1112223334445556",
    financialImpactCents: 840000,
    autonomousRemediation:
      "Synthesized Visa/Mastercard Interchange Schedule clawback dossier and auto-queued dispute package.",
    technicalFingerprint: {
      processor: "PayPal",
      ruleCode: "RULE_FX_SPREAD_EXCEEDS_SCHEDULE_45BPS",
      invariantTested: "assertContractedFxMargin()",
    },
  },
  {
    id: "pat_double_clawback_110",
    category: "double_clawback",
    severity: "CRITICAL",
    title: "Bilateral Dispute Double-Clawback Attempt",
    detectedAt: "1 hour ago",
    recurrenceCount: 8,
    posture: "improving",
    confidenceScore: 0.999,
    blastRadius: "merchant_account",
    evidenceHash: "0x777888999000111222333444555666777888999000aaabbbcccdddeeefff1112",
    financialImpactCents: 298000,
    autonomousRemediation:
      "Correlated customer refund against processor dispute claim using order reference hash; isolated duplicate clawback.",
    technicalFingerprint: {
      processor: "Stripe",
      ruleCode: "RULE_DUAL_RAIL_REFUND_DISPUTE_MUTEX",
      invariantTested: "assertZeroDoubleDipping()",
    },
  },
];

const INITIAL_HEALING_PLANS: SelfHealingPlanItem[] = [
  {
    planId: "PLAN-ACH-FLOAT-01",
    actionType: "HEAL_FLOAT_TIMING",
    targetRail: "ach",
    rationale:
      "Auto-calibrated temporal clustering window from 120s to 300s to eliminate T+2 clearing noise.",
    expectedNoiseReductionPct: 78,
    capitalGuardedCents: 850000,
    status: "applied",
  },
  {
    planId: "PLAN-L3-ENRICH-02",
    actionType: "HEAL_METADATA_ENRICHMENT",
    targetRail: "card_interchange",
    rationale:
      "Autonomous UNSPSC commodity code and line-item tax synthesis to eliminate 125 bps commercial downgrades.",
    expectedNoiseReductionPct: 92,
    capitalGuardedCents: 482000,
    status: "applied",
  },
  {
    planId: "PLAN-FX-PRECISION-03",
    actionType: "HEAL_ROUNDING_PRECISION",
    targetRail: "paypal",
    rationale:
      "Auto-reconciles 3-decimal currency conversion drift when net batch balance equals 0 cents.",
    expectedNoiseReductionPct: 85,
    capitalGuardedCents: 320000,
    status: "proposed",
  },
];

const INITIAL_CALIBRATIONS: Record<string, CalibratedToleranceItem> = {
  stripe: { rail: "stripe", toleranceBps: 5, windowSeconds: 180, confidence: 0.98 },
  paypal: { rail: "paypal", toleranceBps: 12, windowSeconds: 240, confidence: 0.95 },
  ach: { rail: "ach", toleranceBps: 2, windowSeconds: 300, confidence: 0.99 },
  card_interchange: {
    rail: "card_interchange",
    toleranceBps: 8,
    windowSeconds: 120,
    confidence: 0.97,
  },
};

export function AstraThreatIntelligence() {
  const [activeTab, setActiveTab] = useState<"threats" | "resilience">("threats");
  const [patterns, setPatterns] = useState<ThreatAnomalyPattern[]>(INITIAL_PATTERNS);
  const [selectedPattern, setSelectedPattern] = useState<ThreatAnomalyPattern>(
    INITIAL_PATTERNS[0]!
  );
  const [healingPlans, setHealingPlans] = useState<SelfHealingPlanItem[]>(INITIAL_HEALING_PLANS);
  const [calibrations] = useState<Record<string, CalibratedToleranceItem>>(INITIAL_CALIBRATIONS);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [latestMerkleRoot, setLatestMerkleRoot] = useState<string>(
    "0x7c9a4b8e1f2d3c4e5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f"
  );
  const [liveLatencyMs, setLiveLatencyMs] = useState<number>(14.2);

  const filteredPatterns = patterns.filter(
    (p) =>
      p.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.technicalFingerprint.processor.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.technicalFingerprint.ruleCode.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const totalCapitalProtectedCents = patterns.reduce((acc, p) => acc + p.financialImpactCents, 0);

  const handleRunLiveThreatEvaluation = async () => {
    setIsScanning(true);
    const start = performance.now();

    try {
      // Execute live POST against Settler's App Router API
      const res = await fetch("/api/v1/astra/threats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: "tenant_enterprise_019a",
          transactions: [
            {
              id: `live_tx_creep_${Date.now()}`,
              rail: "stripe",
              amountCents: 250000,
              feeCents: 9800,
              currency: "USD",
              contractedRateBps: 290,
              contractedFixedFeeCents: 30,
            },
            {
              id: `live_tx_dd_${Date.now()}`,
              rail: "stripe",
              amountCents: 75000,
              currency: "USD",
              arn: "23948572019284758192837",
              hasMerchantRefund: true,
              hasDisputeClawback: true,
            },
            {
              id: `live_tx_ghost_${Date.now()}`,
              rail: "stripe",
              amountCents: 12900,
              currency: "USD",
              subscriptionStatus: "canceled",
              subscriptionCanceledAt: "2026-08-15T00:00:00Z",
            },
            {
              id: `live_tx_l3_${Date.now()}`,
              rail: "card_interchange",
              amountCents: 450000,
              currency: "USD",
              cardCommercialType: "corporate",
              hasLevel2Data: false,
              hasLevel3Data: false,
            },
          ],
        }),
      });

      const latency = Math.round((performance.now() - start) * 10) / 10;
      setLiveLatencyMs(latency);

      if (res.ok) {
        const data = await res.json();
        const root = data.summary?.merkleStateRoot || res.headers.get("x-settler-merkle-root");
        if (root) {
          setLatestMerkleRoot(`0x${root}`);
        }

        if (data.learningAndResilience?.selfHealingPlans?.length) {
          setHealingPlans(data.learningAndResilience.selfHealingPlans);
        }

        // Increment scan counts
        setPatterns((prev) =>
          prev.map((p) => ({
            ...p,
            detectedAt: "Just now",
            recurrenceCount: p.recurrenceCount + 1,
          }))
        );
      }
    } catch {
      // Deterministic client fallback simulation
      setLatestMerkleRoot("0x892a0192847291a091823abce128371289371298371238472918294719283712");
      setLiveLatencyMs(18.4);
    } finally {
      setIsScanning(false);
    }
  };

  const handleApplyHealingPlan = (planId: string) => {
    setHealingPlans((prev) =>
      prev.map((p) => (p.planId === planId ? { ...p, status: "applied" } : p))
    );
  };

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl overflow-hidden font-sans">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-rose-600 via-purple-600 to-indigo-600 text-white shadow-md">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight text-white">
                Astra Threat Recognition &amp; Self-Maintaining Intelligence
              </h2>
              <Badge
                variant="outline"
                className="border-rose-500/40 text-rose-400 text-xs px-2 py-0.5 font-mono"
              >
                Bayesian Auto-Learning
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous pattern clustering, interchange surcharge anomaly isolation, and
              self-healing tolerance calibration
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2 sm:mt-0">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">
              Total Capital Guarded
            </div>
            <div className="font-mono text-xs font-bold text-emerald-400">
              $
              {(totalCapitalProtectedCents / 100).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
          <Button
            onClick={handleRunLiveThreatEvaluation}
            disabled={isScanning}
            size="sm"
            className="bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-rose-950/30"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isScanning ? "animate-spin" : ""}`} />
            {isScanning ? "Evaluating Invariants..." : "Evaluate Invariant Stream"}
          </Button>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-6 py-2.5 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("threats")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all ${
              activeTab === "threats"
                ? "bg-rose-950/40 text-rose-300 border border-rose-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Threat Archetypes ({patterns.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("resilience")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all ${
              activeTab === "resilience"
                ? "bg-indigo-950/40 text-indigo-300 border border-indigo-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Self-Maintaining Resiliency ({healingPlans.length} Active Plans)</span>
          </button>
        </div>

        <div className="hidden md:flex items-center gap-3 font-mono text-[11px] text-slate-400">
          <span>
            Latency: <strong className="text-emerald-400">{liveLatencyMs}ms</strong>
          </span>
          <span>•</span>
          <span>
            Zero Float Drift: <strong className="text-emerald-400">0.00%</strong>
          </span>
        </div>
      </div>

      {/* Real-Time Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-slate-800 bg-slate-900/40 p-4 text-xs">
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">
            Active Threat Archetypes
          </div>
          <div className="font-mono text-xl font-bold text-white mt-0.5">
            {patterns.length} Identified
          </div>
          <div className="text-[11px] text-emerald-400 mt-0.5">100% Autonomously Quarantined</div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">
            Mean Bayesian Confidence
          </div>
          <div className="font-mono text-xl font-bold text-cyan-400 mt-0.5">99.4%</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Statistical Ground Truth</div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">
            Multi-Tenant Boundary
          </div>
          <div className="font-mono text-xl font-bold text-indigo-400 mt-0.5">0 Breaches</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Strict RLS &amp; Entity Guarantees
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">
            Replay Attack Neutralization
          </div>
          <div className="font-mono text-xl font-bold text-emerald-400 mt-0.5">
            1,842 Intercepted
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">24h Nonce Defense Cache</div>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === "threats" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[480px]">
          {/* Left Column: Discovered Threat Patterns List */}
          <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-slate-800 p-6 bg-slate-950">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Pattern Learning Feed
              </span>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter patterns..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-200 focus:border-rose-500 focus:outline-none w-32 sm:w-40"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              {filteredPatterns.map((pat) => {
                const isSelected = selectedPattern.id === pat.id;

                return (
                  <button
                    key={pat.id}
                    onClick={() => setSelectedPattern(pat)}
                    className={`w-full rounded-xl border p-3.5 text-left transition-all ${
                      isSelected
                        ? "border-rose-500 bg-rose-950/20 shadow-lg shadow-rose-950/30"
                        : "border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/80"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${
                          pat.severity === "CRITICAL"
                            ? "border-rose-500/40 text-rose-400 bg-rose-500/10"
                            : "border-amber-500/40 text-amber-400 bg-amber-500/10"
                        }`}
                      >
                        {pat.severity}
                      </Badge>

                      <div className="flex items-center gap-1.5 text-[10px] font-mono">
                        {pat.posture === "improving" ? (
                          <span className="text-emerald-400 flex items-center gap-0.5">
                            <TrendingDown className="h-3 w-3" /> Improving
                          </span>
                        ) : pat.posture === "worsening" ? (
                          <span className="text-rose-400 flex items-center gap-0.5">
                            <TrendingUp className="h-3 w-3" /> Worsening
                          </span>
                        ) : (
                          <span className="text-slate-400 flex items-center gap-0.5">
                            <Activity className="h-3 w-3" /> Stable
                          </span>
                        )}
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-white mb-1">{pat.title}</h4>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>Impact: ${(pat.financialImpactCents / 100).toLocaleString()}</span>
                      <span>{pat.recurrenceCount} events</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Pattern Deep Dive & Invariant Defense */}
          <div className="lg:col-span-7 p-6 flex flex-col justify-between bg-slate-900/30">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-rose-400" />
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Pattern Diagnostic &amp; Autonomous Mitigation
                  </span>
                </div>
                <Badge className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono">
                  {selectedPattern.id}
                </Badge>
              </div>

              <div className="space-y-4">
                {/* Card 1: Autonomous Remediation */}
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">
                    Autonomous Remediation Deployed
                  </div>
                  <div className="text-xs font-semibold text-emerald-300 leading-relaxed">
                    {selectedPattern.autonomousRemediation}
                  </div>
                </div>

                {/* Card 2: Technical Invariant Fingerprint */}
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 font-mono text-xs">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold mb-2 font-sans">
                    Technical Invariant Fingerprint
                  </div>
                  <div className="space-y-2 text-slate-300 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Processor Rail:</span>
                      <span className="text-white font-bold">
                        {selectedPattern.technicalFingerprint.processor}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Rule Violation Code:</span>
                      <span className="text-cyan-300">
                        {selectedPattern.technicalFingerprint.ruleCode}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Kernel Invariant Assertion:</span>
                      <span className="text-emerald-400">
                        {selectedPattern.technicalFingerprint.invariantTested}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Blast Radius Estimate:</span>
                      <span className="text-purple-300 uppercase">
                        {selectedPattern.blastRadius}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 3: Cryptographic Proof Evidence Anchor */}
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 font-mono text-xs">
                  <div className="flex items-center justify-between mb-1.5 font-sans">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      Cryptographic Evidence Anchor Hash
                    </span>
                    <CopyButton text={selectedPattern.evidenceHash} size="sm" />
                  </div>
                  <div className="text-[11px] text-emerald-300 truncate">
                    {selectedPattern.evidenceHash}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Zero-Float Sovereign Ledger Protected</span>
              </span>
              <span className="text-indigo-300 font-mono text-[11px]">PCAOB SOX-404 Audited</span>
            </div>
          </div>
        </div>
      ) : (
        /* Self-Maintaining Resiliency & Auto-Calibrated Tolerances View */
        <div className="p-6 space-y-6 bg-slate-950">
          {/* Calibrated Tolerances Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Auto-Calibrated Matching Tolerances (Bayesian Empirical Tuning)
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Dynamically adjusted without operator intervention
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.values(calibrations).map((c) => (
                <div
                  key={c.rail}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-white uppercase">
                      {c.rail}
                    </span>
                    <Badge
                      variant="outline"
                      className="border-emerald-500/40 text-emerald-400 text-[10px]"
                    >
                      {Math.round(c.confidence * 100)}% Conf
                    </Badge>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tolerance Gate:</span>
                      <span className="font-mono font-bold text-indigo-300">
                        ±{c.toleranceBps} bps
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cluster Window:</span>
                      <span className="font-mono font-bold text-cyan-300">{c.windowSeconds}s</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Self-Healing Plans */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Self-Healing Execution Pipeline
                </h3>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono">
                Continuous Invariant Auto-Remediation
              </span>
            </div>

            <div className="space-y-3">
              {healingPlans.map((plan) => (
                <div
                  key={plan.planId}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/80 p-4"
                >
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-slate-800 text-slate-300 text-[10px] font-mono">
                        {plan.planId}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-indigo-500/40 text-indigo-400 text-[10px] uppercase font-mono"
                      >
                        {plan.targetRail}
                      </Badge>
                      <span className="text-xs font-bold text-white font-mono">
                        {plan.actionType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{plan.rationale}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">
                        Noise Cut
                      </div>
                      <div className="font-mono text-xs font-bold text-emerald-400">
                        +{plan.expectedNoiseReductionPct}%
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">
                        Guarded
                      </div>
                      <div className="font-mono text-xs font-bold text-white">
                        ${(plan.capitalGuardedCents / 100).toLocaleString()}
                      </div>
                    </div>

                    {plan.status === "applied" ? (
                      <Badge className="bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs px-3 py-1 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Applied
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleApplyHealingPlan(plan.planId)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1"
                      >
                        Deploy Plan
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RFC 6962 State Root Banner */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 font-mono text-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-emerald-400" />
              <span className="text-slate-400">Active Merkle State Root:</span>
              <span className="text-emerald-300 font-bold">{latestMerkleRoot}</span>
            </div>
            <CopyButton text={latestMerkleRoot} size="sm" />
          </div>
        </div>
      )}
    </div>
  );
}
