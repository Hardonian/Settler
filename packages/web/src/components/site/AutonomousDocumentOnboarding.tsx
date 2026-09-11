"use client";

import React, { useState } from "react";
import {
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  Zap,
  Clock,
  Download,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DocumentPreset {
  id: string;
  name: string;
  type: "stripe" | "paypal" | "bank" | "erp";
  filename: string;
  size: string;
  recordsCount: number;
  detectedColumns: string[];
  inferredFeeRate: string;
  suggestedCadence: string;
  matchingConfidence: number;
  sampleData: Record<string, string>[];
}

const DOCUMENT_PRESETS: DocumentPreset[] = [
  {
    id: "stripe_settlement",
    name: "Stripe Daily Payout Batch Export",
    type: "stripe",
    filename: "stripe_payout_po_1N8x92_itemized.csv",
    size: "2.4 MB",
    recordsCount: 14280,
    detectedColumns: [
      "balance_transaction_id",
      "source_id",
      "amount",
      "fee",
      "net",
      "currency",
      "created_utc",
    ],
    inferredFeeRate: "2.90% + $0.30 fixed (Standard Interchange+)",
    suggestedCadence: "Daily Sweep at 02:00 UTC (Post-Stripe Batch Settlement)",
    matchingConfidence: 99.8,
    sampleData: [
      { id: "txn_1092", amount: "$2,450.00", fee: "$71.35", net: "$2,378.65", status: "MATCHED" },
      { id: "txn_1093", amount: "$189.50", fee: "$5.80", net: "$183.70", status: "MATCHED" },
      { id: "txn_1094", amount: "$7,600.00", fee: "$220.70", net: "$7,379.30", status: "MATCHED" },
    ],
  },
  {
    id: "paypal_mass_payout",
    name: "PayPal Commercial Activity Report",
    type: "paypal",
    filename: "paypal_monthly_settlement_ledger.csv",
    size: "1.8 MB",
    recordsCount: 8420,
    detectedColumns: [
      "Transaction ID",
      "Reference Txn ID",
      "Gross",
      "Fee",
      "Net",
      "Currency",
      "Date/Time",
    ],
    inferredFeeRate: "3.49% + $0.49 (Digital Wallet + Reserve Holdback)",
    suggestedCadence: "Daily Sweep at 03:30 UTC (Post-Sweep Bank Deposit)",
    matchingConfidence: 99.4,
    sampleData: [
      { id: "PP-8812", amount: "$1,120.00", fee: "$39.58", net: "$1,080.42", status: "MATCHED" },
      { id: "PP-8813", amount: "$4,500.00", fee: "$157.54", net: "$4,342.46", status: "MATCHED" },
      { id: "PP-8814", amount: "$320.00", fee: "$11.66", net: "$308.34", status: "MATCHED" },
    ],
  },
  {
    id: "chase_statement",
    name: "Chase Operating Bank Statement",
    type: "bank",
    filename: "chase_commercial_checking_sep2026.pdf",
    size: "4.1 MB",
    recordsCount: 312,
    detectedColumns: [
      "Posting Date",
      "Description",
      "Debit / Credit",
      "Account Number",
      "Check / Ref Num",
    ],
    inferredFeeRate: "N/A (Clearing Deposit Batches)",
    suggestedCadence: "Intraday Continuous (Real-time BAI2 / Camt.053 Polling)",
    matchingConfidence: 99.9,
    sampleData: [
      {
        id: "WIRE-9901",
        amount: "$46,812.45",
        fee: "$0.00",
        net: "$46,812.45",
        status: "DECOMPOSED",
      },
      {
        id: "ACH-4412",
        amount: "$184,230.00",
        fee: "$0.00",
        net: "$184,230.00",
        status: "DECOMPOSED",
      },
      {
        id: "WIRE-9902",
        amount: "$72,410.50",
        fee: "$0.00",
        net: "$72,410.50",
        status: "DECOMPOSED",
      },
    ],
  },
  {
    id: "netsuite_gl",
    name: "NetSuite GL Clearing Account 2100",
    type: "erp",
    filename: "netsuite_gl_export_clearing_sep.csv",
    size: "5.2 MB",
    recordsCount: 18940,
    detectedColumns: ["Internal ID", "Account", "Debit", "Credit", "Memo", "Entity", "Subsidiary"],
    inferredFeeRate: "Double-Entry Balance Check (Debits == Credits)",
    suggestedCadence: "Continuous Close (T+0 Hourly Reconciliation Run)",
    matchingConfidence: 99.7,
    sampleData: [
      { id: "JRN-771", amount: "$46,812.45", fee: "$0.00", net: "$46,812.45", status: "VERIFIED" },
      {
        id: "JRN-772",
        amount: "$184,230.00",
        fee: "$0.00",
        net: "$184,230.00",
        status: "VERIFIED",
      },
      { id: "JRN-773", amount: "$72,410.50", fee: "$0.00", net: "$72,410.50", status: "VERIFIED" },
    ],
  },
];

export function AutonomousDocumentOnboarding() {
  const [selectedPreset, setSelectedPreset] = useState<DocumentPreset>(DOCUMENT_PRESETS[0]!);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [downloadedPolicy, setDownloadedPolicy] = useState(false);

  const handleTriggerAnalysis = (preset: DocumentPreset) => {
    setSelectedPreset(preset);
    setIsSynthesizing(true);
    setTimeout(() => {
      setIsSynthesizing(false);
    }, 900);
  };

  const handleDownloadPolicy = () => {
    const policyPayload = {
      version: "2.4-settler-sovereign",
      artifactType: "autonomous_reconciliation_policy",
      sourceTopology: {
        documentName: selectedPreset.filename,
        detectedType: selectedPreset.type,
        recordsSampled: selectedPreset.recordsCount,
        columns: selectedPreset.detectedColumns,
        inferredFeeContract: selectedPreset.inferredFeeRate,
      },
      deterministicRules: [
        {
          ruleId: "RULE_COMPOSITE_MATCH_PRIMARY",
          sourceField: "amount",
          targetField: "net_amount",
          tolerance: 0.01,
          algorithm: "EXACT_TOLERANCE_BOUNDED",
        },
        {
          ruleId: "RULE_TIME_WINDOW_DRIFT",
          sourceField: "created_utc",
          targetField: "settlement_date",
          maxDriftHours: 72,
          calendarAlignment: "BUSINESS_DAYS_ONLY",
        },
      ],
      automatedCadence: {
        scheduleExpression: "0 2 * * *",
        description: selectedPreset.suggestedCadence,
        autoSealMerkleProof: true,
        tenantIsolation: "RLS_ENFORCED",
        slaLatencyMs: 380,
      },
      hashSignature: "sha256:4f8e21a0b3c990ef14892cda881204bb5201ae6b4412ec9102abf1298810eec3",
    };

    const blob = new Blob([JSON.stringify(policyPayload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `settler-policy-${selectedPreset.type}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloadedPolicy(true);
    setTimeout(() => setDownloadedPolicy(false), 3000);
  };

  return (
    <div className="relative w-full rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 p-6 sm:p-8 md:p-10 backdrop-blur-xl shadow-2xl overflow-hidden">
      {/* Dynamic Top Ambient Line */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-teal-500 via-indigo-500 to-emerald-500 opacity-80" />

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-slate-200/80 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge
              variant="outline"
              className="bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30 text-xs font-mono font-semibold"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              INTELLIGENT ONBOARDING ENGINE
            </Badge>
            <Badge
              variant="outline"
              className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 text-xs font-mono"
            >
              ZERO MANUAL CODE REQUIRED
            </Badge>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Autonomous Document-Driven Onboarding &amp; Cadence
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Drop raw processor batch reports, bank statements, or ERP ledgers. The engine
            automatically decodes the column topology, generates deterministic matching rules, and
            schedules the continuous reconciliation cadence.
          </p>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleDownloadPolicy}
          className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold shadow-md shadow-teal-600/20 text-xs flex items-center gap-2 shrink-0"
        >
          {downloadedPolicy ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>{downloadedPolicy ? "Policy Exported" : "Export Policy Manifest JSON"}</span>
        </Button>
      </div>

      {/* Preset Documents Shelf */}
      <div className="pt-6">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Sample Incoming Enterprise Statements:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
          {DOCUMENT_PRESETS.map((preset) => {
            const isSelected = selectedPreset.id === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleTriggerAnalysis(preset)}
                className={cn(
                  "p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer space-y-2",
                  isSelected
                    ? "border-teal-500 bg-teal-50/70 dark:bg-teal-950/40 shadow-sm ring-2 ring-teal-500/20 font-semibold"
                    : "border-slate-200 dark:border-white/5 bg-white dark:bg-slate-800/60 hover:border-slate-300"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-500">{preset.size}</span>
                  <Badge variant="outline" className="text-[10px] uppercase font-mono">
                    {preset.type}
                  </Badge>
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {preset.name}
                </h4>
                <p className="text-[11px] font-mono text-teal-600 dark:text-teal-400 truncate">
                  {preset.filename}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Main Analysis Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
        {/* Left 7 Columns: Schema Discovery & Sample Telemetry */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-slate-800/40 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Detected Statement Schema Topology
                </h4>
              </div>
              <Badge
                variant="outline"
                className="text-[10px] font-mono text-emerald-600 border-emerald-500/30"
              >
                {selectedPreset.matchingConfidence}% CONFIDENCE
              </Badge>
            </div>

            {/* Extracted Columns Pill Box */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-slate-500">
                Auto-Mapped Field Canonical Schema:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedPreset.detectedColumns.map((col) => (
                  <span
                    key={col}
                    className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-700 dark:text-slate-300"
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>

            {/* Inferred Rate Contract */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5 space-y-1 text-xs">
              <span className="text-slate-400 text-[10px] font-mono uppercase">
                Inferred Processor Fee Formula:
              </span>
              <div className="font-semibold text-slate-900 dark:text-white font-mono">
                {selectedPreset.inferredFeeRate}
              </div>
            </div>

            {/* Ingested Sample Rows */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-medium text-slate-500">
                Decoded Transaction Sample:
              </span>
              <div className="space-y-1.5">
                {selectedPreset.sampleData.map((row) => (
                  <div
                    key={row.id}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5 flex items-center justify-between text-xs font-mono"
                  >
                    <span className="font-bold text-slate-900 dark:text-white">{row.id}</span>
                    <span className="text-slate-600 dark:text-slate-300">{row.amount}</span>
                    <span className="text-amber-600 dark:text-amber-400">{row.fee} fee</span>
                    <span className="text-teal-600 dark:text-teal-400 font-bold">
                      {row.net} net
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
                      {row.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Generated Cadence & Matching Rules */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl border-2 border-teal-500/40 bg-gradient-to-br from-teal-950/20 via-slate-900 to-slate-950 text-white space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-400" />
                <h4 className="text-sm font-bold tracking-tight">
                  Automated Reconciliation Cadence
                </h4>
              </div>
              <span className="text-[10px] font-mono text-teal-300">ACTIVE CRON</span>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-teal-500/20 space-y-1 font-mono text-xs">
              <span className="text-slate-400 text-[10px]">SCHEDULE:</span>
              <div className="text-teal-300 font-semibold">{selectedPreset.suggestedCadence}</div>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero Float Loss: Payouts match bank credit intraday</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Deterministic Rules-as-Code synthesized</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>RFC 6962 SHA-256 Merkle root auto-sealed</span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                onClick={() => handleTriggerAnalysis(selectedPreset)}
                disabled={isSynthesizing}
                className="w-full py-5 text-xs font-bold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-lg shadow-teal-500/25 rounded-xl flex items-center justify-center gap-2"
              >
                {isSynthesizing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Synthesizing Cadence &amp; Invariants...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Run Cadence Policy Recheck</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
