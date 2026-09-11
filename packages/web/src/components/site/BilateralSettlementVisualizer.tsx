"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  ShieldCheck,
  Zap,
  Lock,
  ArrowRight,
  TrendingUp,
  AlertOctagon,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
  RefreshCw,
  Eye,
  FileCode2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RailEvent {
  id: string;
  rail: "stripe" | "paypal" | "settler";
  title: string;
  amount: string;
  fee: string;
  status: "verified" | "anomaly" | "adjudicated";
  anomalyDetail?: string;
  merkleHash: string;
}

const LIVE_EVENTS: RailEvent[] = [
  {
    id: "STR-98210",
    rail: "stripe",
    title: "Stripe PaymentIntent ch_3N8x... (Card Present)",
    amount: "$4,850.00",
    fee: "$101.85 (2.10%)",
    status: "verified",
    merkleHash: "sha256:7b1e4c...902a",
  },
  {
    id: "PP-55102",
    rail: "paypal",
    title: "PayPal Capture 8XX49... (Digital Wallet)",
    amount: "$2,120.00",
    fee: "$73.99 (3.49%)",
    status: "anomaly",
    anomalyDetail: "Contractual fee ceiling exceeded by 40 bps ($8.48 overcharge)",
    merkleHash: "sha256:c38f12...551b",
  },
  {
    id: "ARB-0041",
    rail: "settler",
    title: "Cross-Rail Dispute Arbitrage Defended",
    amount: "$680.00",
    fee: "$0.00",
    status: "adjudicated",
    anomalyDetail: "Prevented duplicate refund across Stripe & PayPal channels",
    merkleHash: "sha256:a12e99...ff34",
  },
];

