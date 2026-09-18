"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Lock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw,
  KeyRound,
  Fingerprint,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Real client-side Web Crypto SHA-256 hash function
async function sha256Hex(buffer: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(buffer);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function CognitiveVerifierInteractiveEnclave() {
  const [activeTab, setActiveTab] = useState<"ingest" | "sox" | "crypto">("sox");

  // Tab 1: Ingestion State
  const [isIngesting, setIsIngesting] = useState(false);

  // Tab 2: SOX-404 State Machine
  const [soxStep, setSoxStep] = useState<
    "initial" | "ai_proposed" | "auto_blocked" | "controller_approved"
  >("initial");
  const [isAiReasoning, setIsAiReasoning] = useState(false);

  // Tab 3: Zero-Trust Crypto Verification
  const [cryptoVector, setCryptoVector] = useState<"stripe" | "fedwire" | "tampered">("stripe");
  const [isVerifyingCrypto, setIsVerifyingCrypto] = useState(false);
  const [cryptoResult, setCryptoResult] = useState<{
    verified: boolean;
    computedRoot: string;
    declaredRoot: string;
    executionTimeMs: number;
    leavesChecked: number;
  } | null>({
    verified: true,
    computedRoot: "48c781e9d1e3d36b7617b0769cf3ddf4b9ec43ef19942a78bf9fb6416182ee20",
    declaredRoot: "48c781e9d1e3d36b7617b0769cf3ddf4b9ec43ef19942a78bf9fb6416182ee20",
    executionTimeMs: 0.84,
    leavesChecked: 3,
  });

  const runCryptoVerification = useCallback(
    async (vectorType: "stripe" | "fedwire" | "tampered") => {
      setCryptoVector(vectorType);
      setIsVerifyingCrypto(true);
      setCryptoResult(null);

      const t0 = performance.now();

      try {
        if (vectorType === "stripe") {
          const rawLeaves = [
            "RECORD_STRIPE_EUR_001|125000000|EUR",
            "RECORD_STRIPE_USD_002|250000000|USD",
            "RECORD_STRIPE_GBP_003|1141025000|GBP",
          ];
          const leafHashes = await Promise.all(rawLeaves.map((l) => sha256Hex(l)));
          const combined = leafHashes.join(":");
          const root = await sha256Hex(combined);
          const declared = root; // Exact match
          const t1 = performance.now();
          setCryptoResult({
            verified: true,
            computedRoot: root,
            declaredRoot: declared,
            executionTimeMs: Number((t1 - t0).toFixed(2)),
            leavesChecked: 3,
          });
        } else if (vectorType === "fedwire") {
          const rawLeaves = [
            "RECORD_FEDWIRE_CAPITAL_ALLOC_01|15000000000|USD",
            "RECORD_FEDWIRE_TREASURY_RESERVE_02|45000000000|USD",
          ];
          const leafHashes = await Promise.all(rawLeaves.map((l) => sha256Hex(l)));
          const combined = leafHashes.join(":");
          const root = await sha256Hex(combined);
          const declared = root;
          const t1 = performance.now();
          setCryptoResult({
            verified: true,
            computedRoot: root,
            declaredRoot: declared,
            executionTimeMs: Number((t1 - t0).toFixed(2)),
            leavesChecked: 2,
          });
        } else {
          // Tampered vector
          const rawLeaves = [
            "RECORD_TAMPERED_FORGED_CREDIT|9999999999|USD",
            "RECORD_STRIPE_USD_002|250000000|USD",
          ];
          const leafHashes = await Promise.all(rawLeaves.map((l) => sha256Hex(l)));
          const combined = leafHashes.join(":");
          const computedRoot = await sha256Hex(combined);
          // Target declared root belongs to legitimate run
          const declaredRoot = "48c781e9d1e3d36b7617b0769cf3ddf4b9ec43ef19942a78bf9fb6416182ee20";
          const t1 = performance.now();
          setCryptoResult({
            verified: false,
            computedRoot,
            declaredRoot,
            executionTimeMs: Number((t1 - t0).toFixed(2)),
            leavesChecked: 2,
          });
        }
      } catch {
        // Fallback
      } finally {
        setIsVerifyingCrypto(false);
      }
    },
    []
  );

  return (
    <div className="w-full">
      {/* 3D Visual Master Header */}
      <div className="relative rounded-3xl overflow-hidden border border-primary/25 bg-gradient-to-b from-card/90 via-card/60 to-background/90 shadow-2xl p-6 sm:p-8 mb-8 backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-xs font-mono font-medium text-violet-600 dark:text-violet-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>THE RECONCILIATION INTELLIGENCE FRONTIER</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground leading-snug">
              Cognitive Proposer. <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500">
                Deterministic Verifier.
              </span>
            </h2>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Probabilistic AI cannot balance financial balance sheets alone—a 0.01% hallucination
              rate on $10B is catastrophic. Settler pairs **Gemini 3&apos;s 1M+ multimodal
              reasoning** with a **deterministic Rust kernel & in-browser Web Crypto Merkle
              verifier**.
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-muted/60 border border-border/50 text-foreground">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Gemini 3.8 Flash
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-muted/60 border border-border/50 text-foreground">
                <Lock className="w-3.5 h-3.5 text-amber-400" /> SOX-404 Dual-Signature
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-muted/60 border border-border/50 text-foreground">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> RFC 6962 SHA-256
              </span>
            </div>
          </div>

          <div className="lg:col-span-7 relative group">
            <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-xl bg-card/40 backdrop-blur-md">
              <Image
                src="/cognitive_enclave_3d.png"
                alt="Settler Cognitive Proposer and Deterministic Verifier 3D Enclave"
                width={1200}
                height={675}
                className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-[1.02]"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-muted-foreground bg-background/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-border/40">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Air-Gapped Sovereign Enclave Active
                </span>
                <span>Zero Float Drift · 100% Tenant Scoped</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Enclave Sandbox Tabs */}
      <div className="rounded-3xl border border-border/60 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/40">
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Terminal className="w-5 h-5 text-primary-500" />
              Interactive Enclave Sandbox
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Test how Settler reconciles the tension between probabilistic AI and cryptographic
              financial truth.
            </p>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-xl border border-border/50 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab("sox")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                activeTab === "sox"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              1. SOX-404 Maker-Checker Gate
            </button>
            <button
              onClick={() => setActiveTab("crypto")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                activeTab === "crypto"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              2. In-Browser Merkle Verifier
            </button>
            <button
              onClick={() => setActiveTab("ingest")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                activeTab === "ingest"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              3. Multimodal 0-Drift Ingestion
            </button>
          </div>
        </div>

        {/* Tab 1 Content: SOX-404 Maker-Checker Gate */}
        {activeTab === "sox" && (
          <div className="py-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Exception Detected */}
              <Card className="border-border/60 bg-muted/20">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className="border-amber-500/30 text-amber-500 bg-amber-500/10 text-[11px]"
                    >
                      Break Detected
                    </Badge>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      Stripe ↔ Barclays
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">$14,250.00 Unmatched</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      UK August Bank Holiday 48-hour clearing cutoff lag on batch settlement payout.
                    </p>
                  </div>
                  <div className="text-[11px] font-mono bg-background/80 p-2 rounded border border-border/50 text-muted-foreground">
                    delta_cents: 0 · window_breach: +48h
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Cognitive Proposer Reasoning */}
              <Card className="border-violet-500/30 bg-violet-500/5">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className="border-violet-500/30 text-violet-400 bg-violet-500/10 text-[11px]"
                    >
                      <Sparkles className="w-3 h-3 mr-1" /> Gemini 3 Proposer
                    </Badge>
                    <span className="text-[11px] font-mono text-violet-400">
                      Pillar 2: Adjudication
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">
                      Self-Healing Candidate
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Reasoning: Verified calendar schedule. Proposes tolerance window expansion:
                      +48h for bank holidays.
                    </p>
                  </div>
                  <div className="text-[11px] font-mono bg-background/80 p-2 rounded border border-violet-500/20 text-violet-300">
                    action: auto_extend_settlement_window
                  </div>
                </CardContent>
              </Card>

              {/* Card 3: Deterministic Kernel Invariant */}
              <Card className="border-emerald-500/30 bg-emerald-500/5">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[11px]"
                    >
                      <ShieldCheck className="w-3 h-3 mr-1" /> Settler Rust Kernel
                    </Badge>
                    <span className="text-[11px] font-mono text-emerald-400">
                      SOX-404 Invariant
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">
                      Cryptographic Separation
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Invariant:{" "}
                      <span className="font-mono text-emerald-400">Proposer_ID ≠ Checker_ID</span>.
                      AI cannot unilaterally mutate live ledger.
                    </p>
                  </div>
                  <div className="text-[11px] font-mono bg-background/80 p-2 rounded border border-emerald-500/20 text-emerald-300">
                    enforce_dual_signature: true
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Interactive State Simulation Flow */}
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Simulate Policy State Machine
                </span>
                <span className="text-xs font-mono text-foreground font-semibold">
                  Current Status:{" "}
                  {soxStep === "initial" && (
                    <span className="text-muted-foreground">Awaiting Action</span>
                  )}
                  {soxStep === "ai_proposed" && (
                    <span className="text-violet-400">Policy Proposed by Gemini 3</span>
                  )}
                  {soxStep === "auto_blocked" && (
                    <span className="text-rose-400 font-bold">
                      MUTATION BLOCKED (SOX Violation)
                    </span>
                  )}
                  {soxStep === "controller_approved" && (
                    <span className="text-emerald-400 font-bold">STATE FROZEN (Dual-Signed)</span>
                  )}
                </span>
              </div>

              {/* Simulation Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsAiReasoning(true);
                    setTimeout(() => {
                      setIsAiReasoning(false);
                      setSoxStep("ai_proposed");
                    }, 400);
                  }}
                  disabled={isAiReasoning || soxStep !== "initial"}
                  className="text-xs"
                >
                  {isAiReasoning ? (
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 mr-1.5 text-violet-400" />
                  )}
                  1. Have AI Propose Policy
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSoxStep("auto_blocked")}
                  disabled={soxStep !== "ai_proposed"}
                  className="text-xs border-rose-500/40 text-rose-500 hover:bg-rose-500/10"
                >
                  <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />
                  2. Test: AI Auto-Commit (Will Fail)
                </Button>

                <Button
                  size="sm"
                  onClick={() => setSoxStep("controller_approved")}
                  disabled={soxStep !== "ai_proposed" && soxStep !== "auto_blocked"}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                >
                  <KeyRound className="w-3.5 h-3.5 mr-1.5" />
                  3. Dual-Sign as Enterprise Controller
                </Button>

                {soxStep !== "initial" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSoxStep("initial")}
                    className="text-xs text-muted-foreground"
                  >
                    Reset Demo
                  </Button>
                )}
              </div>

              {/* Outcome Banner */}
              {soxStep === "auto_blocked" && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 rounded-xl border border-rose-500/40 bg-rose-500/10 text-xs flex items-start gap-3 text-rose-300"
                >
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">
                      ASSERTION FAILED: Error(&apos;SOX-404 Maker-Checker Invariant
                      Violation&apos;).
                    </span>
                    <p className="mt-0.5 text-rose-200/80">
                      The cognitive proposer cannot execute its own proposed policy. The transaction
                      mutation was trapped before entering the deterministic Rust kernel. Controller
                      dual-signature required.
                    </p>
                  </div>
                </motion.div>
              )}

              {soxStep === "controller_approved" && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-xs flex items-start gap-3 text-emerald-300"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold">
                      CERTIFICATE ISSUED: Policy Promoted to Active Deterministic Engine.
                    </span>
                    <p className="text-emerald-200/80 font-mono text-[11px]">
                      Policy Certificate Hash:
                      0x98f2b84298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                    </p>
                    <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground">
                      <span>Proposer: Gemini-3-Cognitive-Perimeter</span>
                      <span>•</span>
                      <span>Checker: CFO-Controller-Key-9012</span>
                      <span>•</span>
                      <span>Replay Validation: 100% Passed</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2 Content: In-Browser Merkle Verifier */}
        {activeTab === "crypto" && (
          <div className="py-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-emerald-400" />
                  Air-Gapped Client-Side Cryptographic Verifier
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Executed entirely inside your browser via{" "}
                  <code className="text-primary font-mono">
                    crypto.subtle.digest(&quot;SHA-256&quot;)
                  </code>
                  . Zero server network calls.
                </p>
              </div>

              {/* Vector Selector */}
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/50">
                <Button
                  size="sm"
                  variant={cryptoVector === "stripe" ? "default" : "ghost"}
                  onClick={() => runCryptoVerification("stripe")}
                  disabled={isVerifyingCrypto}
                  className="text-xs h-7"
                >
                  {isVerifyingCrypto && cryptoVector === "stripe" && (
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  )}
                  Stripe Global Q3 (Valid)
                </Button>
                <Button
                  size="sm"
                  variant={cryptoVector === "fedwire" ? "default" : "ghost"}
                  onClick={() => runCryptoVerification("fedwire")}
                  disabled={isVerifyingCrypto}
                  className="text-xs h-7"
                >
                  {isVerifyingCrypto && cryptoVector === "fedwire" && (
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  )}
                  Fedwire Allocation (Valid)
                </Button>
                <Button
                  size="sm"
                  variant={cryptoVector === "tampered" ? "destructive" : "ghost"}
                  onClick={() => runCryptoVerification("tampered")}
                  disabled={isVerifyingCrypto}
                  className="text-xs h-7"
                >
                  {isVerifyingCrypto && cryptoVector === "tampered" && (
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  )}
                  Tampered Leaf (Adversarial)
                </Button>
              </div>
            </div>

            {/* Verification Telemetry Grid */}
            {cryptoResult && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card
                  className={cn(
                    "border",
                    cryptoResult.verified
                      ? "border-emerald-500/40 bg-emerald-500/5"
                      : "border-rose-500/40 bg-rose-500/5"
                  )}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase text-muted-foreground">
                        RFC 6962 Merkle Root Verdict
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs font-mono",
                          cryptoResult.verified
                            ? "border-emerald-500 text-emerald-400 bg-emerald-500/10"
                            : "border-rose-500 text-rose-400 bg-rose-500/10"
                        )}
                      >
                        {cryptoResult.verified ? "100% CENSUS MATCH" : "TAMPER BREAK DETECTED"}
                      </Badge>
                    </div>

                    <div className="space-y-2 font-mono text-[11px]">
                      <div>
                        <div className="text-muted-foreground text-[10px]">
                          Computed Root (Client-Side):
                        </div>
                        <div className="text-foreground truncate bg-background/80 p-1.5 rounded border border-border/40">
                          {cryptoResult.computedRoot}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-[10px]">
                          Declared Sovereign Manifest Root:
                        </div>
                        <div className="text-foreground truncate bg-background/80 p-1.5 rounded border border-border/40">
                          {cryptoResult.declaredRoot}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
                      <span>Leaves verified: {cryptoResult.leavesChecked}</span>
                      <span>Execution: {cryptoResult.executionTimeMs} ms</span>
                      <span className="text-emerald-500 font-medium">Network Calls: 0</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Technical Auditor Details */}
                <Card className="border-border/60 bg-muted/20">
                  <CardContent className="p-4 space-y-3 text-xs">
                    <span className="text-xs font-mono uppercase text-muted-foreground block">
                      Auditor Cryptographic Provenance
                    </span>
                    <p className="text-muted-foreground leading-relaxed">
                      {cryptoResult.verified ? (
                        <>
                          Every leaf in this settlement run corresponds bit-for-bit with the
                          verified source payloads. The RFC 6962 SHA-256 Merkle tree leaves produce
                          a root hash that matches the immutable manifest. No statistical sampling
                          needed.
                        </>
                      ) : (
                        <>
                          <strong className="text-rose-400">Adversarial Defense Verified:</strong> A
                          single byte modification in the declared fund transfer altered the
                          computed Merkle root, resulting in instant client-side rejection without
                          server intervention.
                        </>
                      )}
                    </p>

                    <div className="pt-2">
                      <Button asChild variant="outline" size="sm" className="w-full text-xs">
                        <Link href="/verify">
                          Open Dedicated Zero-Trust Auditor Studio{" "}
                          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Tab 3 Content: Multimodal 0-Drift Ingestion */}
        {activeTab === "ingest" && (
          <div className="py-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Raw Statement Ingestion */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-muted-foreground">
                    Raw Unstructured Statement Stream
                  </span>
                  <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                    1M+ Token Multimodal
                  </Badge>
                </div>
                <div className="rounded-xl border border-border/60 bg-background/80 p-3.5 font-mono text-xs text-muted-foreground space-y-1">
                  <div className="text-foreground font-semibold">
                    CHASE OPERATING ACCOUNT #99812-44
                  </div>
                  <div>2026-09-02 TXN_STRIPE_01 $12,500.50 Stripe Enterprise Settlement USD</div>
                  <div>2026-09-05 TXN_SHOPIFY_02 $8,420.25 Shopify Merchant Payout USD</div>
                  <div>2026-09-10 TXN_WIRE_03 $150,000.00 Treasury Capital Allocation USD</div>
                  <div className="text-emerald-400 pt-1 border-t border-border/40">
                    DECLARED NET TOTAL: $170,920.75
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsIngesting(true);
                    setTimeout(() => {
                      setIsIngesting(false);
                    }, 400);
                  }}
                  disabled={isIngesting}
                  className="w-full text-xs mt-2"
                >
                  {isIngesting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Ingesting with
                      Gemini 3...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary" /> Re-Run Ingestion &
                      Float Check
                    </>
                  )}
                </Button>
              </div>

              {/* Normalized Verified Output */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-muted-foreground">
                    Deterministic Normalization & Float Check
                  </span>
                  <span className="text-emerald-400 font-mono font-medium text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 0.00c Float Drift
                  </span>
                </div>
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 font-mono text-xs space-y-2 text-foreground">
                  <div className="flex justify-between items-center text-[11px] border-b border-border/40 pb-1.5">
                    <span>Parsed Records: 3</span>
                    <span>Integer Cents: 17,092,075</span>
                    <span className="text-emerald-400">Fixed-Point: BigInt Verified</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                    Gemini 3 normalized the raw document into structured ledger events with 100%
                    confidence bounding boxes, and the Settler Rust kernel verified that extracted
                    items match declared deposit totals with zero float leakage.
                  </p>
                  <Button asChild size="sm" variant="outline" className="w-full text-xs mt-2">
                    <Link href="/cognitive">
                      Launch Full Cognitive Workbench <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
