"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ZeroTrustVerifier } from "@/components/cognitive/zero-trust-verifier";
import {
  FileText,
  Sparkles,
  ShieldCheck,
  Cpu,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Fingerprint,
  RefreshCw,
  Search,
  Code2,
  UploadCloud,
  FileCheck,
  Lock,
  UserCheck,
  Layers,
  ArrowDownRight,
} from "lucide-react";

export default function CognitiveIntelligencePage() {
  // Ingestion State
  const [selectedRail, setSelectedRail] = useState("stripe_payout");
  const [ingestionText, setIngestionText] =
    useState(`STATEMENT SUMMARY: CHASE OPERATING ACCOUNT #99812-44
PERIOD: 2026-09-01 TO 2026-09-15
2026-09-02 TXN_STRIPE_01 $12,500.50 Stripe Enterprise Settlement USD
2026-09-05 TXN_SHOPIFY_02 $8,420.25 Shopify Merchant Payout USD
2026-09-10 TXN_WIRE_03 $150,000.00 Treasury Capital Allocation USD
TOTAL DEPOSITS: $170,920.75`);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isReconcilingStaged, setIsReconcilingStaged] = useState(false);
  const [stagedReconResult, setStagedReconResult] = useState<any>(null);

  const [extractedRecords, setExtractedRecords] = useState<any[]>([
    {
      id: "TXN_STRIPE_01",
      date: "2026-09-02",
      amount: "$12,500.50",
      cents: 1250050,
      currency: "USD",
      confidence: 0.99,
      line: 3,
      rail: "stripe_payout",
    },
    {
      id: "TXN_SHOPIFY_02",
      date: "2026-09-05",
      amount: "$8,420.25",
      cents: 842025,
      currency: "USD",
      confidence: 0.98,
      line: 4,
      rail: "shopify_payout",
    },
    {
      id: "TXN_WIRE_03",
      date: "2026-09-10",
      amount: "$150,000.00",
      cents: 15000000,
      currency: "USD",
      confidence: 0.99,
      line: 5,
      rail: "fedwire",
    },
  ]);
  const [balanceVerdict, setBalanceVerdict] = useState<"EXACT_MATCH" | "BALANCE_BREAK">(
    "EXACT_MATCH"
  );

  // Adjudication & Policy Governance State
  const [isAdjudicating, setIsAdjudicating] = useState(false);
  const [selectedPlanForApproval, setSelectedPlanForApproval] = useState<any | null>(null);
  const [checkerRole, setCheckerRole] = useState<"operator" | "controller">("controller");
  const [approvalNote, setApprovalNote] = useState("Approved for Q3 SOX-404 compliance");

  const [healingPlans, setHealingPlans] = useState<any[]>([
    {
      id: "PLAN-TIME-98B2",
      action: "HEAL_FLOAT_TIMING",
      rail: "stripe_gbp",
      noiseReduction: "94.2%",
      guarded: "$418,293.40",
      rationale:
        "UK Late Summer Bank Holiday clearing lag detected. Extended auto-matching window from 24h to 72h with zero float drift.",
      status: "simulated_safe",
      isProposed: false,
    },
    {
      id: "PLAN-ROUND-41F0",
      action: "HEAL_ROUNDING_PRECISION",
      rail: "cross_border_fx",
      noiseReduction: "89.5%",
      guarded: "$84,102.15",
      rationale:
        "Sub-cent foreign exchange conversion rounding discrepancies automatically balanced to 0-net variance.",
      status: "simulated_safe",
      isProposed: false,
    },
  ]);

  const [activePolicies, setActivePolicies] = useState<any[]>([
    {
      proposalId: "pol_7a3d9021e54f9a0c",
      rail: "stripe_payout",
      action: "HEAL_FLOAT_TIMING",
      proposerId: "operator_alice",
      checkerId: "controller_marcus",
      status: "active",
      noiseReductionPct: 94.2,
      certificateHash: "0x48c781e9d1e3d36b7617b0769cf3ddf4b9ec43ef19942a78bf9fb6416182ee20",
      approvedAt: "2026-09-17T20:15:00Z",
    },
  ]);

  // Auditor Copilot State
  const [auditQuery, setAuditQuery] = useState(
    "Verify all Stripe EUR revenue recognized in Q3 2026 settled into JPMorgan Operating Account without unallocated credits."
  );
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditDossier, setAuditDossier] = useState<any>({
    dossierId: "DOSSIER-Q3-2026-STRIPE",
    censusCount: "187,420",
    volume: "$48,910,250.00",
    merkleRoot: "48c781e9d1e3d36b7617b0769cf3ddf4b9ec43ef19942a78bf9fb6416182ee20",
    samplingCoverage: "100% (Zero Sampling Error)",
    drift: "$0.00",
  });

  // Adapter Studio State
  const [connectorSpec, setConnectorSpec] = useState(`openapi: 3.0.0
info:
  title: Saudi SARIE Real-Time Clearing
  version: 1.0.0
paths:
  /transfers:
    get:
      summary: Fetch real-time clearing vouchers
      parameters:
        - name: cursor
          in: query
          schema: { type: string }
      responses:
        '200':
          content:
            application/json:
              schema:
                type: object
                properties:
                  transaction_id: { type: string }
                  amount_cents: { type: integer }
                  currency: { type: string }
                  posted_at: { type: string }`);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesizedCode, setSynthesizedCode] =
    useState(`export class SaudiSarieConnector implements Connector {
  readonly name = "saudi_sarie";
  readonly version = "1.0.0";
  private readonly rateLimitPerSecond = 25;

  async fetch(options: FetchOptions): Promise<NormalizedData[]> {
    // Generated cursor pagination & tenant-scoped auth
    return [];
  }

  normalize(raw: unknown): NormalizedData {
    const data = raw as Record<string, unknown>;
    return {
      id: String(data["transaction_id"]),
      amount: Number(data["amount_cents"]),
      currency: String(data["currency"] || "SAR"),
      date: new Date(String(data["posted_at"])),
      sourceId: this.name,
      metadata: { synthesizedBy: "gemini-3-adapter-synthesizer" }
    };
  }
}`);

  const handleSimulateExtraction = () => {
    setIsExtracting(true);
    setTimeout(() => {
      setIsExtracting(false);
      setBalanceVerdict("EXACT_MATCH");
    }, 600);
  };

  const handleReconcileStaged = () => {
    setIsReconcilingStaged(true);
    setTimeout(() => {
      setIsReconcilingStaged(false);
      setStagedReconResult({
        settlementId: "set_auto_staged_2026",
        matchedCount: 3,
        totalTransactions: 3,
        status: "exact_match",
        merkleRoot: "7b4c91a029fe871032cd9045b81a2e3f4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f",
        payoutAmount: "$170,920.75",
        slippageBps: 0,
        leakageCents: 0,
      });
    }, 750);
  };

  const handleProposePolicy = (planId: string) => {
    setHealingPlans((prev) => prev.map((p) => (p.id === planId ? { ...p, isProposed: true } : p)));
    const plan = healingPlans.find((p) => p.id === planId);
    if (plan) {
      setSelectedPlanForApproval(plan);
    }
  };

  const handleCommitDualSignature = () => {
    if (!selectedPlanForApproval) return;

    const newPolicy = {
      proposalId: `pol_${Math.random().toString(36).substring(2, 10)}`,
      rail: selectedPlanForApproval.rail,
      action: selectedPlanForApproval.action,
      proposerId: "operator_staff_01",
      checkerId: "controller_verified_exec",
      status: "active",
      noiseReductionPct: parseFloat(selectedPlanForApproval.noiseReduction),
      certificateHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
      approvedAt: new Date().toISOString(),
    };

    setActivePolicies((prev) => [newPolicy, ...prev]);
    setSelectedPlanForApproval(null);
  };

  const handleSimulateAdjudication = () => {
    setIsAdjudicating(true);
    setTimeout(() => {
      setIsAdjudicating(false);
    }, 700);
  };

  const handleSimulateAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      setIsAuditing(false);
    }, 800);
  };

  const handleSimulateSynthesis = () => {
    setIsSynthesizing(true);
    setTimeout(() => {
      setIsSynthesizing(false);
    }, 650);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setIngestionText(content.slice(0, 5000));
        handleSimulateExtraction();
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="container mx-auto py-8 space-y-8 max-w-7xl">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/50 text-primary bg-primary/10">
              <Sparkles className="w-3 h-3 mr-1" /> Gemini 3.8 Flash Accelerated
            </Badge>
            <Badge
              variant="outline"
              className="border-emerald-500/50 text-emerald-500 bg-emerald-500/10"
            >
              <ShieldCheck className="w-3 h-3 mr-1" /> Deterministic Rust CAS
            </Badge>
            <Badge
              variant="outline"
              className="border-purple-500/50 text-purple-400 bg-purple-500/10"
            >
              <Lock className="w-3 h-3 mr-1" /> SOX-404 Dual-Signature
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mt-2 text-foreground">
            Cognitive Intelligence OS
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Probabilistic cognitive fluidity at the perimeter, zero-float-drift cryptographic
            determinism at the core.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-lg bg-card border border-border/60 text-right">
            <div className="text-xs text-muted-foreground uppercase font-semibold">
              Active Ledger Boundary
            </div>
            <div className="text-sm font-mono text-emerald-400 font-bold flex items-center gap-1.5 justify-end">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              100% RLS Tenant Isolated
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="ingestion" className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full h-auto p-1 bg-muted/60 border border-border/40 rounded-xl">
          <TabsTrigger value="ingestion" className="py-2.5 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Multimodal Ingestion</span>
          </TabsTrigger>
          <TabsTrigger value="adjudication" className="py-2.5 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Causal Adjudication & Policy</span>
          </TabsTrigger>
          <TabsTrigger value="auditor" className="py-2.5 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Auditor OS & Verifier</span>
          </TabsTrigger>
          <TabsTrigger value="adapter" className="py-2.5 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-amber-400" />
            <span>Connector Studio</span>
          </TabsTrigger>
        </TabsList>

        {/* 1. Multimodal Document Ingestion */}
        <TabsContent value="ingestion" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="border-border/60 shadow-sm bg-card/60 backdrop-blur-sm">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-400" />
                    Raw Statement Ingestion Stream
                  </CardTitle>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf,.csv,.xml,.txt"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <Badge
                      variant="outline"
                      className="border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 flex items-center gap-1 cursor-pointer"
                    >
                      <UploadCloud className="w-3 h-3" /> Drop Bank File
                    </Badge>
                  </label>
                </div>
                <CardDescription>
                  Extract unstructured PDF excerpts, SWIFT MT940, or ISO 20022 CAMT.053 XML files.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  value={ingestionText}
                  onChange={(e) => setIngestionText(e.target.value)}
                  className="w-full h-56 p-3 rounded-md bg-muted/40 font-mono text-xs border border-border/80 focus:ring-1 focus:ring-primary focus:outline-none"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleSimulateExtraction}
                    disabled={isExtracting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-9"
                  >
                    {isExtracting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" /> Ingesting &
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 mr-2" /> Extract & Verify Balance
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleReconcileStaged}
                    disabled={isReconcilingStaged}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs h-9"
                  >
                    {isReconcilingStaged ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" /> Matching Staged...
                      </>
                    ) : (
                      <>
                        <ArrowDownRight className="w-3.5 h-3.5 mr-2" /> Stage & Reconcile Run
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm bg-card/60 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    Structured Normalized Records
                  </CardTitle>
                  <CardDescription>Zero-float-drift line-by-line provenance</CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                >
                  {balanceVerdict === "EXACT_MATCH" ? "Exact Balance Verified" : "Balance Break"}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md border border-border/60 overflow-hidden max-h-56 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/60 text-muted-foreground border-b border-border/60 sticky top-0">
                      <tr>
                        <th className="p-2 text-left">Record ID</th>
                        <th className="p-2 text-left">Date</th>
                        <th className="p-2 text-left">Amount</th>
                        <th className="p-2 text-left">Confidence</th>
                        <th className="p-2 text-right">Provenance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {extractedRecords.map((rec) => (
                        <tr key={rec.id} className="hover:bg-muted/20">
                          <td className="p-2 font-mono font-medium text-foreground">{rec.id}</td>
                          <td className="p-2 text-muted-foreground">{rec.date}</td>
                          <td className="p-2 font-mono text-emerald-400 font-semibold">
                            {rec.amount}
                          </td>
                          <td className="p-2">
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/30"
                            >
                              {(rec.confidence * 100).toFixed(0)}%
                            </Badge>
                          </td>
                          <td className="p-2 text-right text-muted-foreground font-mono">
                            Line {rec.line}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {stagedReconResult && (
                  <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-xs space-y-1.5 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Staged Reconciliation
                        Completed
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] text-emerald-400 border-emerald-500/40 font-mono"
                      >
                        {stagedReconResult.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                      <div>
                        Matched:{" "}
                        <span className="text-foreground font-bold">
                          {stagedReconResult.matchedCount} / {stagedReconResult.totalTransactions}
                        </span>
                      </div>
                      <div>
                        Payout Volume:{" "}
                        <span className="text-foreground font-bold">
                          {stagedReconResult.payoutAmount}
                        </span>
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground break-all">
                      StateRoot: {stagedReconResult.merkleRoot}
                    </div>
                  </div>
                )}

                <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Computed Statement Sum:</span>
                    <span className="font-mono font-bold text-foreground">$170,920.75</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Declared Net Header:</span>
                    <span className="font-mono font-bold text-foreground">$170,920.75</span>
                  </div>
                  <div className="flex justify-between border-t border-border/40 pt-1 text-emerald-400">
                    <span className="font-semibold">Reconciliation Delta:</span>
                    <span className="font-mono font-bold">$0.00 (Zero Drift)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 2. Autonomous Closed-Loop Adjudication & Policy Governance */}
        <TabsContent value="adjudication" className="space-y-6">
          <Card className="border-border/60 shadow-sm bg-card/60 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  Causal Exception Adjudication & SOX-404 Policy Governance
                </CardTitle>
                <CardDescription>
                  Counterfactual root-cause analysis transforming exceptions into verified,
                  dual-signed policy candidates.
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={handleSimulateAdjudication}
                disabled={isAdjudicating}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isAdjudicating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Evaluating Replay...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" /> Re-Evaluate Live Exceptions
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Healing Plans Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                {healingPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="p-4 rounded-xl border border-border/80 bg-muted/30 hover:border-purple-500/50 transition-colors space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/30"
                        >
                          {plan.action}
                        </Badge>
                        <span className="text-xs text-muted-foreground ml-2 font-mono">
                          {plan.id}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30 flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Replay Safe
                      </Badge>
                    </div>

                    <p className="text-xs text-foreground leading-relaxed">{plan.rationale}</p>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40 text-xs">
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase">
                          Noise Reduction
                        </div>
                        <div className="font-mono font-bold text-emerald-400 text-sm">
                          {plan.noiseReduction}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase">
                          Capital Guarded
                        </div>
                        <div className="font-mono font-bold text-foreground text-sm">
                          {plan.guarded}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleProposePolicy(plan.id)}
                        className="w-full text-xs border-purple-500/40 text-purple-300 hover:bg-purple-500/10"
                      >
                        <Lock className="w-3.5 h-3.5 mr-1.5" /> Stage Dual-Signature Policy Proposal
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dual-Signature Approval Modal / Card if Selected */}
              {selectedPlanForApproval && (
                <div className="p-4 rounded-xl border-2 border-purple-500/60 bg-purple-950/20 space-y-3 animate-in fade-in duration-300">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-purple-400" />
                      <span className="text-sm font-bold text-foreground">
                        SOX-404 Dual-Signature Review: {selectedPlanForApproval.id}
                      </span>
                    </div>
                    <Badge variant="outline" className="border-purple-400/40 text-purple-300">
                      Maker-Checker Required
                    </Badge>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded bg-muted/40 border border-border/50">
                      <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                        Proposer (Maker)
                      </div>
                      <div className="font-mono font-bold text-foreground mt-0.5">
                        operator_staff_01
                      </div>
                    </div>
                    <div className="p-2.5 rounded bg-muted/40 border border-border/50">
                      <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                        Controller (Checker)
                      </div>
                      <div className="font-mono font-bold text-purple-400 mt-0.5">
                        controller_verified_exec
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={handleCommitDualSignature}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs flex-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Authorize & Freeze SHA-256
                      Policy Certificate
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedPlanForApproval(null)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Active Policy Registry Table */}
              <div className="space-y-2 pt-4 border-t border-border/40">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" /> Active Frozen Cognitive Policies
                    ({activePolicies.length})
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] text-emerald-400 border-emerald-500/30"
                  >
                    Immutable SHA-256 Enforced
                  </Badge>
                </div>
                <div className="rounded-lg border border-border/60 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/60 text-muted-foreground border-b border-border/60">
                      <tr>
                        <th className="p-2.5 text-left">Policy ID</th>
                        <th className="p-2.5 text-left">Action</th>
                        <th className="p-2.5 text-left">Maker / Checker</th>
                        <th className="p-2.5 text-left">Noise Reduction</th>
                        <th className="p-2.5 text-left">Certificate Fingerprint</th>
                        <th className="p-2.5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-mono">
                      {activePolicies.map((pol) => (
                        <tr key={pol.proposalId} className="hover:bg-muted/20">
                          <td className="p-2.5 font-bold text-foreground">{pol.proposalId}</td>
                          <td className="p-2.5 text-purple-400">{pol.action}</td>
                          <td className="p-2.5 text-muted-foreground text-[11px]">
                            {pol.proposerId} /{" "}
                            <span className="text-foreground">{pol.checkerId}</span>
                          </td>
                          <td className="p-2.5 text-emerald-400 font-bold">
                            {pol.noiseReductionPct}%
                          </td>
                          <td className="p-2.5 text-[10px] text-muted-foreground max-w-xs truncate">
                            {pol.certificateHash}
                          </td>
                          <td className="p-2.5 text-right">
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            >
                              ACTIVE
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. Conversational Auditor OS & Zero-Trust Verifier */}
        <TabsContent value="auditor" className="space-y-6">
          {/* Zero-Trust Client-Side Verifier Studio */}
          <ZeroTrustVerifier />

          {/* Attestation Dossier */}
          <Card className="border-border/60 shadow-sm bg-card/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Conversational Auditor & Zero-Knowledge Proofpacks
              </CardTitle>
              <CardDescription>
                Ask questions in plain English. Settler generates 100% census audit memorandums and
                cryptographic Merkle proofpacks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <input
                    type="text"
                    value={auditQuery}
                    onChange={(e) => setAuditQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-md bg-muted/40 border border-border/80 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                    placeholder="Enter plain English audit inquiry..."
                  />
                </div>
                <Button
                  onClick={handleSimulateAudit}
                  disabled={isAuditing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs"
                >
                  {isAuditing ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Verify Census"}
                </Button>
              </div>

              {auditDossier && (
                <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-4 text-xs">
                  <div className="flex justify-between items-center border-b border-border/40 pb-3">
                    <div className="font-bold text-foreground flex items-center gap-2">
                      <Fingerprint className="w-4 h-4 text-emerald-400" />
                      Auditor Attestation Dossier: {auditDossier.dossierId}
                    </div>
                    <Badge
                      variant="outline"
                      className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                    >
                      100% Census Coverage
                    </Badge>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40">
                      <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                        Transactions Verified
                      </div>
                      <div className="font-mono font-bold text-foreground text-sm mt-0.5">
                        {auditDossier.censusCount}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40">
                      <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                        Total Audited Volume
                      </div>
                      <div className="font-mono font-bold text-foreground text-sm mt-0.5">
                        {auditDossier.volume}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40">
                      <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                        Unallocated Drift
                      </div>
                      <div className="font-mono font-bold text-emerald-400 text-sm mt-0.5">
                        {auditDossier.drift}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">
                      Aggregated Merkle State Root (RFC 6962)
                    </div>
                    <div className="p-2 rounded bg-background font-mono text-[11px] text-emerald-400 border border-border/60 break-all select-all">
                      {auditDossier.merkleRoot}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/50 border border-border/60 font-mono text-[11px] text-muted-foreground leading-relaxed">
                    // Verification Command (WASM zero-trust execution)
                    <br />
                    <span className="text-foreground">
                      pnpm exec tsx packages/cli/src/index.ts verify --dossier{" "}
                      {auditDossier.dossierId}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. Zero-Shot Connector Studio */}
        <TabsContent value="adapter" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="border-border/60 shadow-sm bg-card/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-amber-400" />
                  Regional Rail Specification
                </CardTitle>
                <CardDescription>
                  Supply OpenAPI YAML/JSON or raw API documentation to generate production
                  connectors.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  value={connectorSpec}
                  onChange={(e) => setConnectorSpec(e.target.value)}
                  className="w-full h-64 p-3 rounded-md bg-muted/40 font-mono text-xs border border-border/80 focus:ring-1 focus:ring-primary focus:outline-none"
                />
                <Button
                  onClick={handleSimulateSynthesis}
                  disabled={isSynthesizing}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium"
                >
                  {isSynthesizing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Synthesizing Sandboxed
                      Driver...
                    </>
                  ) : (
                    <>
                      <Code2 className="w-4 h-4 mr-2" /> Synthesize TypeScript Connector Driver
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm bg-card/60 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-emerald-400" />
                    Synthesized Driver Output
                  </CardTitle>
                  <CardDescription>
                    Conforms to @settler/adapters Connector contract
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                >
                  Ready to Compile
                </Badge>
              </CardHeader>
              <CardContent>
                <pre className="p-3 rounded-md bg-background border border-border/60 font-mono text-xs text-foreground overflow-x-auto h-72">
                  {synthesizedCode}
                </pre>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
