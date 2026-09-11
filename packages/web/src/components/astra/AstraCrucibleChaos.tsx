"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/CopyButton";
import { Flame, AlertOctagon, ShieldAlert, RefreshCw, Terminal, Lock } from "lucide-react";

interface ChaosScenario {
  id: string;
  title: string;
  processor: "Stripe" | "PayPal" | "Chase" | "Visa";
  leakageImpact: string;
  description: string;
  technicalAnomaly: string;
  logs: string[];
  resolvedArtifact: {
    status: string;
    actionTaken: string;
    recoveredCents: number;
    proofpackHash: string;
  };
}

const CHAOS_SCENARIOS: ChaosScenario[] = [
  {
    id: "stripe-float-drift",
    title: "Stripe Payout Float Lag (T+3 Drift)",
    processor: "Stripe",
    leakageImpact: "$384,000 Working Capital Float Delayed",
    description:
      "Stripe batch payout reports settled at clearing bank on Tuesday, but actual FedACH clearing settles Friday afternoon.",
    technicalAnomaly:
      "Bank balance ledger mismatch: expected deposit 0x98f... not verified in settlement stream for 72 hours.",
    logs: [
      "[00:00.012] Ingested Stripe payout webhook: po_1OqKl9F2eZvKYlo291 (amount: $384,000.00 USD)",
      "[00:00.045] Querying depository bank clearing account via BAI2 feed...",
      "[00:00.120] INVARIANT ALERT: Expected clearing deposit missing (Drift: +72 hours)",
      "[00:00.180] Sidereal Correlator: Quarantining batch po_1OqKl9F2 into suspense account (Account: 1040-SUSPENSE)",
      "[00:00.240] TigerBeetle: Posting pending debit with automated auto-clear trigger on FedACH match",
      "[00:00.310] Sealed Proofpack: SHA-256 state root anchored with zero cash leakage",
    ],
    resolvedArtifact: {
      status: "AUTOMATICALLY_QUARANTINED",
      actionTaken: "Suspense allocation & auto-reconciliation on clearing match",
      recoveredCents: 38400000,
      proofpackHash: "0x892a0192847291a091823abce128371289371298371238472918294719283712",
    },
  },
  {
    id: "paypal-fx-spread",
    title: "PayPal Undisclosed FX Tier Spread",
    processor: "PayPal",
    leakageImpact: "$4,120/mo Uncontracted Margin Leakage",
    description:
      "Multi-currency European checkout settled into USD with an unannounced 3.4% cross-border FX spread instead of contracted 2.95%.",
    technicalAnomaly:
      "Rate variance detected: Contract schedule rate = 1.082 USD/EUR, Actual applied rate = 1.045 USD/EUR (Spread: +45 bps).",
    logs: [
      "[00:00.018] Ingested PayPal Capture: CAP-88291410A (EUR €42,000.00)",
      "[00:00.039] Comparing effective rate against Merchant Agreement Tier [SCHEDULE_EU_ENTERPRISE_2026]",
      "[00:00.082] DISCREPANCY DETECTED: 45 bps surcharge beyond contracted ceiling",
      "[00:00.145] Sidereal Dispute Engine: Auto-generating clawback memorandum and evidence payload",
      "[00:00.210] Synthesizing Visa/Mastercard Interchange Schedule reference report...",
      "[00:00.290] Generated signed institutional dispute brief: DISPUTE_PAYPAL_FX_88291410A.pdf",
    ],
    resolvedArtifact: {
      status: "CLAWBACK_DOSSIER_SYNTHESIZED",
      actionTaken: "Evidence brief submitted to processor account management",
      recoveredCents: 412000,
      proofpackHash: "0x111222333444555666777888999000aaabbbcccdddeeefff1112223334445556",
    },
  },
  {
    id: "l3-interchange-downgrade",
    title: "Missing Level 3 Data Interchange Downgrade",
    processor: "Visa",
    leakageImpact: "$18,400 Lost in Surcharge Downgrades",
    description:
      "Enterprise commercial purchase cards missing line-item tax and commodity codes, silently downgraded by network from Level 3 (1.80%) to Standard (2.95%).",
    technicalAnomaly:
      "Interchange tier downgrade: qualified for Commercial L3, assigned EIRF/STANDARD (+115 bps).",
    logs: [
      "[00:00.015] Ingested raw clearing settlement record: ARN 7458291049281928471928",
      "[00:00.041] Correlating against ERP Order Invoice #INV-89104 in NetSuite...",
      "[00:00.095] DETECTED: Missing Line-Item Commodity Code & Customer Tax ID in payment payload",
      "[00:00.160] Calculating fee leakage: 115 bps downgrade penalty across $1,600,000.00 volume",
      "[00:00.220] Sidereal Rule Synthesizer: Synthesized automatic L3 payload enrichment middleware",
      "[00:00.280] Deployed zero-code middleware hook to Stripe PaymentIntent creation pipeline",
    ],
    resolvedArtifact: {
      status: "INTERCHANGE_RULE_DEPLOYED",
      actionTaken: "Real-time L3 data enrichment rule applied to checkout pipeline",
      recoveredCents: 1840000,
      proofpackHash: "0x777888999000111222333444555666777888999000aaabbbcccdddeeefff1112",
    },
  },
  {
    id: "race-condition-replay",
    title: "Replay Race Condition (409 Idempotency Lock)",
    processor: "Chase",
    leakageImpact: "Potential $149,000 Double-Posting Glitch",
    description:
      "Duplicate webhook delivery from clearing partner dispatched twice in 28ms during AWS network reconnect.",
    technicalAnomaly:
      "Concurrent execution attempt detected on identical transaction digest: 0x6e29... within race window.",
    logs: [
      "[00:00.008] Worker Node A: Ingested deposit event TX-9920194 ($149,000.00 USD)",
      "[00:00.014] Worker Node B: Ingested duplicate deposit event TX-9920194 ($149,000.00 USD)",
      "[00:00.022] Sidereal Nonce Cache: SHA-256 payload digest collision detected: 0x6e29a... (Delta: 6ms)",
      "[00:00.038] INVARIANT ASSERTION: Enforcing atomicity lock; Worker B rejected with HTTP 409",
      "[00:00.052] TigerBeetle: Idempotent commit confirmed; account ledger balance unchanged",
      "[00:00.070] Security telemetry emitted: Duplicate replay neutralised with zero ledger corruption",
    ],
    resolvedArtifact: {
      status: "ATOMIC_COLLISION_LOCKED",
      actionTaken: "Duplicate isolated; single idempotent journal posted",
      recoveredCents: 14900000,
      proofpackHash: "0x4445556667778889990001112223334445556667778889990001112223334445",
    },
  },
];

