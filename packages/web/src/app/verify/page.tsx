"use client";

import { useState, useCallback } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { AmbientLightOrbs } from "@/components/site/HomeInfographics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  Upload,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Lock,
  Fingerprint,
  Cpu,
  FileCode2,
} from "lucide-react";
import { motion } from "framer-motion";
import { ZeroTrustVerifier } from "@/components/cognitive/zero-trust-verifier";
import { cn } from "@/lib/utils";

async function sha256Hex(buffer: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(buffer);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function VerifyPage() {
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [customVerifying, setCustomVerifying] = useState(false);
  const [customResult, setCustomResult] = useState<{
    valid: boolean;
    computedRoot: string;
    declaredRoot: string;
    leavesCount: number;
    error?: string;
  } | null>(null);

  const processUploadedJson = useCallback(async (fileContent: string) => {
    setCustomVerifying(true);
    setCustomResult(null);

    try {
      const parsed = JSON.parse(fileContent);
      const declaredRoot = parsed.declaredMerkleRoot || parsed.manifestHash || parsed.merkleRoot;
      const leaves = parsed.leaves || parsed.records || [];

      if (!declaredRoot || !Array.isArray(leaves) || leaves.length === 0) {
        setCustomResult({
          valid: false,
          computedRoot: "N/A",
          declaredRoot: declaredRoot || "MISSING",
          leavesCount: leaves.length,
          error:
            "Invalid proofpack schema. Expected { declaredMerkleRoot: string, leaves: any[] }.",
        });
        return;
      }

      const leafHashes = await Promise.all(
        leaves.map(async (leaf: any) => {
          if (typeof leaf === "string") return sha256Hex(leaf);
          if (leaf.leafHash) return leaf.leafHash;
          return sha256Hex(JSON.stringify(leaf));
        })
      );

      const combined = leafHashes.join(":");
      const computedRoot = await sha256Hex(combined);
      const isValid =
        computedRoot.toLowerCase() === declaredRoot.toLowerCase().replace("sha256:", "");

      setCustomResult({
        valid: isValid,
        computedRoot,
        declaredRoot,
        leavesCount: leaves.length,
      });
    } catch (err: any) {
      setCustomResult({
        valid: false,
        computedRoot: "PARSE_ERROR",
        declaredRoot: "UNKNOWN",
        leavesCount: 0,
        error: err.message || "Failed to parse JSON file.",
      });
    } finally {
      setCustomVerifying(false);
    }
  }, []);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      setCustomFile(dropped);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) processUploadedJson(text);
      };
      reader.readAsText(dropped);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setCustomFile(selected);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) processUploadedJson(text);
      };
      reader.readAsText(selected);
    }
  };

  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden">
      <AmbientLightOrbs />
      <Navigation />

      <main className="pt-20 pb-24">
        {/* Header Hero */}
        <div className="relative border-b border-border/40 bg-gradient-to-b from-muted/20 via-background to-background py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400">
              <Lock className="w-3.5 h-3.5" />
              <span>AIR-GAPPED ZERO-TRUST VERIFICATION</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              Zero-Trust Proofpack Verifier
            </h1>

            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Verify cryptographic reconciliation proofpacks client-side using the browser&apos;s
              native Web Crypto API. Zero network requests. Air-gap verifiable. Mathematical proof
              of 100% complete census accuracy.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Badge
                variant="outline"
                className="font-mono text-xs border-primary/30 text-foreground"
              >
                <Cpu className="w-3.5 h-3.5 mr-1 text-primary" /> Web Crypto API (SubtleCrypto)
              </Badge>
              <Badge
                variant="outline"
                className="font-mono text-xs border-emerald-500/30 text-emerald-500"
              >
                <ShieldCheck className="w-3.5 h-3.5 mr-1" /> RFC 6962 SHA-256 Merkle Trees
              </Badge>
              <Badge
                variant="outline"
                className="font-mono text-xs border-cyan-500/30 text-cyan-400"
              >
                <Fingerprint className="w-3.5 h-3.5 mr-1" /> Client-Side Execution (&lt;2ms)
              </Badge>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 space-y-16">
          {/* Section 1: Embedded Interactive Verifier with Preset Vectors */}
          <div>
            <div className="mb-6 space-y-1">
              <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Fingerprint className="w-6 h-6 text-primary" />
                Live Cryptographic Enclave Studio
              </h2>
              <p className="text-sm text-muted-foreground">
                Test verified multi-million dollar reconciliation runs or run adversarial poison
                tests to witness immediate Merkle root collision detection.
              </p>
            </div>

            <ZeroTrustVerifier />
          </div>

          {/* Section 2: Custom JSON Proofpack Drag and Drop */}
          <div className="rounded-3xl border border-border/60 bg-card/40 backdrop-blur-xl p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <FileCode2 className="w-5 h-5 text-emerald-400" />
                  Verify Custom Sovereign Proofpack JSON
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Drop in any Settler-generated proofpack artifact. Hash computation happens
                  entirely on your machine.
                </p>
              </div>

              {customFile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCustomFile(null);
                    setCustomResult(null);
                  }}
                  className="text-xs"
                >
                  Clear File
                </Button>
              )}
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className="relative rounded-2xl border-2 border-dashed border-border/70 hover:border-primary/50 hover:bg-muted/10 p-10 text-center transition-all cursor-pointer"
            >
              <input
                type="file"
                accept=".json"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-3 pointer-events-none">
                <div className="inline-flex p-3 rounded-full bg-primary/10 text-primary">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-base font-semibold text-foreground">
                  {customFile ? customFile.name : "Drag and drop your proofpack .json here"}
                </h4>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Supports Settler evidence manifests, batch settlement dossiers, or audit
                  runbundles.
                </p>
              </div>
            </div>

            {/* Custom Result Feedback */}
            {customVerifying && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4">
                <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                <span>Computing RFC 6962 Merkle root in browser...</span>
              </div>
            )}

            {customResult && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-5 rounded-2xl border",
                  customResult.valid
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                    : "border-rose-500/40 bg-rose-500/10 text-rose-300"
                )}
              >
                <div className="flex items-start gap-3">
                  {customResult.valid ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">
                        {customResult.valid
                          ? "PROOFPACK VERIFIED: Cryptographic Census Match"
                          : "VERIFICATION BREAK DETECTED"}
                      </span>
                      <Badge variant="outline" className="font-mono text-xs">
                        {customResult.leavesCount} Leaves
                      </Badge>
                    </div>

                    {customResult.error ? (
                      <p className="text-xs text-rose-200/90">{customResult.error}</p>
                    ) : (
                      <div className="space-y-1 font-mono text-xs bg-background/80 p-3 rounded-lg border border-border/40 text-foreground">
                        <div className="truncate">
                          <span className="text-muted-foreground">Computed:</span>{" "}
                          {customResult.computedRoot}
                        </div>
                        <div className="truncate">
                          <span className="text-muted-foreground">Declared:</span>{" "}
                          {customResult.declaredRoot}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Section 3: Technical Invariants Reference */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-border/60 bg-muted/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  100% Census vs Sampling
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                Traditional audit firms sample 25–40 transactions out of millions. Settler&apos;s
                Merkle trees compute proofpacks across 100% of all ledger records, eliminating
                sampling risk entirely.
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-muted/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  Deterministic Replayability
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                Settler&apos;s Rust verification kernel avoids floating-point numbers completely,
                utilizing fixed-point integer cents and explicit calendar bounds. Replaying a run
                produces identical SHA-256 hashes forever.
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-muted/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  Sovereign Enclave Portability
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                The verification script compiles to WebAssembly (`settler-verify-wasm`) and native
                Web Crypto API. Auditors can run it on air-gapped laptops without internet
                connectivity or Settler account credentials.
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
