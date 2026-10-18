"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  History,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Clock,
  ArrowRight,
  TrendingUp,
  Database,
  Hash,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AccountState {
  accountId: string;
  name: string;
  type: string;
  debitsPosted: string;
  creditsPosted: string;
  debitsPending: string;
  creditsPending: string;
  netBalanceCents: number;
  smtLeafHash: string;
}

interface TransferEvent {
  id: string;
  timestamp: string;
  debitAccountId: string;
  creditAccountId: string;
  amountCents: string;
  currency: string;
  flags: {
    pending?: boolean;
    postPendingTransfer?: boolean;
    voidPendingTransfer?: boolean;
  };
  resultingStateRoot: string;
}

interface HistoricalLedgerState {
  tenantId: string;
  asOfTimestamp: string;
  asOfEpoch: number;
  totalPostedDebitsCents: string;
  totalPostedCreditsCents: string;
  totalPendingDebitsCents: string;
  totalPendingCreditsCents: string;
  isDoubleEntryBalanced: boolean;
  isTwoPhaseBalanced: boolean;
  driftDetected: boolean;
  driftMagnitudeCents: number;
  smtStateRoot: string;
  accountCount: number;
  accounts: AccountState[];
  precedingTransfer?: TransferEvent;
}

interface TimelineStep {
  stepIndex: number;
  timestamp: string;
  epoch: number;
  stateRoot: string;
  transferId?: string;
  debitAccountId?: string;
  creditAccountId?: string;
  amountCents?: string;
  description: string;
  isBalanced: boolean;
  hasDiscrepancy: boolean;
}

