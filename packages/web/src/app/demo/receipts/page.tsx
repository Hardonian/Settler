"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileText, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem, stepTransition } from "@/lib/motion/variants";
import { loadReceipts, loadTransactions } from "../lib/data/loader";
import { matchReceiptToTransaction } from "../lib/matching/engine";
import type { Receipt, MatchResult } from "../lib/data/types";

type PipelineStep = "select" | "extract" | "normalize" | "match" | "resolve";

export default function ReceiptsDemoPage() {
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
  const [pipelineStep, setPipelineStep] = useState<PipelineStep>("select");

  const receipts = useMemo(() => loadReceipts(), []);
  const transactions = useMemo(() => loadTransactions(), []);

  const selectedReceipt = useMemo(
    () => receipts.find((r) => r.id === selectedReceiptId),
    [receipts, selectedReceiptId]
  );

  const matchResult = useMemo(() => {
    if (!selectedReceipt) return null;
    return matchReceiptToTransaction(selectedReceipt, transactions);
  }, [selectedReceipt, transactions]);

  const handleSelectReceipt = (receiptId: string) => {
    setSelectedReceiptId(receiptId);
    setPipelineStep("extract");
    // Simulate pipeline progression
    setTimeout(() => setPipelineStep("normalize"), 800);
    setTimeout(() => setPipelineStep("match"), 1500);
    setTimeout(() => setPipelineStep("resolve"), 2000);
  };

  const handleReset = () => {
    setSelectedReceiptId(null);
    setPipelineStep("select");
  };

  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      "SaaS Subscription": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      Meals: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      "Office Supplies": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
      Fuel: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
      "Marketplace Purchase": "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
      Travel: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
    };
    return colors[category || ""] || "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300";
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
              Receipt Ingestion Demo
            </h1>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Select a receipt to see how it&apos;s extracted, normalized, and matched to transactions.
          </p>
        </div>

        {/* Receipt Selection */}
        {!selectedReceiptId && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="mb-8"
          >
            <Card elevation="default">
              <CardHeader>
                <CardTitle>Select a Receipt</CardTitle>
                <CardDescription>
                  Choose a receipt to process through the ingestion pipeline.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {receipts.map((receipt) => (
                    <motion.div
                      key={receipt.id}
                      variants={staggerItem}
                      className="p-4 border rounded-lg hover:border-blue-500 cursor-pointer transition-colors"
                      onClick={() => handleSelectReceipt(receipt.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900 dark:text-white mb-1">
                            {receipt.vendor_name}
                          </div>
                          <Badge className={getCategoryColor(receipt.category)}>
                            {receipt.category || "Uncategorized"}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">${receipt.total_amount.toFixed(2)}</div>
                        </div>
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {new Date(receipt.date).toLocaleDateString()}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Pipeline View */}
        {selectedReceipt && (
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedReceipt.id}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={stepTransition}
            >
              <Card elevation="default" className="mb-8">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Receipt Processing Pipeline</CardTitle>
                      <CardDescription>
                        Watch the receipt transform through each stage of processing.
                      </CardDescription>
                    </div>
                    <Button onClick={handleReset} variant="outline" size="sm">
                      Select Different Receipt
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Pipeline Steps */}
                  <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4">
                    {[
                      { id: "select", label: "Select", icon: FileText },
                      { id: "extract", label: "Extract", icon: FileText },
                      { id: "normalize", label: "Normalize", icon: FileText },
                      { id: "match", label: "Match", icon: FileText },
                      { id: "resolve", label: "Resolve", icon: FileText },
                    ].map((step, index) => {
                      const Icon = step.icon;
                      const isActive = pipelineStep === step.id;
                      const isCompleted =
                        ["extract", "normalize", "match", "resolve"].indexOf(pipelineStep) >
                        ["extract", "normalize", "match", "resolve"].indexOf(step.id);

                      return (
                        <div key={step.id} className="flex items-center flex-1 min-w-0">
                          <div className="flex flex-col items-center flex-1 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
                                isCompleted
                                  ? "bg-green-500 text-white"
                                  : isActive
                                    ? "bg-blue-500 text-white"
                                    : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                              }`}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="w-5 h-5" />
                              ) : (
                                <Icon className="w-5 h-5" />
                              )}
                            </div>
                            <span
                              className={`text-xs text-center ${
                                isActive || isCompleted
                                  ? "text-slate-900 dark:text-white font-medium"
                                  : "text-slate-500"
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                          {index < 4 && (
                            <div
                              className={`h-0.5 flex-1 mx-2 transition-colors ${
                                isCompleted ? "bg-green-500" : "bg-slate-200 dark:bg-slate-700"
                              }`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Receipt View */}
                  <Tabs defaultValue="receipt" className="space-y-4">
                    <TabsList>
                      <TabsTrigger value="receipt">Receipt View</TabsTrigger>
                      <TabsTrigger value="normalized">Normalized JSON</TabsTrigger>
                      <TabsTrigger value="match">Match Result</TabsTrigger>
                    </TabsList>

                    <TabsContent value="receipt">
                      <Card elevation="sm">
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            <div className="flex justify-between items-start border-b pb-4">
                              <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                  {selectedReceipt.vendor_name}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                  {selectedReceipt.receipt_number || "No receipt number"}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                  ${selectedReceipt.total_amount.toFixed(2)}
                                </div>
                                <Badge className={getCategoryColor(selectedReceipt.category)}>
                                  {selectedReceipt.category || "Uncategorized"}
                                </Badge>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                Date: {new Date(selectedReceipt.date).toLocaleDateString()}
                              </div>
                              {selectedReceipt.payment_method && (
                                <div className="text-sm text-slate-600 dark:text-slate-400">
                                  Payment: {selectedReceipt.payment_method}
                                </div>
                              )}
                            </div>

                            {selectedReceipt.items && selectedReceipt.items.length > 0 && (
                              <div className="border-t pt-4">
                                <div className="text-sm font-semibold mb-2 text-slate-900 dark:text-white">
                                  Items:
                                </div>
                                <div className="space-y-2">
                                  {selectedReceipt.items.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="flex justify-between text-sm text-slate-600 dark:text-slate-400"
                                    >
                                      <span>
                                        {item.description}
                                        {item.quantity && item.quantity > 1 && ` × ${item.quantity}`}
                                      </span>
                                      <span>${item.total.toFixed(2)}</span>
                                    </div>
                                  ))}
                                </div>
                                {selectedReceipt.tax_amount && selectedReceipt.tax_amount > 0 && (
                                  <div className="flex justify-between text-sm mt-2 pt-2 border-t">
                                    <span className="text-slate-600 dark:text-slate-400">Tax:</span>
                                    <span className="text-slate-600 dark:text-slate-400">
                                      ${selectedReceipt.tax_amount.toFixed(2)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="normalized">
                      <Card elevation="sm">
                        <CardContent className="p-6">
                          <div className="text-xs font-mono bg-slate-900 text-green-400 p-4 rounded overflow-x-auto">
                            <pre>{JSON.stringify(selectedReceipt, null, 2)}</pre>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="match">
                      <Card elevation="sm">
                        <CardContent className="p-6">
                          {matchResult ? (
                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                <span className="font-semibold text-slate-900 dark:text-white">
                                  Match Found
                                </span>
                                <Badge variant="default">{matchResult.confidence}</Badge>
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                Matched using rule: {matchResult.rule_used.replace(/_/g, " ")}
                              </div>
                              <div className="space-y-2">
                                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                  Evidence:
                                </div>
                                {matchResult.evidence.map((ev, idx) => (
                                  <div
                                    key={idx}
                                    className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2 rounded"
                                  >
                                    <span className="font-medium">{ev.field}:</span> {String(ev.source_value)} = {String(ev.target_value)} ({ev.match_type})
                                  </div>
                                ))}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t">
                                Audit Trail ID: {matchResult.audit_trail_id}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                              <XCircle className="w-5 h-5 text-yellow-500" />
                              <span>No match found. This receipt requires manual review.</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Trust Notice */}
        <Card elevation="sm" className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              <strong>Deterministic demo data.</strong> Production ingestion uses secure pipelines
              with encryption, validation, and audit logging. This demo shows the transformation
              process only.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
