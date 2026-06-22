"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight,
  ArrowLeft,
  Upload,
  Zap,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  RefreshCw,
  Hash,
  Eye,
  Sparkles,
} from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { stepTransition, staggerContainer, staggerItem, fadeUp } from "@/lib/motion/variants";

/* ─── Sample Data ─────────────────────────────────────────────── */

const SAMPLE_SOURCE: Transaction[] = [
  {
    id: "TXN-001",
    date: "2025-06-01",
    description: "Acme Corp — Invoice #1042",
    amount: 2500.0,
    source: "Stripe",
  },
  {
    id: "TXN-002",
    date: "2025-06-01",
    description: "Widget Labs — Sub renewal",
    amount: 199.0,
    source: "Stripe",
  },
  {
    id: "TXN-003",
    date: "2025-06-02",
    description: "Globex Inc — API usage",
    amount: 847.5,
    source: "Stripe",
  },
  {
    id: "TXN-004",
    date: "2025-06-03",
    description: "Initech — License Q2",
    amount: 4200.0,
    source: "Stripe",
  },
  {
    id: "TXN-005",
    date: "2025-06-03",
    description: "Vandelay Industries",
    amount: 125.0,
    source: "Stripe",
  },
  {
    id: "TXN-006",
    date: "2025-06-04",
    description: "Stark Enterprises — Pilot",
    amount: 15750.0,
    source: "Stripe",
  },
];

const SAMPLE_TARGET: Transaction[] = [
  {
    id: "BNK-901",
    date: "2025-06-02",
    description: "ACME CORP PAYMENT",
    amount: 2500.0,
    source: "Bank",
  },
  {
    id: "BNK-902",
    date: "2025-06-02",
    description: "WIDGET LABS RECURRING",
    amount: 199.0,
    source: "Bank",
  },
  { id: "BNK-903", date: "2025-06-03", description: "GLOBEX INC", amount: 847.5, source: "Bank" },
  {
    id: "BNK-904",
    date: "2025-06-04",
    description: "INITECH LICENSE",
    amount: 4200.0,
    source: "Bank",
  },
  { id: "BNK-905", date: "2025-06-04", description: "VANDELAY IND", amount: 124.5, source: "Bank" },
  // TXN-006 has no bank match → unmatched exception
];

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  source: string;
}

interface MatchResult {
  sourceId: string;
  targetId: string | null;
  status: "matched" | "tolerance" | "unmatched";
  confidence: number;
  amountDelta: number;
}

const MATCH_RESULTS: MatchResult[] = [
  { sourceId: "TXN-001", targetId: "BNK-901", status: "matched", confidence: 1.0, amountDelta: 0 },
  { sourceId: "TXN-002", targetId: "BNK-902", status: "matched", confidence: 1.0, amountDelta: 0 },
  { sourceId: "TXN-003", targetId: "BNK-903", status: "matched", confidence: 1.0, amountDelta: 0 },
  { sourceId: "TXN-004", targetId: "BNK-904", status: "matched", confidence: 1.0, amountDelta: 0 },
  {
    sourceId: "TXN-005",
    targetId: "BNK-905",
    status: "tolerance",
    confidence: 0.96,
    amountDelta: 0.5,
  },
  { sourceId: "TXN-006", targetId: null, status: "unmatched", confidence: 0, amountDelta: 15750.0 },
];

const PROOF_HASH =
  "sha256:e3b0c44298fc1c149afbf4c8996fb924...a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a";
const RUN_ID = "run_01J8K7XMQY4DGN3VBR50FZWP6H";

/* ─── Steps ───────────────────────────────────────────────────── */

const TOUR_STEPS = [
  {
    id: 1,
    title: "Your Data",
    icon: Upload,
    description: "See sample transaction data from two sources",
  },
  { id: 2, title: "Match", icon: Zap, description: "Run deterministic reconciliation matching" },
  { id: 3, title: "Results", icon: Eye, description: "Review matches, tolerances, and exceptions" },
  { id: 4, title: "Evidence", icon: FileCheck, description: "Inspect the hash-linked proofpack" },
  { id: 5, title: "Get Started", icon: Sparkles, description: "Start reconciling your own data" },
];