export function TimeTravelDebuggerWorkbench() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [copiedRoot, setCopiedRoot] = useState(false);
  const [copiedLeaf, setCopiedLeaf] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Replay steps
  const [steps] = useState<TimelineStep[]>([
    {
      stepIndex: 0,
      timestamp: "2026-10-18T18:50:00.000Z",
      epoch: 0,
      stateRoot: "0x0000000000000000000000000000000000000000000000000000000000000000",
      description: "Genesis Baseline Ledger",
      isBalanced: true,
      hasDiscrepancy: false,
    },
    {
      stepIndex: 1,
      timestamp: "2026-10-18T18:51:00.000Z",
      epoch: 1,
      stateRoot: "0x1a8f9b23c4019283746501928374650192837465019283746501928374650192",
      transferId: "tr_seed_01",
      debitAccountId: "1020",
      creditAccountId: "4010",
      amountCents: "1000000",
      description: "Checkout Inflow: Stripe Clearing -> Gross Revenue ($10,000.00)",
      isBalanced: true,
      hasDiscrepancy: false,
    },
    {
      stepIndex: 2,
      timestamp: "2026-10-18T18:52:00.000Z",
      epoch: 2,
      stateRoot: "0x2b9f8a34d5120394857612039485761203948576120394857612039485761203",
      transferId: "tr_seed_02",
      debitAccountId: "5010",
      creditAccountId: "1020",
      amountCents: "29000",
      description: "Interchange Fee Deduction: Fee Expense -> Stripe Clearing ($290.00)",
      isBalanced: true,
      hasDiscrepancy: false,
    },
    {
      stepIndex: 3,
      timestamp: "2026-10-18T18:53:00.000Z",
      epoch: 3,
      stateRoot: "0x3c0e7b45e6231405968723140596872314059687231405968723140596872314",
      transferId: "tr_seed_03",
      debitAccountId: "1010",
      creditAccountId: "1020",
      amountCents: "971000",
      description: "Stripe Treasury Payout -> Chase Operating Cash ($9,710.00)",
      isBalanced: true,
      hasDiscrepancy: false,
    },
    {
      stepIndex: 4,
      timestamp: "2026-10-18T18:54:00.000Z",
      epoch: 4,
      stateRoot: "0x4d1f8c56f7342516079834251607983425160798342516079834251607983425",
      transferId: "tr_seed_04",
      debitAccountId: "2010",
      creditAccountId: "1010",
      amountCents: "250000",
      description: "Two-Phase Vendor Escrow Reservation ($2,500.00 pending)",
      isBalanced: true,
      hasDiscrepancy: false,
    },
    {
      stepIndex: 5,
      timestamp: "2026-10-18T18:55:00.000Z",
      epoch: 5,
      stateRoot: "0x7a9c3b88f21e05d21498c603125ab4430f81d9f041235bc6e9112458acde9231",
      transferId: "tr_seed_05",
      debitAccountId: "2010",
      creditAccountId: "1010",
      amountCents: "250000",
      description: "Two-Phase Vendor Escrow Posted Finalization ($2,500.00 posted)",
      isBalanced: true,
      hasDiscrepancy: false,
    },
  ]);

  // Current microsecond state
  const [currentState, setCurrentState] = useState<HistoricalLedgerState>({
    tenantId: "00000000-0000-4000-8000-000000000001",
    asOfTimestamp: "2026-10-18T18:55:00.000Z",
    asOfEpoch: 5,
    totalPostedDebitsCents: "1250000",
    totalPostedCreditsCents: "1250000",
    totalPendingDebitsCents: "0",
    totalPendingCreditsCents: "0",
    isDoubleEntryBalanced: true,
    isTwoPhaseBalanced: true,
    driftDetected: false,
    driftMagnitudeCents: 0,
    smtStateRoot: "0x7a9c3b88f21e05d21498c603125ab4430f81d9f041235bc6e9112458acde9231",
    accountCount: 6,
    accounts: [
      {
        accountId: "1010",
        name: "Operating Cash (Chase Treasury)",
        type: "asset",
        debitsPosted: "971000",
        creditsPosted: "250000",
        debitsPending: "0",
        creditsPending: "0",
        netBalanceCents: 721000,
        smtLeafHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      },
      {
        accountId: "1020",
        name: "Stripe Settlement Clearing",
        type: "asset",
        debitsPosted: "1000000",
        creditsPosted: "1000000",
        debitsPending: "0",
        creditsPending: "0",
        netBalanceCents: 0,
        smtLeafHash: "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
      },
      {
        accountId: "4010",
        name: "Gross Merchant Revenue",
        type: "revenue",
        debitsPosted: "0",
        creditsPosted: "1000000",
        debitsPending: "0",
        creditsPending: "0",
        netBalanceCents: 1000000,
        smtLeafHash: "4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce",
      },
      {
        accountId: "5010",
        name: "Card Processing & Interchange Fees",
        type: "expense",
        debitsPosted: "29000",
        creditsPosted: "0",
        debitsPending: "0",
        creditsPending: "0",
        netBalanceCents: 29000,
        smtLeafHash: "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
      },
      {
        accountId: "2010",
        name: "Accounts Payable Clearing",
        type: "liability",
        debitsPosted: "250000",
        creditsPosted: "250000",
        debitsPending: "0",
        creditsPending: "0",
        netBalanceCents: 0,
        smtLeafHash: "ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d",
      },
    ],
    precedingTransfer: {
      id: "tr_seed_05",
      timestamp: "2026-10-18T18:55:00.000Z",
      debitAccountId: "2010",
      creditAccountId: "1010",
      amountCents: "250000",
      currency: "USD",
      flags: { postPendingTransfer: true },
      resultingStateRoot: "0x7a9c3b88f21e05d21498c603125ab4430f81d9f041235bc6e9112458acde9231",
    },
  });

  // Replay interval timer
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1500 / playbackSpeed);
    } else {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, playbackSpeed, steps.length]);

  // Sync state when step changes
  useEffect(() => {
    const activeStep = steps[currentStepIndex];
    if (activeStep) {
      fetchHistoricalState(activeStep.timestamp);
    }
  }, [currentStepIndex]);

  const fetchHistoricalState = async (timestamp: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/console/time-travel?asOf=${encodeURIComponent(timestamp)}`);
      if (res.ok) {
        const body = await res.json();
        if (body.data) {
          setCurrentState(body.data);
        }
      }
    } catch {
      // Keep deterministic state
    } finally {
      setLoading(false);
    }
  };

  const handleCopyRoot = () => {
    navigator.clipboard.writeText(currentState.smtStateRoot);
    setCopiedRoot(true);
    setTimeout(() => setCopiedRoot(false), 2000);
  };

  const handleCopyLeaf = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedLeaf(hash);
    setTimeout(() => setCopiedLeaf(null), 2000);
  };

  const formatCurrency = (cents: number | string) => {
    const val = typeof cents === "string" ? parseInt(cents, 10) : cents;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format((val || 0) / 100);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <History className="h-6 w-6 text-cyan-400" />
              Time-Travel Forensic Financial Debugger
            </h1>
            <Badge variant="outline" className="border-cyan-500/40 text-cyan-400 bg-cyan-950/20">
              SMT-256 Microsecond Flight Recorder
            </Badge>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Reconstruct and inspect exact microsecond financial balance sheets, TigerBeetle
            double-entry postings, and Sparse Merkle Tree state transitions at any epoch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={
              currentState.isDoubleEntryBalanced
                ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-400 px-3 py-1 font-mono text-xs flex items-center gap-1.5"
                : "border-red-500/40 bg-red-950/20 text-red-400 px-3 py-1 font-mono text-xs flex items-center gap-1.5"
            }
          >
            {currentState.isDoubleEntryBalanced ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
            )}
            {currentState.isDoubleEntryBalanced ? "ZERO-SUM BALANCED" : "DRIFT DETECTED"}
          </Badge>
        </div>
      </div>

      {/* Scrubber Control Center */}
      <Card className="border-zinc-800 bg-zinc-950/70 backdrop-blur-md">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-cyan-400" />
                Historical Epoch Scrubber
                {loading && (
                  <Badge
                    variant="outline"
                    className="border-cyan-500/30 text-cyan-400 text-[10px] animate-pulse font-mono"
                  >
                    SYNCING...
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Microsecond timeline scrub step {currentStepIndex + 1} of {steps.length} — Epoch #
                {currentState.asOfEpoch}
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-200"
                onClick={() => setCurrentStepIndex(0)}
                disabled={currentStepIndex === 0}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Genesis
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-200"
                onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentStepIndex === 0}
              >
                <SkipBack className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="default"
                size="sm"
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-3.5 w-3.5 mr-1" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 mr-1" /> Replay
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-200"
                onClick={() => setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1))}
                disabled={currentStepIndex === steps.length - 1}
              >
                <SkipForward className="h-3.5 w-3.5" />
              </Button>

              <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-md p-0.5 text-xs">
                {[1, 5, 10].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setPlaybackSpeed(speed)}
                    className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                      playbackSpeed === speed
                        ? "bg-cyan-500/20 text-cyan-300 font-bold"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Timeline Range Slider */}
          <div className="space-y-2">
            <input
              type="range"
              min={0}
              max={steps.length - 1}
              value={currentStepIndex}
              onChange={(e) => {
                setIsPlaying(false);
                setCurrentStepIndex(parseInt(e.target.value, 10));
              }}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-xs font-mono text-zinc-400">
              <span>{steps[0]?.timestamp}</span>
              <span className="text-cyan-400 font-semibold">{currentState.asOfTimestamp}</span>
              <span>{steps[steps.length - 1]?.timestamp}</span>
            </div>
          </div>

          {/* SMT State Root Bar */}
          <div className="p-3 rounded-lg border border-cyan-500/20 bg-cyan-950/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-hidden">
              <Hash className="h-4 w-4 text-cyan-400 shrink-0" />
              <div className="text-xs">
                <span className="text-zinc-400 mr-2">Deterministic SMT State Root:</span>
                <span className="font-mono text-cyan-300 break-all select-all font-semibold">
                  {currentState.smtStateRoot}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyRoot}
              className="h-7 text-xs text-zinc-300 hover:text-white shrink-0"
            >
              {copiedRoot ? (
                <>
                  <Check className="h-3 w-3 mr-1 text-emerald-400" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" /> Copy Root
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dual Ledger Balance & Invariants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-zinc-800 bg-zinc-950/60">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs text-zinc-400">
              TigerBeetle Posted Debits
            </CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-emerald-400">
              {formatCurrency(currentState.totalPostedDebitsCents)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-zinc-500 font-mono">
            {currentState.totalPostedDebitsCents} minor units
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-950/60">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs text-zinc-400">
              TigerBeetle Posted Credits
            </CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-emerald-400">
              {formatCurrency(currentState.totalPostedCreditsCents)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-zinc-500 font-mono">
            {currentState.totalPostedCreditsCents} minor units
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-950/60">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs text-zinc-400">
              Pending Two-Phase Escrow
            </CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-zinc-200">
              {formatCurrency(currentState.totalPendingDebitsCents)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-zinc-500 font-mono">
            {currentState.isTwoPhaseBalanced ? "Phase In-Sync" : "Pending Phase Skew"}
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-950/60">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs text-zinc-400">
              Deterministic Drift Delta
            </CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-zinc-100">
              {currentState.driftMagnitudeCents === 0
                ? "$0.00"
                : formatCurrency(currentState.driftMagnitudeCents)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-zinc-500 font-mono">
            {currentState.driftMagnitudeCents === 0 ? "Zero Float Drift" : "Variance Flagged"}
          </CardContent>
        </Card>
      </div>

      {/* Main Historical Account Balance Sheet */}
      <Card className="border-zinc-800 bg-zinc-950/60">
        <CardHeader className="pb-3 border-b border-zinc-800/80">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <Database className="h-4 w-4 text-cyan-400" />
                Historical General Ledger Balance Sheet
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Exact account ledger postings and SMT-256 leaf commitments at microsecond epoch
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs font-mono">
              {currentState.accounts.length} active accounts
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/40 text-zinc-400 font-mono">
                  <th className="py-2.5 px-4 font-semibold">Account</th>
                  <th className="py-2.5 px-4 font-semibold">Type</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Posted Debits</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Posted Credits</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Net Balance</th>
                  <th className="py-2.5 px-4 font-semibold">SMT Leaf Hash (SHA-256)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {currentState.accounts.map((acc) => (
                  <tr key={acc.accountId} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-zinc-200">{acc.name}</div>
                      <div className="text-zinc-500 font-mono text-[11px]">GL: {acc.accountId}</div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant="outline"
                        className={
                          acc.type === "asset"
                            ? "border-emerald-500/30 text-emerald-400 bg-emerald-950/10 text-[10px]"
                            : acc.type === "revenue"
                              ? "border-cyan-500/30 text-cyan-400 bg-cyan-950/10 text-[10px]"
                              : acc.type === "expense"
                                ? "border-amber-500/30 text-amber-400 bg-amber-950/10 text-[10px]"
                                : "border-purple-500/30 text-purple-400 bg-purple-950/10 text-[10px]"
                        }
                      >
                        {acc.type.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-zinc-300">
                      {formatCurrency(acc.debitsPosted)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-zinc-300">
                      {formatCurrency(acc.creditsPosted)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      {formatCurrency(acc.netBalanceCents)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-400">
                        <span className="truncate max-w-[140px]">{acc.smtLeafHash}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 text-zinc-500 hover:text-white"
                          onClick={() => handleCopyLeaf(acc.smtLeafHash)}
                        >
                          {copiedLeaf === acc.smtLeafHash ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Preceding State Transition Event */}
      {currentState.precedingTransfer && (
        <Card className="border-zinc-800 bg-zinc-950/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-cyan-400" />
              State Transition Trigger (Microsecond Delta)
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              The exact double-entry transfer event that produced this Sparse Merkle Tree state root
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex flex-wrap items-center gap-3 p-3 rounded-md bg-zinc-900/60 border border-zinc-800 font-mono">
              <span className="text-cyan-400 font-bold">{currentState.precedingTransfer.id}</span>
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-300">{currentState.precedingTransfer.timestamp}</span>
              <span className="text-zinc-500">•</span>
              <div className="flex items-center gap-1.5 text-zinc-200">
                <span>Account {currentState.precedingTransfer.debitAccountId}</span>
                <ArrowRight className="h-3 w-3 text-cyan-400" />
                <span>Account {currentState.precedingTransfer.creditAccountId}</span>
              </div>
              <span className="text-zinc-500">•</span>
              <span className="text-emerald-400 font-bold">
                {formatCurrency(currentState.precedingTransfer.amountCents)}
              </span>
              {currentState.precedingTransfer.flags?.pending && (
                <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-[10px]">
                  PENDING
                </Badge>
              )}
              {currentState.precedingTransfer.flags?.postPendingTransfer && (
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 text-emerald-400 text-[10px]"
                >
                  POSTED
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline Event Scrubber Log */}
      <Card className="border-zinc-800 bg-zinc-950/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
            <History className="h-4 w-4 text-cyan-400" />
            Deterministic Replay Stream Events
          </CardTitle>
          <CardDescription className="text-xs text-zinc-400">
            Click any transfer row to jump directly to that historical microsecond
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1.5 pt-1">
          {steps.map((step, idx) => (
            <div
              key={step.stepIndex}
              onClick={() => {
                setIsPlaying(false);
                setCurrentStepIndex(idx);
              }}
              className={`p-2.5 rounded-md border text-xs cursor-pointer transition-colors flex items-center justify-between ${
                idx === currentStepIndex
                  ? "bg-cyan-950/30 border-cyan-500/50 text-white"
                  : "bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900 text-zinc-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] text-zinc-500 w-6">#{step.stepIndex}</span>
                <span className="font-mono text-zinc-400 text-[11px]">{step.timestamp}</span>
                <span className="font-medium text-zinc-200">{step.description}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-zinc-500 hidden md:inline">
                  Root: {step.stateRoot.slice(0, 10)}...{step.stateRoot.slice(-6)}
                </span>
                <Badge
                  variant="outline"
                  className={
                    step.isBalanced
                      ? "border-emerald-500/30 text-emerald-400 text-[10px]"
                      : "border-red-500/30 text-red-400 text-[10px]"
                  }
                >
                  {step.isBalanced ? "BALANCED" : "DRIFT"}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