export function BilateralSettlementVisualizer() {
  const [activeTab, setActiveTab] = useState<"architecture" | "anomalies" | "proofpack">(
    "architecture"
  );
  const [selectedEvent, setSelectedEvent] = useState<RailEvent>(LIVE_EVENTS[1]!);
  const [isAdjudicating, setIsAdjudicating] = useState(false);
  const [adjudicated, setAdjudicated] = useState(false);
  const [, setPacketTick] = useState(0);

  // Simulated live telemetry pulses
  useEffect(() => {
    const timer = setInterval(() => {
      setPacketTick((prev) => prev + 1);
    }, 2400);
    return () => clearInterval(timer);
  }, []);

  const handleAdjudicateAnomaly = () => {
    setIsAdjudicating(true);
    setTimeout(() => {
      setIsAdjudicating(false);
      setAdjudicated(true);
      setTimeout(() => setAdjudicated(false), 3500);
    }, 750);
  };

  return (
    <div className="relative w-full rounded-3xl border border-slate-200/90 dark:border-white/10 bg-gradient-to-b from-white via-slate-50/50 to-slate-100/50 dark:from-slate-900/90 dark:via-slate-950/80 dark:to-slate-900/90 p-6 md:p-8 backdrop-blur-xl shadow-2xl shadow-slate-900/5 dark:shadow-black/60 overflow-hidden">
      {/* Dynamic Ambient Background Elements */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-teal-500/10 dark:bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge
              variant="outline"
              className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 text-xs font-mono font-semibold"
            >
              STRATEGIC M&amp;A ENCLAVE
            </Badge>
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs font-mono"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block mr-1 animate-pulse" />
              UNIVERSAL CROSS-RAIL PROTOCOL
            </Badge>
          </div>
          <h3 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Why Stripe &amp; PayPal Compete to Own Settler
          </h3>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Neither Stripe nor PayPal can see each other&apos;s transactions, reserves, or batch
            deposits. Settler acts as the neutral, cryptographic reconciliation judge for the global
            enterprise.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-200/70 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-300/50 dark:border-white/5 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("architecture")}
            className={cn(
              "px-3 py-1.5 rounded-xl font-medium transition-all duration-200 flex items-center gap-1.5 cursor-pointer",
              activeTab === "architecture"
                ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Dual Rails</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("anomalies")}
            className={cn(
              "px-3 py-1.5 rounded-xl font-medium transition-all duration-200 flex items-center gap-1.5 cursor-pointer",
              activeTab === "anomalies"
                ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <AlertOctagon className="h-3.5 w-3.5 text-amber-500" />
            <span>Leakage Defense</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("proofpack")}
            className={cn(
              "px-3 py-1.5 rounded-xl font-medium transition-all duration-200 flex items-center gap-1.5 cursor-pointer",
              activeTab === "proofpack"
                ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <FileCode2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>Merkle Seal</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="relative mt-6">
        <AnimatePresence mode="wait">
          {/* TAB 1: DUAL RAILS ARCHITECTURE */}
          {activeTab === "architecture" && (
            <motion.div
              key="arch"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Visual 3-Column Bridge */}
              <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 items-center">
                {/* Column 1: Stripe Rail (4 cols) */}
                <div className="lg:col-span-4 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-600/20">
                        S
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Stripe Feed Rail
                        </h4>
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">
                          API v2024-11-20 + Webhooks
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] border-indigo-400/30 text-indigo-700 dark:text-indigo-300"
                    >
                      LIVE INGESTION
                    </Badge>
                  </div>

                  <div className="space-y-2 font-mono text-[11px]">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between shadow-xs">
                      <span className="text-slate-600 dark:text-slate-300">PaymentIntents</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        14,820 tx/day
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between shadow-xs">
                      <span className="text-slate-600 dark:text-slate-300">
                        Interchange++ Drift
                      </span>
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">
                        12.4 bps anomaly
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between shadow-xs">
                      <span className="text-slate-600 dark:text-slate-300">
                        Batch Payout Horizon
                      </span>
                      <span className="text-slate-700 dark:text-slate-300">T+2 Rolling</span>
                    </div>
                  </div>
                </div>

                {/* Column 2: Settler Sovereign Core (3 cols) */}
                <div className="lg:col-span-3 rounded-2xl border-2 border-teal-500/50 bg-gradient-to-b from-teal-950/20 via-slate-900 to-teal-950/30 p-5 text-center space-y-3 shadow-xl shadow-teal-500/10">
                  <div className="relative inline-flex items-center justify-center">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white flex items-center justify-center shadow-lg shadow-teal-500/30 mx-auto">
                      <Cpu className="h-6 w-6 animate-pulse" />
                    </div>
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500" />
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-extrabold text-white tracking-tight">
                      SETTLER KERNEL
                    </h4>
                    <p className="text-[10px] text-teal-300/80 font-mono mt-0.5">
                      Sovereign Neutrality
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-950/70 border border-teal-500/20 p-2.5 text-[11px] font-mono text-teal-300 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Deterministic:</span>
                      <span className="text-emerald-400 font-bold">100.00%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Float Drag:</span>
                      <span className="text-emerald-400 font-bold">0.00 days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Merkle Root:</span>
                      <span className="text-teal-400 truncate max-w-[100px]">e3b0...b855</span>
                    </div>
                  </div>
                </div>

                {/* Column 3: PayPal Rail (4 cols) */}
                <div className="lg:col-span-4 rounded-2xl border border-blue-200/80 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-600/20">
                        P
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          PayPal Feed Rail
                        </h4>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                          v2 Orders &amp; Mass Payouts
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] border-blue-400/30 text-blue-700 dark:text-blue-300"
                    >
                      LIVE INGESTION
                    </Badge>
                  </div>

                  <div className="space-y-2 font-mono text-[11px]">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-blue-100 dark:border-blue-900/30 flex items-center justify-between shadow-xs">
                      <span className="text-slate-600 dark:text-slate-300">Digital Captures</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        8,340 tx/day
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-blue-100 dark:border-blue-900/30 flex items-center justify-between shadow-xs">
                      <span className="text-slate-600 dark:text-slate-300">Reserve Holdbacks</span>
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">
                        $45,210 escrow
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-blue-100 dark:border-blue-900/30 flex items-center justify-between shadow-xs">
                      <span className="text-slate-600 dark:text-slate-300">Batch Settlement</span>
                      <span className="text-slate-700 dark:text-slate-300">Auto-Sweep ACH</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bilateral Reconciliation Telemetry Bar */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Bilateral Zero-Variance Invariant Enforced
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Cross-matching 23,160 daily multi-rail transactions against Chase Bank
                      Operating Account.
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 px-3 py-1"
                >
                  AUDIT PASS: 0 FLOAT LOSS
                </Badge>
              </div>
            </motion.div>
          )}

          {/* TAB 2: LEAKAGE DEFENSE & ANOMALY ADJUDICATION */}
          {activeTab === "anomalies" && (
            <motion.div
              key="anomalies"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {LIVE_EVENTS.map((event) => {
                  const isSelected = selectedEvent.id === event.id;
                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => setSelectedEvent(event)}
                      className={cn(
                        "text-left p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer space-y-2",
                        isSelected
                          ? "border-teal-500 bg-teal-50/50 dark:bg-teal-950/30 shadow-md ring-2 ring-teal-500/20"
                          : "border-slate-200/80 dark:border-white/5 bg-white dark:bg-slate-800/60 hover:border-slate-300"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                          {event.id}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] uppercase font-bold",
                            event.status === "anomaly"
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                              : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                          )}
                        >
                          {event.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate">
                        {event.title}
                      </p>
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                        <span>{event.amount}</span>
                        <span>{event.fee}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Anomaly Deep-Dive Card */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-800/80 p-5 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-mono text-slate-400">INSPECTING ARTIFACT:</span>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      {selectedEvent.title}
                    </h4>
                  </div>
                  <Badge
                    variant="outline"
                    className="font-mono text-xs text-teal-600 dark:text-teal-400 border-teal-500/30"
                  >
                    {selectedEvent.merkleHash}
                  </Badge>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertOctagon className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        Sovereign Kernel Analysis:
                      </span>
                      <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                        {selectedEvent.anomalyDetail ||
                          "Transaction matched exact fee schedule with 0 variance."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="text-xs text-slate-500 font-mono">
                    RULE_CLASS: DUAL_PROCESSOR_ARBITRAGE_v2
                  </div>
                  <Button
                    onClick={handleAdjudicateAnomaly}
                    disabled={isAdjudicating}
                    size="sm"
                    className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md shadow-teal-600/20 text-xs font-semibold"
                  >
                    {isAdjudicating ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        Adjudicating Against Policy...
                      </>
                    ) : adjudicated ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-white" />
                        Discrepancy Sealed &amp; Recovered
                      </>
                    ) : (
                      <>
                        <Zap className="h-3.5 w-3.5 mr-1.5" />
                        Auto-Adjudicate &amp; Claim Clawback
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: MERKLE PROOFPACK INSPECTION */}
          {activeTab === "proofpack" && (
            <motion.div
              key="proofpack"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-900 text-slate-100 p-5 font-mono text-xs space-y-3">
                <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-white/10">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <Lock className="h-3.5 w-3.5" /> RFC 6962 CRYPTOGRAPHIC PROOFPACK
                  </span>
                  <span>VERSION: 2.4-SOVEREIGN</span>
                </div>

                <pre className="text-[11px] leading-relaxed text-teal-300 overflow-x-auto p-2 bg-black/40 rounded-xl">
                  {`{
  "protocol": "settler://cross-rail-bilateral",
  "processors": ["stripe_v2024", "paypal_v2"],
  "reconciliation_window": "2026-09-01T00:00:00Z..2026-09-10T23:59:59Z",
  "merkle_root": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "invariants": {
    "zero_float_drift": true,
    "cross_rail_double_refund_defended": true,
    "fee_schedule_interchange_verified": true
  },
  "settlement_integrity": "SOX_404_COMPLIANT_UNQUALIFIED"
}`}
                </pre>

                <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400">
                  <span>Tamper-evident verification hash valid</span>
                  <span className="text-emerald-400 font-semibold">100% REPLAY REPRODUCIBLE</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Strategic Footer Value Ribbon */}
      <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-teal-500 animate-ping" />
          <span>NEUTRAL ENCLAVE: INDEPENDENT FROM ALL GATEWAYS</span>
        </div>
        <span className="text-slate-500">M&amp;A MULTIPLIER: CAPTURES ENTIRE CFO LEDGER</span>
      </div>
    </div>
  );
}