/* ─── Component ───────────────────────────────────────────────── */

export default function TourPage() {
  const [step, setStep] = useState(1);
  const [isMatching, setIsMatching] = useState(false);
  const [matchComplete, setMatchComplete] = useState(false);
  const [matchProgress, setMatchProgress] = useState(0);

  const progress = (step / TOUR_STEPS.length) * 100;

  const runMatching = useCallback(() => {
    setIsMatching(true);
    setMatchProgress(0);

    const interval = setInterval(() => {
      setMatchProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsMatching(false);
          setMatchComplete(true);
          return 100;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 120);
  }, []);

  const nextStep = () => {
    if (step < TOUR_STEPS.length) setStep(step + 1);
  };
  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const matchStats = useMemo(() => {
    const matched = MATCH_RESULTS.filter((r) => r.status === "matched").length;
    const tolerance = MATCH_RESULTS.filter((r) => r.status === "tolerance").length;
    const unmatched = MATCH_RESULTS.filter((r) => r.status === "unmatched").length;
    const total = MATCH_RESULTS.length;
    return {
      matched,
      tolerance,
      unmatched,
      total,
      rate: (((matched + tolerance) / total) * 100).toFixed(1),
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-16">
        {/* Hero Header */}
        <div className="relative overflow-hidden border-b border-border/40 bg-gradient-to-br from-primary/5 via-background to-blue-50/30 dark:to-blue-950/10">
          <div className="absolute inset-0 bg-grid-white/[0.03] [mask-image:radial-gradient(white,transparent_85%)]" />
          <div className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="text-center"
            >
              <motion.div variants={staggerItem}>
                <Badge
                  variant="outline"
                  className="mb-4 text-xs font-bold uppercase tracking-widest"
                >
                  Interactive Tour — No Account Required
                </Badge>
              </motion.div>
              <motion.h1
                variants={staggerItem}
                className="text-3xl sm:text-4xl font-bold tracking-tight mb-3"
              >
                See Settler in 60 Seconds
              </motion.h1>
              <motion.p
                variants={staggerItem}
                className="text-lg text-muted-foreground max-w-2xl mx-auto"
              >
                Watch real reconciliation happen. Sample data in, matched results out, hash-linked
                evidence generated. All deterministic.
              </motion.p>
            </motion.div>
          </div>
        </div>

        {/* Step Progress */}
        <div className="sticky top-16 z-30 bg-background/95 backdrop-blur border-b border-border/40">
          <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              {TOUR_STEPS.map((s) => {
                const Icon = s.icon;
                const isActive = s.id === step;
                const isComplete = s.id < step;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      if (s.id <= step || (s.id === 3 && matchComplete)) setStep(s.id);
                    }}
                    className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                      isActive
                        ? "text-primary"
                        : isComplete
                          ? "text-green-600 dark:text-green-400"
                          : "text-muted-foreground/50"
                    }`}
                  >
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all ${
                        isActive
                          ? "border-primary bg-primary text-primary-foreground"
                          : isComplete
                            ? "border-green-500 bg-green-500 text-white"
                            : "border-muted-foreground/30"
                      }`}
                    >
                      {isComplete ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Icon className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <span className="hidden sm:inline">{s.title}</span>
                  </button>
                );
              })}
              <div className="flex-1" />
              <span className="text-xs text-muted-foreground font-mono">
                Step {step}/{TOUR_STEPS.length}
              </span>
            </div>
            <Progress value={progress} className="mt-2 h-1" />
          </div>
        </div>

        {/* Step Content */}
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 min-h-[500px]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step-1"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={stepTransition}
              >
                <StepDataPreview onNext={nextStep} />
              </motion.div>
            )}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={stepTransition}
              >
                <StepMatch
                  isMatching={isMatching}
                  matchComplete={matchComplete}
                  matchProgress={matchProgress}
                  onRunMatching={runMatching}
                  onNext={nextStep}
                />
              </motion.div>
            )}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={stepTransition}
              >
                <StepResults stats={matchStats} onNext={nextStep} />
              </motion.div>
            )}
            {step === 4 && (
              <motion.div
                key="step-4"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={stepTransition}
              >
                <StepEvidence onNext={nextStep} />
              </motion.div>
            )}
            {step === 5 && (
              <motion.div
                key="step-5"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={stepTransition}
              >
                <StepCTA />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-border/40">
            <Button variant="ghost" onClick={prevStep} disabled={step === 1} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            {step < TOUR_STEPS.length && (
              <Button onClick={nextStep} disabled={step === 2 && !matchComplete} className="gap-2">
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

/* ─── Step Components ─────────────────────────────────────────── */

function StepDataPreview({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Two Data Sources, One Truth</h2>
        <p className="text-muted-foreground">
          Below are 6 transactions from Stripe and 5 deposits from a bank feed. Settler will match
          them deterministically.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DataTable title="Source: Stripe Payments" data={SAMPLE_SOURCE} accent="blue" />
        <DataTable title="Target: Bank Deposits" data={SAMPLE_TARGET} accent="green" />
      </div>

      <motion.div variants={fadeUp} className="text-center pt-4">
        <p className="text-sm text-muted-foreground mb-4">
          Notice: 6 source transactions, only 5 target deposits. One has a $0.50 amount difference.
          Let&apos;s see what Settler finds.
        </p>
        <Button onClick={onNext} size="lg" className="gap-2">
          Run Reconciliation <Zap className="h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  );
}

function StepMatch({
  isMatching,
  matchComplete,
  matchProgress,
  onRunMatching,
  onNext,
}: {
  isMatching: boolean;
  matchComplete: boolean;
  matchProgress: number;
  onRunMatching: () => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Deterministic Matching Engine</h2>
        <p className="text-muted-foreground">
          Settler applies configurable tolerance rules (amount: ±$1.00, date: ±2 days, fuzzy name
          matching) to find matches.
        </p>
      </div>

      <Card className="max-w-lg mx-auto border-2 border-dashed border-primary/30">
        <CardContent className="p-8 text-center">
          {!isMatching && !matchComplete && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">Ready to Match</h3>
              <p className="text-sm text-muted-foreground mb-6">
                6 source records × 5 target records. Amount tolerance: ±$1.00. Date window: ±2 days.
              </p>
              <Button onClick={onRunMatching} size="lg" className="gap-2">
                <Zap className="h-4 w-4" /> Execute Reconciliation
              </Button>
            </motion.div>
          )}

          {isMatching && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="h-8 w-8 text-primary animate-spin" />
              </div>
              <h3 className="text-lg font-bold mb-2">Matching…</h3>
              <Progress value={Math.min(matchProgress, 100)} className="mb-2" />
              <p className="text-xs text-muted-foreground font-mono">
                Comparing records, applying tolerance rules, generating evidence hashes…
              </p>
            </motion.div>
          )}

          {matchComplete && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-bold mb-1 text-green-700 dark:text-green-300">
                Reconciliation Complete
              </h3>
              <p className="text-sm text-muted-foreground mb-1">
                4 exact matches · 1 tolerance match · 1 unmatched exception
              </p>
              <p className="text-xs text-muted-foreground font-mono mb-4">Run ID: {RUN_ID}</p>
              <Button onClick={onNext} size="lg" className="gap-2">
                View Results <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StepResults({ stats, onNext }: { stats: ReturnType<typeof Object>; onNext: () => void }) {
  const s = stats as {
    matched: number;
    tolerance: number;
    unmatched: number;
    total: number;
    rate: string;
  };
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Reconciliation Results</h2>
        <p className="text-muted-foreground">
          Every outcome is deterministic. Same inputs will always produce these exact results.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatMini label="Match Rate" value={`${s.rate}%`} tone="success" />
        <StatMini label="Exact Matches" value={String(s.matched)} tone="success" />
        <StatMini label="Tolerance" value={String(s.tolerance)} tone="warning" />
        <StatMini label="Exceptions" value={String(s.unmatched)} tone="danger" />
      </div>

      {/* Match Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Match Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    Source
                  </th>
                  <th className="pb-2 font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    Target
                  </th>
                  <th className="pb-2 font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="pb-2 font-bold text-xs uppercase tracking-wider text-muted-foreground text-right">
                    Confidence
                  </th>
                  <th className="pb-2 font-bold text-xs uppercase tracking-wider text-muted-foreground text-right">
                    Δ Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {MATCH_RESULTS.map((r) => (
                  <tr key={r.sourceId} className="border-b border-border/30 last:border-0">
                    <td className="py-2.5 font-mono text-xs">{r.sourceId}</td>
                    <td className="py-2.5 font-mono text-xs">{r.targetId || "—"}</td>
                    <td className="py-2.5">
                      <Badge
                        variant={
                          r.status === "matched"
                            ? "success"
                            : r.status === "tolerance"
                              ? "warning"
                              : "destructive"
                        }
                        className="text-[10px] font-bold uppercase"
                      >
                        {r.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 text-right font-mono text-xs">
                      {r.confidence > 0 ? `${(r.confidence * 100).toFixed(0)}%` : "—"}
                    </td>
                    <td className="py-2.5 text-right font-mono text-xs">
                      {r.amountDelta > 0 ? (
                        <span
                          className={
                            r.status === "unmatched"
                              ? "text-red-600 dark:text-red-400"
                              : "text-amber-600 dark:text-amber-400"
                          }
                        >
                          ${r.amountDelta.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-green-600 dark:text-green-400">$0.00</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-4">
          <strong>TXN-005</strong> matched within $0.50 tolerance. <strong>TXN-006</strong>{" "}
          ($15,750) has no bank deposit — flagged for operator review.
        </p>
        <Button onClick={onNext} size="lg" className="gap-2">
          View Evidence Proofpack <FileCheck className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function StepEvidence({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Hash-Linked Evidence Proofpack</h2>
        <p className="text-muted-foreground">
          Every run produces a cryptographically verifiable evidence bundle. Auditors can verify
          this offline.
        </p>
      </div>

      <Card className="border-primary/20 bg-primary/[0.02]">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Proofpack Manifest</CardTitle>
              <p className="text-xs text-muted-foreground font-mono">{RUN_ID}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-slate-950 p-4 text-green-400 font-mono text-xs overflow-x-auto">
            <pre>{`{
  "version": "1.0.0",
  "run_id": "${RUN_ID}",
  "timestamp": "2025-06-04T14:32:07.442Z",
  "deterministic": true,
  "inputs": {
    "source_records": 6,
    "target_records": 5,
    "tolerance_amount": 1.00,
    "tolerance_date_days": 2
  },
  "outputs": {
    "matched": 4,
    "tolerance_matched": 1,
    "unmatched": 1,
    "match_rate": 0.833
  },
  "evidence_chain": [
    {
      "step": "ingest",
      "hash": "sha256:a1b2c3d4e5f6..."
    },
    {
      "step": "normalize",
      "hash": "sha256:f6e5d4c3b2a1..."
    },
    {
      "step": "match",
      "hash": "sha256:1a2b3c4d5e6f..."
    },
    {
      "step": "evidence_emit",
      "hash": "sha256:6f5e4d3c2b1a..."
    }
  ],
  "content_hash": "${PROOF_HASH}"
}`}</pre>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-border/40 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Hash className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Content Hash
                </span>
              </div>
              <p className="text-xs font-mono text-foreground truncate">sha256:e3b0c44…f8434a</p>
            </div>
            <div className="rounded-lg border border-border/40 p-3">
              <div className="flex items-center gap-2 mb-1">
                <RefreshCw className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Replay Parity
                </span>
              </div>
              <p className="text-xs font-bold text-green-600 dark:text-green-400">
                100% — Deterministic
              </p>
            </div>
            <div className="rounded-lg border border-border/40 p-3">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Chain Integrity
                </span>
              </div>
              <p className="text-xs font-bold text-green-600 dark:text-green-400">
                4/4 steps verified
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-4">
          This proofpack can be downloaded, stored, and verified offline. Replay the run at any time
          to confirm determinism.
        </p>
        <Button onClick={onNext} size="lg" className="gap-2">
          Get Started with Your Data <Sparkles className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function StepCTA() {
  return (
    <div className="text-center py-8 space-y-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", bounce: 0.4 }}
      >
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center mx-auto mb-6 shadow-2xl">
          <CheckCircle2 className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold mb-3">That&apos;s Settler</h2>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
          Deterministic matching. Hash-linked evidence. Operator-grade exception review. Now imagine
          this running on
          <strong> your</strong> transaction data, every day, automatically.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
        <Card className="border-primary/20 hover:border-primary/50 transition-colors">
          <CardContent className="p-6 text-center">
            <Zap className="h-6 w-6 text-primary mx-auto mb-2" />
            <h3 className="font-bold text-sm mb-1">Start Free Trial</h3>
            <p className="text-xs text-muted-foreground mb-3">14 days, 500 txn/month</p>
            <Button asChild size="sm" className="w-full">
              <Link href="/signup">Sign Up Free</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="border-border/40 hover:border-primary/30 transition-colors">
          <CardContent className="p-6 text-center">
            <Eye className="h-6 w-6 text-primary mx-auto mb-2" />
            <h3 className="font-bold text-sm mb-1">Explore Demo</h3>
            <p className="text-xs text-muted-foreground mb-3">Full console, sample data</p>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/demo/console">Open Console</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="border-border/40 hover:border-primary/30 transition-colors">
          <CardContent className="p-6 text-center">
            <ShieldCheck className="h-6 w-6 text-primary mx-auto mb-2" />
            <h3 className="font-bold text-sm mb-1">Enterprise</h3>
            <p className="text-xs text-muted-foreground mb-3">SSO, SLA, custom deploy</p>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/contact">Talk to Us</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ─── Shared UI ───────────────────────────────────────────────── */

function DataTable({
  title,
  data,
  accent,
}: {
  title: string;
  data: Transaction[];
  accent: "blue" | "green";
}) {
  const borderClass =
    accent === "blue"
      ? "border-blue-200 dark:border-blue-900"
      : "border-green-200 dark:border-green-900";
  const bgClass =
    accent === "blue" ? "bg-blue-50/50 dark:bg-blue-950/20" : "bg-green-50/50 dark:bg-green-950/20";
  return (
    <Card className={`${borderClass} ${bgClass}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">{data.length} records</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="pb-1.5 text-left font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                  ID
                </th>
                <th className="pb-1.5 text-left font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                  Date
                </th>
                <th className="pb-1.5 text-left font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                  Description
                </th>
                <th className="pb-1.5 text-right font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} className="border-b border-border/20 last:border-0">
                  <td className="py-1.5 font-mono">{row.id}</td>
                  <td className="py-1.5">{row.date}</td>
                  <td className="py-1.5 truncate max-w-[150px]">{row.description}</td>
                  <td className="py-1.5 text-right font-mono">
                    ${row.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function StatMini({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "warning" | "danger";
}) {
  const toneClasses = {
    success: "text-green-600 dark:text-green-400",
    warning: "text-amber-600 dark:text-amber-400",
    danger: "text-red-600 dark:text-red-400",
  };
  return (
    <Card className="border-border/40">
      <CardContent className="p-4 text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
          {label}
        </p>
        <p className={`text-2xl font-bold font-mono ${toneClasses[tone]}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
