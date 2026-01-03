"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Play, RotateCcw, CheckCircle2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { fadeUp, staggerContainer, staggerItem, stepTransition } from "@/lib/motion/variants";
import {
  loadTransactions,
  getSourceTransactions,
  getTargetTransactions,
  enrichTransaction,
} from "../lib/data/loader";
import { matchTransactions, DEFAULT_MATCHING_RULES } from "../lib/matching/engine";
import type { Transaction, MatchResult } from "../lib/data/types";

type RunState = "before" | "running" | "after";

export default function ReconciliationDemoPage() {
  const [runState, setRunState] = useState<RunState>("before");
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);

  // Load demo data
  const sourceTransactions = useMemo(() => getSourceTransactions(), []);
  const targetTransactions = useMemo(() => getTargetTransactions(), []);
  const enrichedSources = useMemo(
    () => sourceTransactions.map(enrichTransaction),
    [sourceTransactions]
  );
  const enrichedTargets = useMemo(
    () => targetTransactions.map(enrichTransaction),
    [targetTransactions]
  );

  // Run matching
  const matches = useMemo(() => {
    if (runState === "after") {
      return matchTransactions(sourceTransactions, targetTransactions, DEFAULT_MATCHING_RULES);
    }
    return [];
  }, [runState, sourceTransactions, targetTransactions]);

  const matchedSourceIds = new Set(matches.map((m) => m.source_transaction_id));
  const matchedTargetIds = new Set(matches.map((m) => m.target_transaction_id));

  const unmatchedSources = enrichedSources.filter((t) => !matchedSourceIds.has(t.id));
  const unmatchedTargets = enrichedTargets.filter((t) => !matchedTargetIds.has(t.id));

  const handleRun = () => {
    setRunState("running");
    setCurrentStep(0);

    // Simulate step-by-step progression
    const steps = [
      { name: "Normalize", delay: 500 },
      { name: "Group", delay: 800 },
      { name: "Match", delay: 1200 },
      { name: "Flag Conflicts", delay: 1500 },
      { name: "Generate Audit Trail", delay: 1800 },
    ];

    let stepIndex = 0;
    const runSteps = () => {
      if (stepIndex < steps.length) {
        setCurrentStep(stepIndex);
        setTimeout(() => {
          stepIndex++;
          runSteps();
        }, steps[stepIndex].delay);
      } else {
        setRunState("after");
      }
    };
    runSteps();
  };

  const handleReset = () => {
    setRunState("before");
    setCurrentStep(0);
    setSelectedMatch(null);
  };

  const getConfidenceBadge = (confidence: string) => {
    const variants = {
      exact: "default",
      high: "default",
      medium: "secondary",
      low: "outline",
      none: "destructive",
    } as const;

    return (
      <Badge variant={variants[confidence as keyof typeof variants] || "outline"}>
        {confidence}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/demo">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Demo
            </Button>
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <Badge variant="outline">Demo Mode</Badge>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              Reconciliation Engine Demo
            </h1>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Watch transactions from Stripe, Shopify, QuickBooks, and bank payouts get matched
            automatically using deterministic rules.
          </p>
        </div>

        {/* Run Controls */}
        <Card className="mb-8" elevation="default">
          <CardHeader>
            <CardTitle>Reconciliation Run</CardTitle>
            <CardDescription>
              {runState === "before" &&
                "Click 'Run Reconciliation' to start the matching process."}
              {runState === "running" && "Processing transactions..."}
              {runState === "after" && "Reconciliation complete. Review matches below."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button onClick={handleRun} disabled={runState !== "before"} size="lg">
                <Play className="w-4 h-4 mr-2" />
                Run Reconciliation
              </Button>
              {runState === "after" && (
                <Button onClick={handleReset} variant="outline" size="lg">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              )}
            </div>

            {/* Step Progress */}
            {runState === "running" && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="mt-6 space-y-2"
              >
                {[
                  "Normalize transactions",
                  "Group by source/target",
                  "Apply matching rules",
                  "Flag conflicts",
                  "Generate audit trail",
                ].map((step, index) => (
                  <motion.div
                    key={step}
                    variants={staggerItem}
                    className={`flex items-center gap-2 ${
                      index <= currentStep ? "text-slate-900 dark:text-white" : "text-slate-400"
                    }`}
                  >
                    {index < currentStep ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : index === currentStep ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <RefreshCw className="w-5 h-5 text-blue-500" />
                      </motion.div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                    )}
                    <span>{step}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <AnimatePresence mode="wait">
          {runState === "before" && (
            <motion.div
              key="before"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={stepTransition}
            >
              <Card elevation="default">
                <CardHeader>
                  <CardTitle>Before Reconciliation</CardTitle>
                  <CardDescription>
                    {sourceTransactions.length} source transactions and{" "}
                    {targetTransactions.length} target transactions waiting to be matched.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-2 text-slate-900 dark:text-white">
                        Source Transactions ({sourceTransactions.length})
                      </h3>
                      <div className="space-y-2">
                        {enrichedSources.slice(0, 5).map((tx) => (
                          <div
                            key={tx.id}
                            className="p-3 bg-slate-50 dark:bg-slate-800 rounded border text-sm"
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-medium">{tx.source}</span>
                              <span className="text-slate-600 dark:text-slate-400">
                                ${tx.amount.toFixed(2)}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-500">
                              {new Date(tx.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2 text-slate-900 dark:text-white">
                        Target Transactions ({targetTransactions.length})
                      </h3>
                      <div className="space-y-2">
                        {enrichedTargets.slice(0, 5).map((tx) => (
                          <div
                            key={tx.id}
                            className="p-3 bg-slate-50 dark:bg-slate-800 rounded border text-sm"
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-medium">{tx.source}</span>
                              <span className="text-slate-600 dark:text-slate-400">
                                ${tx.amount.toFixed(2)}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-500">
                              {new Date(tx.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {runState === "after" && (
            <motion.div
              key="after"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={stepTransition}
            >
              <Tabs defaultValue="matches" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="matches">
                    Matches ({matches.length})
                  </TabsTrigger>
                  <TabsTrigger value="unmatched">
                    Unmatched ({unmatchedSources.length + unmatchedTargets.length})
                  </TabsTrigger>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                </TabsList>

                <TabsContent value="matches">
                  <Card elevation="default">
                    <CardHeader>
                      <CardTitle>Matched Transactions</CardTitle>
                      <CardDescription>
                        {matches.length} transactions matched using deterministic rules.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {matches.map((match) => {
                          const source = enrichedSources.find((t) => t.id === match.source_transaction_id);
                          const target = enrichedTargets.find((t) => t.id === match.target_transaction_id);

                          return (
                            <motion.div
                              key={match.id}
                              initial="hidden"
                              animate="visible"
                              variants={fadeUp}
                              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                selectedMatch?.id === match.id
                                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                  : "hover:border-slate-300 dark:hover:border-slate-700"
                              }`}
                              onClick={() => setSelectedMatch(match)}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm">
                                      {source?.source} → {target?.source}
                                    </span>
                                    {getConfidenceBadge(match.confidence)}
                                  </div>
                                  <div className="text-sm text-slate-600 dark:text-slate-400">
                                    Rule: {match.rule_used.replace(/_/g, " ")}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-semibold">
                                    ${source?.amount.toFixed(2)} = ${target?.amount.toFixed(2)}
                                  </div>
                                </div>
                              </div>

                              {selectedMatch?.id === match.id && (
                                <motion.div
                                  initial="hidden"
                                  animate="visible"
                                  variants={fadeUp}
                                  className="mt-4 pt-4 border-t space-y-2"
                                >
                                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                    Evidence:
                                  </div>
                                  {match.evidence.map((ev, idx) => (
                                    <div key={idx} className="text-xs text-slate-600 dark:text-slate-300">
                                      <span className="font-medium">{ev.field}:</span> {String(ev.source_value)} = {String(ev.target_value)} ({ev.match_type})
                                    </div>
                                  ))}
                                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                    Audit Trail ID: {match.audit_trail_id}
                                  </div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400">
                                    Hash: {match.deterministic_hash.substring(0, 16)}...
                                  </div>
                                </motion.div>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="unmatched">
                  <Card elevation="default">
                    <CardHeader>
                      <CardTitle>Unmatched Transactions</CardTitle>
                      <CardDescription>
                        Transactions that couldn&apos;t be matched automatically.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {unmatchedSources.length > 0 && (
                          <div>
                            <h3 className="font-semibold mb-3 text-slate-900 dark:text-white">
                              Unmatched Sources ({unmatchedSources.length})
                            </h3>
                            <div className="space-y-2">
                              {unmatchedSources.map((tx) => (
                                <div
                                  key={tx.id}
                                  className="p-3 bg-slate-50 dark:bg-slate-800 rounded border text-sm flex justify-between"
                                >
                                  <div>
                                    <span className="font-medium">{tx.source}</span>
                                    <span className="text-slate-500 dark:text-slate-400 ml-2">
                                      {new Date(tx.timestamp).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <span className="text-slate-600 dark:text-slate-400">
                                    ${tx.amount.toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {unmatchedTargets.length > 0 && (
                          <div>
                            <h3 className="font-semibold mb-3 text-slate-900 dark:text-white">
                              Unmatched Targets ({unmatchedTargets.length})
                            </h3>
                            <div className="space-y-2">
                              {unmatchedTargets.map((tx) => (
                                <div
                                  key={tx.id}
                                  className="p-3 bg-slate-50 dark:bg-slate-800 rounded border text-sm flex justify-between"
                                >
                                  <div>
                                    <span className="font-medium">{tx.source}</span>
                                    <span className="text-slate-500 dark:text-slate-400 ml-2">
                                      {new Date(tx.timestamp).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <span className="text-slate-600 dark:text-slate-400">
                                    ${tx.amount.toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="summary">
                  <Card elevation="default">
                    <CardHeader>
                      <CardTitle>Reconciliation Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded border">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {matches.filter((m) => m.confidence === "exact").length}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            Exact Matches
                          </div>
                        </div>
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded border">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {matches.filter((m) => m.confidence === "high").length}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            High Confidence
                          </div>
                        </div>
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded border">
                          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                            {matches.filter((m) => m.confidence === "medium" || m.confidence === "low").length}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            Review Needed
                          </div>
                        </div>
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded border">
                          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {unmatchedSources.length + unmatchedTargets.length}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            Unmatched
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
