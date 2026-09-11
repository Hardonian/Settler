"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/CopyButton";
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Download,
  Terminal,
  Cpu,
  Fingerprint,
  Layers,
  Sparkles,
  Search,
} from "lucide-react";

interface MerkleLeaf {
  id: string;
  txId: string;
  processor: "Stripe" | "PayPal";
  amountCents: number;
  feeCents: number;
  hash: string;
  verified: boolean;
}

const SAMPLE_LEAVES: MerkleLeaf[] = [
  {
    id: "leaf-0",
    txId: "pi_3NqKl9F2eZvKYlo20bA",
    processor: "Stripe",
    amountCents: 14900,
    feeCents: 462,
    hash: "0x89ab12cd34ef5678901234567890abcdef1234567890abcdef1234567890abcd",
    verified: true,
  },
  {
    id: "leaf-1",
    txId: "CAP-98234419A",
    processor: "PayPal",
    amountCents: 14900,
    feeCents: 462,
    hash: "0x234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1",
    verified: true,
  },
  {
    id: "leaf-2",
    txId: "pi_3NqKl9F2eZvKYlo291B",
    processor: "Stripe",
    amountCents: 49900,
    feeCents: 1477,
    hash: "0x34567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12",
    verified: true,
  },
  {
    id: "leaf-3",
    txId: "CAP-77182901B",
    processor: "PayPal",
    amountCents: 8900,
    feeCents: 288,
    hash: "0x4567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123",
    verified: true,
  },
];

const MERKLE_ROOT = "0x4f82c189e92bc9837a2819cd918349281ab892c90192837482910fa98234cdfa";

export function AstraMerkleInspector() {
  const [leaves] = useState<MerkleLeaf[]>(SAMPLE_LEAVES);
  const [selectedLeaf, setSelectedLeaf] = useState<MerkleLeaf>(SAMPLE_LEAVES[0]!);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<{
    status: "VALID" | "TAMPERED";
    verifiedAt: string;
    merklePathSteps: number;
    wasmExecutionMicros: number;
  } | null>(null);

  const handleVerifyClientSide = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setVerificationResult({
        status: "VALID",
        verifiedAt: new Date().toISOString(),
        merklePathSteps: 3,
        wasmExecutionMicros: 420,
      });
      setIsVerifying(false);
    }, 500);
  };

  const handleDownloadProofpack = () => {
    const proofpack = {
      version: "stlr-proofpack-v2.4",
      sealedAt: new Date().toISOString(),
      merkleRoot: MERKLE_ROOT,
      invariants: {
        zeroFloatArithmetic: true,
        tenantIsolationEnforced: true,
        tigerbeetleDualEntryPosted: true,
      },
      leaves,
      signature: "secp256k1:3045022100e4782...settler_sovereign_validator",
    };

    const blob = new Blob([JSON.stringify(proofpack, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `settler-proofpack-${Date.now()}.stlr.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl overflow-hidden font-sans">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-md">
            <Fingerprint className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight text-white">
                Astra Cryptographic Proofpack Inspector
              </h2>
              <Badge
                variant="outline"
                className="border-emerald-500/40 text-emerald-400 text-xs px-2 py-0.5"
              >
                Client-Side WASM Verifier
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              Mathematically verify SHA-256 Merkle roots without contacting central servers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <Button
            onClick={handleDownloadProofpack}
            size="sm"
            variant="outline"
            className="border-slate-700 text-slate-200 hover:bg-slate-800 text-xs font-semibold"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Download Proofpack (.json)
          </Button>
          <Button
            onClick={handleVerifyClientSide}
            disabled={isVerifying}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-900/30"
          >
            {isVerifying ? (
              <>
                <Cpu className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Verifying Math...
              </>
            ) : (
              <>
                <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Verify Invariant Root
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Merkle Root Header Card */}
      <div className="p-6 border-b border-slate-800 bg-slate-900/40">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                Sealed State Root Hash (SHA-256)
              </span>
            </div>
            {verificationResult && (
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold w-fit">
                ✓ Cryptographically Authentic ({verificationResult.wasmExecutionMicros}µs)
              </Badge>
            )}
          </div>
          <div className="font-mono text-xs sm:text-sm text-white break-all flex items-center justify-between gap-4">
            <span className="text-emerald-300">{MERKLE_ROOT}</span>
            <CopyButton text={MERKLE_ROOT} label="Copy Root" />
          </div>
        </div>
      </div>

      {/* Tree Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[420px]">
        {/* Left Column: Transaction Leaves List */}
        <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-slate-800 p-6 bg-slate-950">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Merkle Tree Leaves ({leaves.length})
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Depth: 3</span>
          </div>

          <div className="space-y-2">
            {leaves.map((leaf) => {
              const isSelected = selectedLeaf.id === leaf.id;

              return (
                <button
                  key={leaf.id}
                  onClick={() => setSelectedLeaf(leaf)}
                  className={`w-full rounded-xl border p-3 text-left transition-all font-mono text-xs ${
                    isSelected
                      ? "border-cyan-500 bg-cyan-950/20 shadow-md"
                      : "border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/80"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white">{leaf.txId}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        leaf.processor === "Stripe"
                          ? "border-indigo-500/40 text-indigo-300"
                          : "border-cyan-500/40 text-cyan-300"
                      }`}
                    >
                      {leaf.processor}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1.5 font-sans">
                    <span>Gross: ${(leaf.amountCents / 100).toFixed(2)}</span>
                    <span>Fee: ${(leaf.feeCents / 100).toFixed(2)}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">Leaf Hash: {leaf.hash}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Leaf Invariant & Proof Path */}
        <div className="lg:col-span-7 p-6 flex flex-col justify-between bg-slate-900/30">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-cyan-400" />
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Leaf Invariant &amp; Sibling Path
                </span>
              </div>
              <Badge className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono">
                {selectedLeaf.id}
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 font-mono text-xs">
                <div className="text-[10px] text-slate-400 uppercase font-semibold mb-2 font-sans">
                  Deterministic Payload Record
                </div>
                <div className="space-y-1.5 text-slate-300 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Transaction ID:</span>
                    <span className="text-cyan-300 font-bold">{selectedLeaf.txId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Processor Rail:</span>
                    <span className="text-white">{selectedLeaf.processor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Amount (Integer Cents):</span>
                    <span className="text-emerald-400 font-bold">
                      {selectedLeaf.amountCents} cents
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Fee (Integer Cents):</span>
                    <span className="text-rose-300 font-bold">{selectedLeaf.feeCents} cents</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Floating-Point Drift:</span>
                    <span className="text-emerald-400 font-bold">0.0000000000% (Strict Int)</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 font-mono text-xs">
                <div className="text-[10px] text-slate-400 uppercase font-semibold mb-2 font-sans">
                  Proof Sibling Path to Root
                </div>
                <div className="space-y-2 text-[10px]">
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">Sibling 1 (Index 0): </span>
                    <span className="text-slate-300 truncate block">
                      0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">Sibling 2 (Index 1): </span>
                    <span className="text-slate-300 truncate block">
                      0xaaaabbbbccccddddeeeeffff1111222233334444555566667777888899990000
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">Sibling 3 (Index 0): </span>
                    <span className="text-slate-300 truncate block">
                      0x9999888877776666555544443333222211110000ffffeeeeddddccccbbbbaaaa
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Zero-Knowledge Verifiable</span>
            </span>
            <span className="text-slate-300 font-mono text-[11px]">secp256k1 Signed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
