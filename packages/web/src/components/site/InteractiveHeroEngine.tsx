"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  ShieldCheck,
  Zap,
  Sliders,
  FileCheck2,
  Database,
  Fingerprint,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type EngineMode = "stream" | "tolerance" | "proof";

interface StreamTx {
  id: string;
  sourceA: string;
  sourceB: string;
  amount: number;
  delta: number;
  status: "matched" | "flagged";
  hash: string;
}

const INITIAL_TRANSACTIONS: StreamTx[] = [
  {
    id: "tx_9841",
    sourceA: "Stripe ch_923",
    sourceB: "Chase #4102",
    amount: 2450.0,
    delta: 0.0,
    status: "matched",
    hash: "sha256:7f4c...3e1a",
  },
  {
    id: "tx_9842",
    sourceA: "Shopify ord_881",
    sourceB: "QuickBooks #109",
    amount: 189.5,
    delta: 0.0,
    status: "matched",
    hash: "sha256:1a8b...990f",
  },
  {
    id: "tx_9843",
    sourceA: "PayPal capture_11",
    sourceB: "NetSuite inv_440",
    amount: 7600.0,
    delta: 0.0,
    status: "matched",
    hash: "sha256:4d2e...b801",
  },
];

export function InteractiveHeroEngine() {
  const [mode, setMode] = useState<EngineMode>("stream");
  const [tolerance, setTolerance] = useState<number>(0.05);
  const [streamList, setStreamList] = useState<StreamTx[]>(INITIAL_TRANSACTIONS);
  const [verifiedCount, setVerifiedCount] = useState(14892);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  // Simulated live ticker for the stream mode
  useEffect(() => {
    if (mode !== "stream") return;

    const interval = setInterval(() => {
      setVerifiedCount((prev) => prev + 1);
      const sourceAPrefixes = ["Stripe ch_", "Shopify ord_", "Square pay_"];
      const sourceBPrefixes = ["Chase #", "NetSuite #", "QuickBooks #"];
      const prefixA =
        sourceAPrefixes[Math.floor(Math.random() * sourceAPrefixes.length)] ?? "Stripe ch_";
      const prefixB =
        sourceBPrefixes[Math.floor(Math.random() * sourceBPrefixes.length)] ?? "Chase #";

      const newTx: StreamTx = {
        id: `tx_${Math.floor(1000 + Math.random() * 9000)}`,
        sourceA: prefixA + Math.floor(100 + Math.random() * 900),
        sourceB: prefixB + Math.floor(1000 + Math.random() * 9000),
        amount: Math.round((20 + Math.random() * 4500) * 100) / 100,
        delta: 0.0,
        status: "matched",
        hash: `sha256:${Math.random().toString(36).substring(2, 6)}...${Math.random().toString(36).substring(2, 6)}`,
      };

      setStreamList((prev) => {
        const first = prev[0] ?? INITIAL_TRANSACTIONS[0]!;
        const second = prev[1] ?? INITIAL_TRANSACTIONS[1]!;
        return [newTx, first, second];
      });
    }, 2800);

    return () => clearInterval(interval);
  }, [mode]);

  const handleVerifyClick = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setVerificationSuccess(true);
      setTimeout(() => setVerificationSuccess(false), 3000);
    }, 600);
  };

  return (
    <div className="relative w-full max-w-[540px] rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-slate-900/85 backdrop-blur-xl shadow-2xl shadow-slate-900/10 dark:shadow-black/40 overflow-hidden transition-all duration-300">
      {/* Dynamic top ambient glow line */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-teal-400 via-emerald-400 to-blue-500 opacity-90" />

      {/* Control Header & Mode Tabs */}
      <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-xs font-bold tracking-wider uppercase text-slate-800 dark:text-slate-200 font-mono">
            ENGINE CORE v2.4
          </span>
          <Badge
            variant="outline"
            className="text-[10px] px-2 py-0 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 font-semibold"
          >
            0.38ms LATENCY
          </Badge>
        </div>

        {/* Interactive Mode Pills */}
        <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/60 dark:border-white/5 text-xs">
          <button
            type="button"
            onClick={() => setMode("stream")}
            className={cn(
              "px-2.5 py-1 rounded-lg font-medium transition-all duration-200 flex items-center gap-1.5",
              mode === "stream"
                ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <Zap className="h-3 w-3" />
            <span>Stream</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("tolerance")}
            className={cn(
              "px-2.5 py-1 rounded-lg font-medium transition-all duration-200 flex items-center gap-1.5",
              mode === "tolerance"
                ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <Sliders className="h-3 w-3" />
            <span>Tolerance</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("proof")}
            className={cn(
              "px-2.5 py-1 rounded-lg font-medium transition-all duration-200 flex items-center gap-1.5",
              mode === "proof"
                ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <ShieldCheck className="h-3 w-3" />
            <span>Proof</span>
          </button>
        </div>
      </div>

      {/* Interactive Main Body */}
      <div className="p-5 sm:p-6 min-h-[360px] flex flex-col justify-between">
        <AnimatePresence mode="wait">
          {/* MODE 1: LIVE STREAM */}
          {mode === "stream" && (
            <motion.div
              key="stream"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.24 }}
              className="space-y-5"
            >
              {/* Moving Data Ingestion Topology */}
              <div className="relative rounded-2xl border border-slate-200/80 dark:border-white/5 bg-slate-50/70 dark:bg-slate-950/40 p-4 overflow-hidden">
                <div className="absolute inset-0 bg-grid-quiet opacity-40 pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between gap-2 text-center">
                  {/* Source Left */}
                  <div className="flex flex-col items-center p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-white/10 shadow-sm w-32">
                    <Database className="h-4 w-4 text-blue-600 dark:text-blue-400 mb-1" />
                    <span className="text-[11px] font-bold text-slate-900 dark:text-white">
                      Stripe Feed
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5">$2,450.00</span>
                  </div>

                  {/* Animated Central Pipeline */}
                  <div className="flex-1 flex flex-col items-center px-1">
                    <div className="relative w-full h-8 flex items-center justify-center">
                      {/* Left-to-center animated line */}
                      <div className="w-full h-0.5 bg-gradient-to-r from-blue-400 via-teal-400 to-emerald-400 relative overflow-hidden">
                        <motion.div
                          className="absolute top-0 bottom-0 w-8 bg-white"
                          animate={{ x: ["-100%", "300%"] }}
                          transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
                        />
                      </div>
                      {/* Center Badge Core */}
                      <div className="absolute h-9 w-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 border-2 border-white dark:border-slate-900">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 uppercase tracking-wider">
                      MATCH SEALED
                    </span>
                  </div>

                  {/* Source Right */}
                  <div className="flex flex-col items-center p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-white/10 shadow-sm w-32">
                    <Database className="h-4 w-4 text-teal-600 dark:text-teal-400 mb-1" />
                    <span className="text-[11px] font-bold text-slate-900 dark:text-white">
                      Chase Ledger
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5">$2,450.00</span>
                  </div>
                </div>
              </div>

              {/* Streaming Records Feed */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 px-1 font-medium">
                  <span>Recent Executions</span>
                  <span className="font-mono text-[11px] text-slate-500">
                    Total: {verifiedCount.toLocaleString()}
                  </span>
                </div>

                <div className="space-y-2">
                  {streamList.map((tx) => (
                    <motion.div
                      key={tx.id}
                      layout
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/70 dark:border-white/5 bg-white/70 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                          ✓
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-900 dark:text-white">
                            {tx.sourceA} ↔ {tx.sourceB}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{tx.hash}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                          ${tx.amount.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          Δ $0.0000
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* MODE 2: TOLERANCE & DRIFT SIMULATOR */}
          {mode === "tolerance" && (
            <motion.div
              key="tolerance"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.24 }}
              className="space-y-5"
            >
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Field-Level Tolerance Window
                  </span>
                  <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">
                    ${tolerance.toFixed(2)}
                  </span>
                </div>

                {/* Tolerance Quick Selectors */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[0.0, 0.05, 1.0].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTolerance(val)}
                      className={cn(
                        "py-1.5 px-3 rounded-xl text-xs font-medium border transition-all text-center",
                        tolerance === val
                          ? "bg-teal-600 text-white border-teal-600 shadow-sm font-semibold"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-teal-400"
                      )}
                    >
                      {val === 0
                        ? "Strict ($0.00)"
                        : val === 0.05
                          ? "Penny ($0.05)"
                          : "Standard ($1.00)"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Sample Items with Reactive Evaluation */}
              <div className="space-y-2">
                {[
                  { title: "Invoice #1042 vs Wire", amtA: 1540.0, amtB: 1540.0, diff: 0.0 },
                  { title: "FX Currency Rounding", amtA: 320.12, amtB: 320.14, diff: 0.02 },
                  { title: "Cross-Border Fee Adj", amtA: 890.0, amtB: 890.45, diff: 0.45 },
                ].map((item, idx) => {
                  const isMatch = item.diff <= tolerance;
                  return (
                    <motion.div
                      key={idx}
                      layout
                      className="p-3 rounded-xl border border-slate-200/70 dark:border-white/5 bg-white/80 dark:bg-slate-800/60 flex items-center justify-between shadow-sm"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">
                          {item.title}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          ${item.amtA.toFixed(2)} vs ${item.amtB.toFixed(2)} (Δ $
                          {item.diff.toFixed(2)})
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-bold tracking-wider px-2 py-0.5 uppercase transition-colors duration-200",
                          isMatch
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-500/40"
                            : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-500/40"
                        )}
                      >
                        {isMatch ? "MATCHED" : "VARIANCE FLAGGED"}
                      </Badge>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* MODE 3: PROOFPACK */}
          {mode === "proof" && (
            <motion.div
              key="proof"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.24 }}
              className="space-y-4"
            >
              <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-slate-950/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Cryptographic Evidence Pack
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono text-teal-700 border-teal-500/30"
                  >
                    SEALED_v1
                  </Badge>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-white/5 font-mono text-[10px] text-slate-600 dark:text-slate-300 break-all space-y-1">
                  <div className="text-slate-400 uppercase text-[9px] font-bold">
                    SHA-256 Merkle Root
                  </div>
                  <div className="text-teal-700 dark:text-teal-300 font-semibold">
                    e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-600 dark:text-slate-300 pt-1">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Deterministic Replay: OK</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FileCheck2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Export: SOX / SOC-2</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleVerifyClick}
                disabled={isVerifying}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md shadow-teal-600/20 transition-all transform active:scale-[0.98]"
              >
                {isVerifying ? (
                  <>
                    <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                    <span>Verifying Evidence Hashes...</span>
                  </>
                ) : verificationSuccess ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                    <span>Cryptographically Verified (100% Match)</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Test Evidence Verification</span>
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Status Ribbon */}
        <div className="pt-4 mt-4 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
            ZERO_DRIFT_ENFORCED
          </span>
          <span className="text-slate-400">HASH-LINKED EVIDENCE</span>
        </div>
      </div>
    </div>
  );
}
