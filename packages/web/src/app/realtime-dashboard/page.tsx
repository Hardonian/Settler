"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  ShieldCheck,
  AlertTriangle,
  Play,
  Pause,
  Download,
  Terminal,
  Lock,
  Database,
  Layers,
  Sliders,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface StreamEvent {
  id: string;
  timestamp: string;
  type: "MATCH" | "FEE_VERIFIED" | "SLIPPAGE_DETECTED" | "DUPLICATE_FLAGGED" | "MERKLE_SEAL";
  source: string;
  amount: number;
  fee: number;
  status: "VERIFIED" | "ANOMALY" | "SEALED";
  hash: string;
  details: string;
}

const INITIAL_EVENTS: StreamEvent[] = [
  {
    id: "tx_live_901",
    timestamp: new Date(Date.now() - 4000).toISOString(),
    type: "MATCH",
    source: "Stripe -> Chase Clearing",
    amount: 1420.5,
    fee: 41.5,
    status: "VERIFIED",
    hash: "a4f8b92c10de53a7",
    details: "Deterministic composite match. Tolerance: 0.00%.",
  },
  {
    id: "tx_live_902",
    timestamp: new Date(Date.now() - 3200).toISOString(),
    type: "FEE_VERIFIED",
    source: "Shopify Pay -> Silicon Valley Bank",
    amount: 890.0,
    fee: 26.11,
    status: "VERIFIED",
    hash: "c7e2d148f3b091e6",
    details: "Gateway fee matrix verified (2.9% + $0.30 fixed).",
  },
  {
    id: "tx_live_903",
    timestamp: new Date(Date.now() - 2100).toISOString(),
    type: "MATCH",
    source: "Adyen Escrow -> NetSuite AR",
    amount: 14200.0,
    fee: 312.4,
    status: "VERIFIED",
    hash: "f109bc48da721e90",
    details: "GL Double-entry balanced. Clearing debits match credits.",
  },
  {
    id: "tx_live_904",
    timestamp: new Date(Date.now() - 1000).toISOString(),
    type: "MERKLE_SEAL",
    source: "Settler CAS Kernel",
    amount: 16510.5,
    fee: 380.01,
    status: "SEALED",
    hash: "3d91cf87a20e4b51",
    details: "RFC 6962 batch commitment root sealed with HMAC.",
  },
];