export function AstraCrucibleChaos() {
  const [selectedScenario, setSelectedScenario] = useState<ChaosScenario>(CHAOS_SCENARIOS[0]!);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [activeLogIndex, setActiveLogIndex] = useState<number>(selectedScenario.logs.length);

  const handleRunChaos = (scenario: ChaosScenario) => {
    setSelectedScenario(scenario);
    setIsSimulating(true);
    setActiveLogIndex(0);

    let currentLog = 0;
    const interval = setInterval(() => {
      if (currentLog < scenario.logs.length) {
        setActiveLogIndex(currentLog + 1);
        currentLog++;
      } else {
        clearInterval(interval);
        setIsSimulating(false);
      }
    }, 280);
  };

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl overflow-hidden font-sans">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-600 via-rose-600 to-red-600 text-white shadow-md">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight text-white">
                Sidereal Crucible Chaos Lab
              </h2>
              <Badge
                variant="outline"
                className="border-rose-500/40 text-rose-400 text-xs px-2 py-0.5"
              >
                Anomaly &amp; Invariant Defense Simulator
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              Test Settler&apos;s cryptographic resilience against real-world multi-rail financial
              anomalies
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-400 border border-rose-500/20">
            <AlertOctagon className="h-3.5 w-3.5" />
            Chaos Injection Engine Active
          </span>
        </div>
      </div>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-6 border-b border-slate-800 bg-slate-900/30">
        {CHAOS_SCENARIOS.map((scenario) => {
          const isSelected = selectedScenario.id === scenario.id;

          return (
            <button
              key={scenario.id}
              onClick={() => handleRunChaos(scenario)}
              disabled={isSimulating}
              className={`rounded-xl border p-4 text-left transition-all duration-200 ${
                isSelected
                  ? "border-rose-500 bg-rose-950/20 shadow-lg shadow-rose-950/40 scale-[1.01]"
                  : "border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/80"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Badge
                  variant="outline"
                  className={`text-[10px] font-bold ${
                    scenario.processor === "Stripe"
                      ? "border-indigo-500/40 text-indigo-300"
                      : scenario.processor === "PayPal"
                        ? "border-cyan-500/40 text-cyan-300"
                        : "border-amber-500/40 text-amber-300"
                  }`}
                >
                  {scenario.processor} Rail
                </Badge>
                <span className="text-[10px] font-mono text-rose-400 font-bold">Chaos Test</span>
              </div>

              <h4 className="text-xs font-bold text-white mb-1.5 line-clamp-1">{scenario.title}</h4>
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-3">
                {scenario.description}
              </p>

              <div className="border-t border-slate-800 pt-2 text-[11px] font-semibold text-rose-300 flex items-center justify-between">
                <span>Impact:</span>
                <span className="font-mono text-[10px]">{scenario.leakageImpact}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Crucible Execution Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
        {/* Live Execution Logs */}
        <div className="lg:col-span-7 border-b lg:border-b-0 lg:border-r border-slate-800 p-6 flex flex-col justify-between bg-slate-950">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-rose-400" />
                <span className="text-xs font-mono font-bold text-slate-300">
                  CRUCIBLE_TELEMETRY_LOG // {selectedScenario.id.toUpperCase()}
                </span>
              </div>
              <Button
                onClick={() => handleRunChaos(selectedScenario)}
                disabled={isSimulating}
                size="sm"
                variant="outline"
                className="border-rose-500/30 text-rose-300 hover:bg-rose-500/10 text-xs font-semibold"
              >
                <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isSimulating ? "animate-spin" : ""}`} />
                Re-inject Chaos
              </Button>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 font-mono text-xs space-y-2 h-[320px] overflow-y-auto shadow-inner">
              {selectedScenario.logs.slice(0, activeLogIndex).map((log, index) => {
                const isAlert =
                  log.includes("ALERT") || log.includes("DISCREPANCY") || log.includes("DETECTED");
                const isSuccess =
                  log.includes("Proofpack") ||
                  log.includes("Sealed") ||
                  log.includes("Deployed") ||
                  log.includes("confirmed");

                return (
                  <div
                    key={index}
                    className={`leading-relaxed transition-all duration-150 ${
                      isAlert
                        ? "text-rose-400 font-semibold bg-rose-500/10 p-1.5 rounded border border-rose-500/20"
                        : isSuccess
                          ? "text-emerald-400 font-semibold"
                          : "text-slate-300"
                    }`}
                  >
                    {log}
                  </div>
                );
              })}
              {isSimulating && activeLogIndex < selectedScenario.logs.length && (
                <div className="text-cyan-400 animate-pulse text-xs">
                  Executing kernel invariant checks...
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Kernel Invariant Assertion: Pass</span>
            <span className="text-emerald-400 font-mono">0 Unquarantined Breaches</span>
          </div>
        </div>

        {/* Right Column: Resolution Artifact & Evidence */}
        <div className="lg:col-span-5 p-6 flex flex-col justify-between bg-slate-900/40">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Automated Resolution Payload
                </span>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                {selectedScenario.resolvedArtifact.status}
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">
                  Autonomous Action
                </div>
                <div className="text-xs font-bold text-white leading-snug">
                  {selectedScenario.resolvedArtifact.actionTaken}
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">
                  Capital Preserved / Recovered
                </div>
                <div className="text-xl font-mono font-extrabold text-emerald-400">
                  $
                  {(selectedScenario.resolvedArtifact.recoveredCents / 100).toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  100% verified via double-entry journal balance
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 font-mono text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    Cryptographic Proofpack Anchor
                  </span>
                  <CopyButton text={selectedScenario.resolvedArtifact.proofpackHash} size="sm" />
                </div>
                <div className="text-[11px] text-cyan-300 truncate">
                  {selectedScenario.resolvedArtifact.proofpackHash}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-indigo-400" />
              <span>Zero Float Loss Guarantee</span>
            </span>
            <span className="text-emerald-400 font-bold">Audit Defense Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}
