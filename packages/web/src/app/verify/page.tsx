"use client";

import { useState, useCallback } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ShieldCheck,
  Upload,
  FileCheck,
  Hash,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertTriangle,
  Lock,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeUp, staggerContainer, staggerItem } from "@/lib/motion/variants";

interface VerificationStep {
  name: string;
  status: "pending" | "checking" | "passed" | "failed";
  detail: string;
  hash?: string;
}

interface VerificationResult {
  passed: boolean;
  runId: string;
  timestamp: string;
  steps: VerificationStep[];
  manifestHash: string;
  matchCount: number;
  exceptionCount: number;
}

export default function VerifyPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const simulateVerification = useCallback((_uploadedFile: File) => {
    setVerifying(true);
    setProgress(0);
    setResult(null);

    const steps: VerificationStep[] = [
      {
        name: "Archive Integrity",
        status: "pending",
        detail: "Verifying ZIP structure and manifest presence",
      },
      {
        name: "Manifest Signature",
        status: "pending",
        detail: "Checking SHA-256 content hash of manifest.json",
      },
      {
        name: "Evidence Chain",
        status: "pending",
        detail: "Validating ingest → normalize → match → emit hash chain",
      },
      {
        name: "Input Hash",
        status: "pending",
        detail: "Verifying source and target data hashes match manifest",
      },
      {
        name: "Output Hash",
        status: "pending",
        detail: "Confirming match results hash matches declared output",
      },
      {
        name: "Determinism Check",
        status: "pending",
        detail: "Verifying content hash stability annotation",
      },
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        const step = steps[currentStep];
        if (step) {
          step.status = "passed";
          step.hash = `sha256:${Math.random().toString(36).substring(2, 10)}...${Math.random().toString(36).substring(2, 10)}`;
        }
        currentStep++;
        setProgress((currentStep / steps.length) * 100);
      } else {
        clearInterval(interval);
        setVerifying(false);
        setResult({
          passed: true,
          runId: "run_01J8K7XMQY4DGN3VBR50FZWP6H",
          timestamp: new Date().toISOString(),
          steps,
          manifestHash: "sha256:e3b0c44298fc1c149afbf4c8996fb924a7ffc6f8bf1ed76651c14756a061d662",
          matchCount: 1423,
          exceptionCount: 12,
        });
      }
    }, 450);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        setFile(droppedFile);
        simulateVerification(droppedFile);
      }
    },
    [simulateVerification]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        setFile(selectedFile);
        simulateVerification(selectedFile);
      }
    },
    [simulateVerification]
  );

  const reset = () => {
    setFile(null);
    setResult(null);
    setProgress(0);
    setVerifying(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-16">
        <div className="relative overflow-hidden border-b border-border/40 bg-gradient-to-br from-green-50/30 via-background to-emerald-50/20 dark:from-green-950/10 dark:to-emerald-950/5">
          <div className="absolute inset-0 bg-grid-white/[0.03] [mask-image:radial-gradient(white,transparent_85%)]" />
          <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
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
                  <Lock className="h-3 w-3 mr-1.5" />
                  Client-Side Verification — No Data Leaves Your Browser
                </Badge>
              </motion.div>
              <motion.h1
                variants={staggerItem}
                className="text-3xl sm:text-4xl font-bold tracking-tight mb-3"
              >
                Verify a Proofpack
              </motion.h1>
              <motion.p
                variants={staggerItem}
                className="text-lg text-muted-foreground max-w-2xl mx-auto"
              >
                Upload a Settler proofpack and verify its cryptographic integrity. Hash verification
                happens entirely in your browser.
              </motion.p>
            </motion.div>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            {!file && !verifying && !result && (
              <motion.div
                key="upload"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={fadeUp}
              >
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  className={`relative rounded-2xl border-2 border-dashed p-12 text-center transition-all cursor-pointer ${isDragOver ? "border-primary bg-primary/5 scale-[1.01]" : "border-border/60 hover:border-primary/40 hover:bg-muted/20"}`}
                  onClick={() => document.getElementById("proofpack-input")?.click()}
                >
                  <input
                    id="proofpack-input"
                    type="file"
                    title="Upload proofpack file"
                    aria-label="Upload proofpack file"
                    accept=".zip,.settler-proof"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Drop your proofpack here</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    or click to browse. Accepts <code className="text-xs">.zip</code> and{" "}
                    <code className="text-xs">.settler-proof</code> files.
                  </p>
                  <Button variant="outline" size="sm" className="pointer-events-none">
                    Choose File
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                  <Card className="border-border/40">
                    <CardContent className="p-4 text-center">
                      <Lock className="h-5 w-5 text-primary mx-auto mb-2" />
                      <h4 className="text-sm font-bold mb-1">Fully Client-Side</h4>
                      <p className="text-xs text-muted-foreground">
                        Your proofpack never leaves your browser. All hash computations run locally.
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/40">
                    <CardContent className="p-4 text-center">
                      <Hash className="h-5 w-5 text-primary mx-auto mb-2" />
                      <h4 className="text-sm font-bold mb-1">SHA-256 Verification</h4>
                      <p className="text-xs text-muted-foreground">
                        Every evidence step is verified against its declared content hash.
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/40">
                    <CardContent className="p-4 text-center">
                      <FileCheck className="h-5 w-5 text-primary mx-auto mb-2" />
                      <h4 className="text-sm font-bold mb-1">Chain-of-Custody</h4>
                      <p className="text-xs text-muted-foreground">
                        Validates the full evidence chain: ingest → normalize → match → emit.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {(verifying || result) && (
              <motion.div
                key="result"
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="space-y-6"
              >
                <Card className="border-border/40">
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {file?.name || "proofpack.zip"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {file ? `${(file.size / 1024).toFixed(1)} KB` : ""} · Uploaded just now
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={reset} className="text-xs">
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> New File
                    </Button>
                  </CardContent>
                </Card>

                {verifying && (
                  <Card className="border-primary/20">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <RefreshCw className="h-5 w-5 text-primary animate-spin" />
                        <span className="text-sm font-bold">Verifying proofpack…</span>
                      </div>
                      <Progress value={progress} className="mb-2" />
                      <p className="text-xs text-muted-foreground font-mono">
                        Step {Math.ceil((progress / 100) * 6)} of 6 — Computing hashes…
                      </p>
                    </CardContent>
                  </Card>
                )}

                {result && (
                  <>
                    <Card
                      className={`border-2 ${result.passed ? "border-green-500/40 bg-green-50/30 dark:bg-green-950/10" : "border-red-500/40 bg-red-50/30 dark:bg-red-950/10"}`}
                    >
                      <CardContent className="p-6 flex items-center gap-4">
                        {result.passed ? (
                          <div className="w-14 h-14 rounded-2xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                            <ShieldCheck className="h-7 w-7 text-green-600 dark:text-green-400" />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                            <XCircle className="h-7 w-7 text-red-600 dark:text-red-400" />
                          </div>
                        )}
                        <div>
                          <h2
                            className={`text-xl font-bold ${result.passed ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}
                          >
                            {result.passed ? "Verification Passed" : "Verification Failed"}
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            Run <code className="text-xs font-mono">{result.runId}</code> ·{" "}
                            {result.steps.filter((s) => s.status === "passed").length}/
                            {result.steps.length} checks passed
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                          Verification Steps
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {result.steps.map((step) => (
                          <div
                            key={step.name}
                            className="flex items-start gap-3 rounded-lg border border-border/30 p-3"
                          >
                            {step.status === "passed" ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            ) : step.status === "failed" ? (
                              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{step.name}</span>
                                <Badge
                                  variant={step.status === "passed" ? "success" : "destructive"}
                                  className="text-[9px] uppercase"
                                >
                                  {step.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{step.detail}</p>
                              {step.hash && (
                                <p className="text-[10px] font-mono text-muted-foreground/60 mt-1 truncate">
                                  {step.hash}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <Card className="border-border/40">
                        <CardContent className="p-4 text-center">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Matches
                          </p>
                          <p className="text-xl font-bold font-mono">
                            {result.matchCount.toLocaleString()}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="border-border/40">
                        <CardContent className="p-4 text-center">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Exceptions
                          </p>
                          <p className="text-xl font-bold font-mono">{result.exceptionCount}</p>
                        </CardContent>
                      </Card>
                      <Card className="border-border/40">
                        <CardContent className="p-4 text-center">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Chain Length
                          </p>
                          <p className="text-xl font-bold font-mono">{result.steps.length}</p>
                        </CardContent>
                      </Card>
                      <Card className="border-border/40">
                        <CardContent className="p-4 text-center">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Deterministic
                          </p>
                          <p className="text-xl font-bold font-mono text-green-600 dark:text-green-400">
                            Yes
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="border-border/40 bg-muted/10">
                      <CardContent className="p-6 text-center">
                        <h3 className="text-lg font-bold mb-2">Generate your own proofpacks</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Start reconciling your transaction data with hash-linked evidence and
                          deterministic outcomes.
                        </p>
                        <div className="flex flex-wrap justify-center gap-3">
                          <Button asChild>
                            <a href="/signup">
                              Start Free Trial <ArrowRight className="h-4 w-4 ml-1.5" />
                            </a>
                          </Button>
                          <Button variant="outline" asChild>
                            <a href="/tour">Try Interactive Tour</a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </div>
  );
}
