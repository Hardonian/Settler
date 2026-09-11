"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GitFork,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCw,
  Cpu,
  Layers,
  Lock,
  Workflow,
  Sparkles,
} from "lucide-react";

interface PipelineStep {
  id: string;
  name: string;
  category: "ingest" | "invariant" | "matching" | "tolerance" | "ledger" | "proof";
  description: string;
  status: "idle" | "processing" | "success" | "quarantined";
  metric: string;
}

const INITIAL_PIPELINE: PipelineStep[] = [
  {
    id: "step-ingest",
    name: "Bilateral Ingestion",
    category: "ingest",
    description:
      "Ingesting Stripe webhooks + PayPal REST events concurrently with replay-nonce deduplication.",
    status: "idle",
    metric: "2 Rails Active",
  },
  {
    id: "step-invariant",
    name: "Multi-Tenant Invariant Guard",
    category: "invariant",
    description:
      "Asserting tenant_id scoping on all SQL queries and integer-cent precision with 0 float tolerance.",
    status: "idle",
    metric: "100% Invariant Pass",
  },
  {
    id: "step-matching",
    name: "Deterministic Correlator",
    category: "matching",
    description:
      "Correlating multi-rail events by Acquirer Reference Number (ARN) and cryptographic order hashes.",
    status: "idle",
    metric: "Sub-10ms Match",
  },
  {
    id: "step-tolerance",
    name: "Interchange Surcharge Gate",
    category: "tolerance",
    description:
      "Auditing interchange tier schedules against processor fee schedules; quarantining >5 bps leakage.",
    status: "idle",
    metric: "±5 bps Allowed",
  },
  {
    id: "step-ledger",
    name: "TigerBeetle Dual-Entry",
    category: "ledger",
    description:
      "Posting zero-float debits and credits into immutable, state-machine financial partitions.",
    status: "idle",
    metric: "Strict Double-Entry",
  },
  {
    id: "step-proof",
    name: "Merkle Root Attestation",
    category: "proof",
    description:
      "Calculating SHA-256 Merkle root across journal entries and anchoring tamper-evident proofpack.",
    status: "idle",
    metric: "SHA-256 Leaf Sealing",
  },
];