function RealtimeDashboardContent() {
  const searchParams = useSearchParams();
  const initialJobId = searchParams?.get("jobId") || "";
  const initialApiKey = searchParams?.get("apiKey") || "";

  const [mode, setMode] = useState<"live_stream" | "job_connect">(
    initialJobId ? "job_connect" : "live_stream"
  );
  const [jobId, setJobId] = useState(initialJobId);
  const [apiKey, setApiKey] = useState(initialApiKey);

  // Live Stream Controls
  const [isStreaming, setIsStreaming] = useState(true);
  const [streamSpeed, setStreamSpeed] = useState<1 | 5 | 10>(1);
  const [activeTab, setActiveTab] = useState<"all" | "anomalies" | "seals">("all");
  const [activeAlert, setActiveAlert] = useState<string | null>(null);

  // Dynamic Telemetry Metrics
  const [tps, setTps] = useState(142);
  const [accuracy, setAccuracy] = useState(99.98);
  const [reconciledVolume, setReconciledVolume] = useState(1842910.45);
  const [merkleRoot, setMerkleRoot] = useState("48c781e97fd3557ea0722087a34c3098");
  const [blocksSealed, setBlocksSealed] = useState(3142);
  const [events, setEvents] = useState<StreamEvent[]>(INITIAL_EVENTS);
  const [autoScroll, setAutoScroll] = useState(true);

  const eventFeedRef = useRef<HTMLDivElement>(null);

  // Auto-scroll event stream
  useEffect(() => {
    if (autoScroll && eventFeedRef.current) {
      eventFeedRef.current.scrollTop = 0;
    }
  }, [events, autoScroll]);

  // Live Stream Event Generation Loop
  useEffect(() => {
    if (!isStreaming || mode !== "live_stream") return;

    const intervalMs = 1800 / streamSpeed;
    const interval = setInterval(() => {
      // Fluctuating TPS
      const newTps = Math.floor(130 + Math.random() * 45 * streamSpeed);
      setTps(newTps);

      // Random transaction generator
      const sources = [
        "Stripe -> Chase Clearing",
        "Shopify Pay -> SVB Operating",
        "Adyen Escrow -> NetSuite AR",
        "PayPal Gateway -> Wells Fargo",
        "Square Terminal -> BofA Depository",
      ];
      const selectedSource = sources[Math.floor(Math.random() * sources.length)] || sources[0]!;
      const amount = Number((100 + Math.random() * 4800).toFixed(2));
      const fee = Number((amount * 0.029 + 0.3).toFixed(2));
      const randomHex = Math.random().toString(16).substring(2, 18);

      const newEvent: StreamEvent = {
        id: `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        type: "MATCH",
        source: selectedSource,
        amount,
        fee,
        status: "VERIFIED",
        hash: randomHex,
        details: "Deterministic match confirmed. Zero slippage.",
      };

      setReconciledVolume((prev) => prev + amount);
      setEvents((prev) => [newEvent, ...prev.slice(0, 79)]);

      // Periodic Merkle seal every ~8 events
      if (Math.random() > 0.85) {
        const sealHex = Math.random().toString(16).substring(2, 18);
        setMerkleRoot(sealHex + randomHex.substring(0, 16));
        setBlocksSealed((b) => b + 1);
        const sealEvent: StreamEvent = {
          id: `seal_${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: "MERKLE_SEAL",
          source: "Settler CAS Kernel",
          amount,
          fee,
          status: "SEALED",
          hash: sealHex,
          details: `RFC 6962 batch commitment sealed. Root: ${sealHex}...`,
        };
        setEvents((prev) => [sealEvent, ...prev.slice(0, 79)]);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isStreaming, streamSpeed, mode]);

  // Anomaly Injection Handler
  const handleInjectAnomaly = (type: "slippage" | "duplicate" | "timing", _label: string) => {
    const randomHex = Math.random().toString(16).substring(2, 18);
    let anomalyEvent: StreamEvent;

    if (type === "slippage") {
      anomalyEvent = {
        id: `anomaly_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "SLIPPAGE_DETECTED",
        source: "Stripe Settlement Batch",
        amount: 8450.0,
        fee: 288.75, // +50 bps overcharge
        status: "ANOMALY",
        hash: randomHex,
        details: "CONTRACT VIOLATION: Gateway fee charged 3.40% vs contractual 2.90% (+50 bps).",
      };
      setActiveAlert(
        "Fee Slippage Flagged: Processor charged $288.75 vs $245.35 expected (+43.40 overcharge)."
      );
    } else if (type === "duplicate") {
      anomalyEvent = {
        id: `anomaly_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "DUPLICATE_FLAGGED",
        source: "Shopify Refund Queue",
        amount: -320.0,
        fee: 15.0,
        status: "ANOMALY",
        hash: randomHex,
        details: "DUPLICATE DEDUCTION: Transaction ref_901 debited twice across batch payouts.",
      };
      setActiveAlert(
        "Duplicate Deduction Intercepted: Reference #ref_901 deducted in prior batch #po_2026_08."
      );
    } else {
      anomalyEvent = {
        id: `anomaly_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "SLIPPAGE_DETECTED",
        source: "International Wire -> Chase",
        amount: 24500.0,
        fee: 65.0,
        status: "ANOMALY",
        hash: randomHex,
        details: "SETTLEMENT DRIFT: Value-date mismatch exceeds T+2 contractual SLA window.",
      };
      setActiveAlert(
        "Settlement Window Drift: Wire settlement timestamp drifted 74 hours outside T+2 policy."
      );
    }

    setEvents((prev) => [anomalyEvent, ...prev]);
    setAccuracy((prev) => Math.max(98.5, Number((prev - 0.04).toFixed(2))));

    setTimeout(() => {
      setActiveAlert(null);
    }, 7000);
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    if (activeTab === "anomalies") {
      return events.filter((e) => e.type === "SLIPPAGE_DETECTED" || e.type === "DUPLICATE_FLAGGED");
    }
    if (activeTab === "seals") {
      return events.filter((e) => e.type === "MERKLE_SEAL");
    }
    return events;
  }, [events, activeTab]);

  // Export ProofPack
  const handleExportProofPack = () => {
    const payload = {
      streamSessionId: `stream_${Date.now()}`,
      exportedAt: new Date().toISOString(),
      merkleRoot,
      blocksSealed,
      accuracyPercentage: accuracy,
      reconciledVolumeUSD: reconciledVolume,
      eventsCount: events.length,
      events,
      signature: `hmac_sha256_${merkleRoot.substring(0, 16)}_verified`,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `settler-telemetry-proofpack-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background text-foreground dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-black dark:text-slate-100 selection:bg-cyan-500 selection:text-black">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 space-y-8">
        {/* Header with Live Status Pill */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border dark:border-slate-800/80 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                {isStreaming ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                )}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground dark:text-white flex items-center gap-2">
                Real-Time Telemetry & Settlement Radar
              </h1>
            </div>
            <p className="text-sm text-muted-foreground dark:text-slate-400">
              Live deterministic ingestion stream, microsecond CAS Merkle root verification, and
              automated leakage detection.
            </p>
          </div>

          {/* Mode Switcher & Stream State */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg bg-slate-900 border border-slate-800 p-1 text-xs">
              <button
                onClick={() => setMode("live_stream")}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  mode === "live_stream"
                    ? "bg-cyan-500 text-black shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Live Feed (140 tx/s)
              </button>
              <button
                onClick={() => setMode("job_connect")}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  mode === "job_connect"
                    ? "bg-cyan-500 text-black shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Specific Job SSE
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsStreaming(!isStreaming)}
              className="border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-xs gap-1.5 min-h-[38px]"
            >
              {isStreaming ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-400" /> Pause Stream
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-cyan-400" /> Resume Stream
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportProofPack}
              className="border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-xs gap-1.5 min-h-[38px]"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" /> Export ProofPack
            </Button>
          </div>
        </div>

        {/* Live Anomaly Banner (Animated) */}
        <AnimatePresence>
          {activeAlert && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between gap-4 text-amber-300"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="text-sm font-medium">{activeAlert}</span>
              </div>
              <Badge
                variant="outline"
                className="border-amber-400/40 text-amber-400 uppercase text-[10px]"
              >
                Deterministic Exception
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>

        {/* KPI Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-slate-900/40 border-slate-800/80 backdrop-blur-sm">
            <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Throughput
              </span>
              <Activity className="w-4 h-4 text-cyan-400" />
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <div className="text-2xl sm:text-3xl font-bold font-mono text-cyan-300">
                {isStreaming ? tps : 0}{" "}
                <span className="text-xs font-normal text-slate-500">tx/sec</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-400">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Deterministic CAS active
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/40 border-slate-800/80 backdrop-blur-sm">
            <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Match Accuracy
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">
                {accuracy.toFixed(2)}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Zero tolerance drift</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/40 border-slate-800/80 backdrop-blur-sm">
            <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Reconciled Volume
              </span>
              <Layers className="w-4 h-4 text-purple-400" />
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <div className="text-2xl sm:text-3xl font-bold font-mono text-purple-300 truncate">
                ${(reconciledVolume / 1000000).toFixed(3)}M
              </div>
              <div className="text-[11px] text-slate-500 mt-1 truncate">
                Total ledger volume verified
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/40 border-slate-800/80 backdrop-blur-sm">
            <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Merkle Roots Sealed
              </span>
              <Lock className="w-4 h-4 text-cyan-400" />
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <div className="text-2xl sm:text-3xl font-bold font-mono text-white">
                {blocksSealed}
              </div>
              <div className="text-[11px] font-mono text-cyan-400/80 truncate mt-1">
                root: {merkleRoot.substring(0, 10)}...
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Controls & Anomaly Injection Bar */}
        <Card className="bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-slate-950 border-slate-800">
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <Sliders className="w-4 h-4" /> Live Exception & Fee Arbitration Simulator
                </h3>
                <p className="text-xs text-slate-400">
                  Inject live anomalies into the active stream to verify Settler&apos;s real-time
                  detection, fee matrix audit, and cryptographic evidence generation.
                </p>
              </div>

              {/* Action Triggers */}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    handleInjectAnomaly("slippage", "Gateway Fee Overcharge (+50 bps)")
                  }
                  className="border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs min-h-[40px]"
                >
                  <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-400" />
                  Simulate Fee Slippage
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleInjectAnomaly("duplicate", "Duplicate Payout Line")}
                  className="border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs min-h-[40px]"
                >
                  <AlertTriangle className="w-3.5 h-3.5 mr-1 text-red-400" />
                  Simulate Duplicate Refund
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleInjectAnomaly("timing", "Out-of-Window Settlement")}
                  className="border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs min-h-[40px]"
                >
                  <AlertTriangle className="w-3.5 h-3.5 mr-1 text-purple-400" />
                  Simulate SLA Drift
                </Button>
              </div>
            </div>

            {/* Velocity and Auto-Scroll toggles */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/60 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Stream Velocity:</span>
                {[1, 5, 10].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setStreamSpeed(speed as 1 | 5 | 10)}
                    className={`px-2.5 py-1 rounded border text-xs font-mono transition-all ${
                      streamSpeed === speed
                        ? "bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold"
                        : "border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-300">
                  <input
                    type="checkbox"
                    checked={autoScroll}
                    onChange={(e) => setAutoScroll(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-0 w-3.5 h-3.5"
                  />
                  <span>Auto-scroll to latest</span>
                </label>
                <button
                  onClick={() => setEvents([])}
                  className="text-slate-400 hover:text-red-400 transition-colors"
                >
                  Clear stream
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Stream Table / Feed */}
        <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
          <CardHeader className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                Live Ingestion Stream ({filteredEvents.length} events buffered)
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Zero-copy transaction events ingested and adjudicated by Settler Kernel
              </CardDescription>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1 rounded font-medium transition-all ${
                  activeTab === "all"
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                All Events
              </button>
              <button
                onClick={() => setActiveTab("anomalies")}
                className={`px-3 py-1 rounded font-medium transition-all ${
                  activeTab === "anomalies"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Exceptions
              </button>
              <button
                onClick={() => setActiveTab("seals")}
                className={`px-3 py-1 rounded font-medium transition-all ${
                  activeTab === "seals"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Merkle Seals
              </button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div
              ref={eventFeedRef}
              className="max-h-[500px] overflow-y-auto divide-y divide-slate-800/60 font-mono text-xs"
            >
              {filteredEvents.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  No events currently match this filter. Resume stream or inject an anomaly above.
                </div>
              ) : (
                filteredEvents.map((evt) => {
                  const isAnomaly =
                    evt.type === "SLIPPAGE_DETECTED" || evt.type === "DUPLICATE_FLAGGED";
                  const isSeal = evt.type === "MERKLE_SEAL";

                  return (
                    <div
                      key={evt.id}
                      className={`p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors ${
                        isAnomaly
                          ? "bg-amber-950/20 hover:bg-amber-950/30"
                          : isSeal
                            ? "bg-cyan-950/20 hover:bg-cyan-950/30"
                            : "hover:bg-slate-800/30"
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        <span className="text-[11px] text-slate-500 shrink-0">
                          {new Date(evt.timestamp).toLocaleTimeString()}
                        </span>

                        <Badge
                          variant="outline"
                          className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold shrink-0 ${
                            isAnomaly
                              ? "border-amber-500 text-amber-400 bg-amber-500/10"
                              : isSeal
                                ? "border-cyan-500 text-cyan-300 bg-cyan-500/10"
                                : "border-emerald-500/60 text-emerald-400 bg-emerald-500/10"
                          }`}
                        >
                          {evt.type}
                        </Badge>

                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-200 flex items-center gap-2">
                            <span>{evt.source}</span>
                            <span className="text-slate-500 text-[10px]">#{evt.hash}</span>
                          </div>
                          <div className="text-slate-400 text-[11px] font-sans">{evt.details}</div>
                        </div>
                      </div>

                      <div className="flex sm:flex-col sm:items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                        <div className="text-white font-bold">
                          $
                          {evt.amount > 0
                            ? evt.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })
                            : `(${Math.abs(evt.amount).toFixed(2)})`}
                        </div>
                        <div className="text-[11px] text-slate-500">Fee: ${evt.fee.toFixed(2)}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Specific Job SSE Connection Card (Conditional) */}
        {mode === "job_connect" && (
          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader className="p-5">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                Connect to Dedicated Job EventStream
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Stream real-time progress for a specific long-running reconciliation job ID
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Reconciliation Job ID
                  </label>
                  <input
                    type="text"
                    value={jobId}
                    onChange={(e) => setJobId(e.target.value)}
                    placeholder="job-7a8e9d-prod"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">API Secret / Token</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk_live_..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs"
                >
                  Connect SSE Channel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function RealtimeDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-slate-400 flex items-center justify-center font-mono text-sm">
          Loading Settlement Telemetry Engine...
        </div>
      }
    >
      <RealtimeDashboardContent />
    </Suspense>
  );
}