export function AstraFlowEngine() {
  const [pipeline, setPipeline] = useState<PipelineStep[]>(INITIAL_PIPELINE);
  const [toleranceBps, setToleranceBps] = useState<number>(5);
  const [timeWindowSec, setTimeWindowSec] = useState<number>(180);
  const [strictMode, setStrictMode] = useState<boolean>(true);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(-1);
  const [packetsProcessed, setPacketsProcessed] = useState<number>(1420);
  const [lastSealedRoot, setLastSealedRoot] = useState<string>(
    "0x4f82c189e92bc9837a2819cd918349281ab892c90192837482910fa98234cdfa"
  );

  const runSimulation = () => {
    if (isStreaming) return;
    setIsStreaming(true);
    setActiveStepIndex(0);

    // Reset steps
    setPipeline((prev) => prev.map((s) => ({ ...s, status: "idle" })));

    let step = 0;
    const interval = setInterval(() => {
      if (step < INITIAL_PIPELINE.length) {
        setActiveStepIndex(step);
        setPipeline((prev) =>
          prev.map((s, idx) => {
            if (idx === step) return { ...s, status: "processing" };
            if (idx < step) return { ...s, status: "success" };
            return s;
          })
        );
        step++;
      } else {
        clearInterval(interval);
        setActiveStepIndex(-1);
        setPipeline((prev) => prev.map((s) => ({ ...s, status: "success" })));
        setIsStreaming(false);
        setPacketsProcessed((prev) => prev + 1);
        setLastSealedRoot(
          `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(
            ""
          )}`
        );
      }
    }, 450);
  };

  useEffect(() => {
    return () => {
      // cleanup
    };
  }, []);

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl overflow-hidden font-sans">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 text-white shadow-md">
            <Workflow className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight text-white">
                Astra Bilateral Settlement Flow Engine
              </h2>
              <Badge
                variant="outline"
                className="border-indigo-500/40 text-indigo-400 text-xs px-2 py-0.5"
              >
                Programmable DAG
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              Visual pipeline configuration for continuous T+0 multi-rail reconciliation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2 sm:mt-0">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">
              Total Packets Reconciled
            </div>
            <div className="font-mono text-xs font-bold text-indigo-300">
              {packetsProcessed.toLocaleString()} txs
            </div>
          </div>
          <Button
            onClick={runSimulation}
            disabled={isStreaming}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-900/30"
          >
            {isStreaming ? (
              <>
                <Cpu className="mr-2 h-3.5 w-3.5 animate-spin" /> Streaming Packet...
              </>
            ) : (
              <>
                <Play className="mr-2 h-3.5 w-3.5 fill-current" /> Stream Test Packet
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Control Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-slate-800 bg-slate-900/40 px-6 py-3 text-xs">
        <div>
          <div className="flex justify-between font-medium text-slate-300 mb-1">
            <span>Interchange Tolerance Gate:</span>
            <span className="font-mono font-bold text-cyan-400">±{toleranceBps} bps</span>
          </div>
          <input
            type="range"
            min="1"
            max="25"
            value={toleranceBps}
            onChange={(e) => setToleranceBps(Number(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        <div>
          <div className="flex justify-between font-medium text-slate-300 mb-1">
            <span>Clustering Correlation Window:</span>
            <span className="font-mono font-bold text-indigo-400">{timeWindowSec}s</span>
          </div>
          <input
            type="range"
            min="30"
            max="600"
            step="30"
            value={timeWindowSec}
            onChange={(e) => setTimeWindowSec(Number(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0">
          <span className="text-slate-400">Strict Invariant Enforcement:</span>
          <button
            onClick={() => setStrictMode(!strictMode)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all border ${
              strictMode
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow"
                : "bg-slate-800 text-slate-400 border-slate-700"
            }`}
          >
            {strictMode ? "STRICT ZERO-FLOAT" : "RELAXED TOLERANCE"}
          </button>
        </div>
      </div>

      {/* Visual Pipeline DAG */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pipeline.map((step, idx) => {
            const isCurrent = activeStepIndex === idx;
            const isDone = step.status === "success";

            return (
              <div
                key={step.id}
                className={`relative rounded-xl border p-4 transition-all duration-300 ${
                  isCurrent
                    ? "border-cyan-500 bg-cyan-950/30 shadow-lg shadow-cyan-950/50 scale-[1.02]"
                    : isDone
                      ? "border-emerald-500/40 bg-slate-900/60"
                      : "border-slate-800 bg-slate-900/30 hover:border-slate-700"
                }`}
              >
                {/* Step Number & Connector */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        isCurrent
                          ? "bg-cyan-500 text-slate-950 animate-pulse"
                          : isDone
                            ? "bg-emerald-500 text-slate-950"
                            : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <h3 className="text-sm font-bold text-white">{step.name}</h3>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-mono ${
                      isCurrent
                        ? "border-cyan-500 text-cyan-400 animate-pulse"
                        : isDone
                          ? "border-emerald-500 text-emerald-400"
                          : "border-slate-700 text-slate-500"
                    }`}
                  >
                    {isCurrent ? "EXECUTING" : isDone ? "PASSED" : "STANDBY"}
                  </Badge>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mb-3">{step.description}</p>

                <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px] font-mono">
                  <span className="text-slate-400">Rule Constraint:</span>
                  <span className="text-indigo-300 font-semibold">{step.metric}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Real-Time State Root Output */}
        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/80 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">
                Current Anchor Merkle State Root
              </div>
              <div className="text-emerald-400 font-bold truncate max-w-md sm:max-w-xl">
                {lastSealedRoot}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1 text-slate-300 border border-slate-700">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Double-Entry Balanced</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
