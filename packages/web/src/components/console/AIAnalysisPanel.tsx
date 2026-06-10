/**
 * Analysis Panel Component
 *
 * Advanced analysis with token management for Growth and Enterprise tiers.
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles, Zap, TrendingUp, AlertTriangle, Plus, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { FreezeErrorAlert } from "@/components/shared/FreezeErrorAlert";
import {
  getApiErrorMessage,
  getGovernanceRecoveryHref,
  parseGovernanceFreezeError,
  type GovernanceFreezeErrorDetails,
} from "@/lib/governance/freeze-client";

interface TokenUsage {
  used: number;
  limit: number;
  period: "day" | "week" | "month";
  resetDate: Date;
}

interface AIAnalysis {
  id: string;
  type: "reconciliation" | "change_detection" | "anomaly" | "prediction";
  input: string;
  result: {
    summary: string;
    insights: string[];
    recommendations: string[];
    confidence: number;
  };
  tokensUsed: number;
  createdAt: Date;
}

export function AnalysisPanel() {
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const [analyses, setAnalyses] = useState<AIAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AIAnalysis | null>(null);
  const [freezeError, setFreezeError] = useState<GovernanceFreezeErrorDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTokenUsage();
    fetchAnalyses();
  }, []);

  const fetchTokenUsage = async () => {
    try {
      const res = await fetch("/api/console/ai-tokens/usage");
      if (res.ok) {
        const data = await res.json();
        setTokenUsage(data.usage);
      }
    } catch (error: unknown) {
      console.error("Failed to fetch token usage:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalyses = async () => {
    try {
      const res = await fetch("/api/console/ai-analysis");
      if (res.ok) {
        const data = await res.json();
        setAnalyses(data.analyses || []);
      }
    } catch (error: unknown) {
      console.error("Failed to fetch analyses:", error);
    }
  };

  const runAnalysis = async (type: AIAnalysis["type"]) => {
    if (!tokenUsage || tokenUsage.used >= tokenUsage.limit) {
      setShowPurchaseDialog(true);
      return;
    }

    try {
      setRunning(true);
      setFreezeError(null);
      setError(null);
      const res = await fetch("/api/console/ai-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      const payload = (await res.json().catch(() => null)) as unknown;
      const freezeDetails = parseGovernanceFreezeError(payload, res.status);

      if (freezeDetails) {
        setFreezeError(freezeDetails);
        return;
      }

      if (res.ok) {
        const data = payload as { analysis: AIAnalysis };
        setAnalyses([data.analysis, ...analyses]);
        await fetchTokenUsage();
      } else if (res.status === 402) {
        // Payment required - tokens exhausted
        setShowPurchaseDialog(true);
      } else {
        throw new Error(getApiErrorMessage(payload, "Failed to run analysis"));
      }
    } catch (err: unknown) {
      console.error("Failed to run analysis:", err);
      setError(err instanceof Error ? err.message : "Failed to run analysis");
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  const usagePercent = tokenUsage ? Math.min((tokenUsage.used / tokenUsage.limit) * 100, 100) : 0;
  const remaining = tokenUsage ? tokenUsage.limit - tokenUsage.used : 0;
  const isExhausted = remaining === 0;

  return (
    <div className="space-y-6">
      {freezeError ? (
        <FreezeErrorAlert
          reason={freezeError.reason}
          frozenAt={freezeError.frozenAt ?? undefined}
          recoveryAction={{
            label: "Open Governance Controls",
            href: getGovernanceRecoveryHref(),
          }}
        />
      ) : null}

      {error ? (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
          {error}
        </div>
      ) : null}

      {/* Token Usage Card */}
      <Card className="border-2 border-indigo-200 dark:border-indigo-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              <CardTitle>AI Analysis Tokens</CardTitle>
            </div>
            <Badge
              variant={isExhausted ? "destructive" : "default"}
              className={
                isExhausted
                  ? ""
                  : "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400"
              }
            >
              {isExhausted ? "Exhausted" : `${remaining} remaining`}
            </Badge>
          </div>
          <CardDescription>
            {tokenUsage?.limit === -1
              ? "Unlimited analyses available"
              : `${tokenUsage?.used || 0} of ${tokenUsage?.limit || 0} used this ${tokenUsage?.period || "month"}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tokenUsage && tokenUsage.limit !== -1 && (
            <div className="space-y-4">
              <Progress value={usagePercent} className="h-3" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Resets {new Date(tokenUsage.resetDate).toLocaleDateString()}
                </span>
                <span className="font-medium">
                  {tokenUsage.used} / {tokenUsage.limit}
                </span>
              </div>
            </div>
          )}

          {isExhausted && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900 dark:text-red-300 mb-1">
                    Tokens Exhausted
                  </p>
                  <p className="text-sm text-red-800 dark:text-red-400 mb-3">
                    Purchase add-on tokens or wait for reset to run more analyses.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setShowPurchaseDialog(true)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Purchase Tokens
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Types */}
      <Card>
        <CardHeader>
          <CardTitle>Run AI Analysis</CardTitle>
          <CardDescription>Get deeper insights with AI-powered analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                type: "reconciliation" as const,
                title: "Reconciliation Analysis",
                description: "Deep dive into reconciliation patterns and anomalies",
                icon: <RefreshCw className="w-6 h-6" />,
              },
              {
                type: "change_detection" as const,
                title: "Change Detection",
                description: "Identify meaningful patterns in changes",
                icon: <TrendingUp className="w-6 h-6" />,
              },
              {
                type: "anomaly" as const,
                title: "Anomaly Detection",
                description: "Detect unusual patterns and outliers",
                icon: <AlertTriangle className="w-6 h-6" />,
              },
              {
                type: "prediction" as const,
                title: "Predictive Analysis",
                description: "Forecast future trends and issues",
                icon: <Zap className="w-6 h-6" />,
              },
            ].map((analysisType) => (
              <motion.div
                key={analysisType.type}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                        {analysisType.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{analysisType.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {analysisType.description}
                        </p>
                        <Button
                          size="sm"
                          onClick={() => runAnalysis(analysisType.type)}
                          disabled={running || isExhausted}
                          className="w-full"
                        >
                          {running ? (
                            <>
                              <div className="w-4 h-4 mr-2 animate-spin rounded-full border-b-2 border-white"></div>
                              Running...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Run Analysis
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Analyses */}
      {analyses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Analyses</CardTitle>
            <CardDescription>Your AI-powered insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyses.slice(0, 5).map((analysis) => (
                <motion.div
                  key={analysis.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 border rounded-lg hover:bg-muted/10 dark:hover:bg-card/80 cursor-pointer"
                  onClick={() => setSelectedAnalysis(analysis)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{analysis.type}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {analysis.tokensUsed} tokens
                        </span>
                      </div>
                      <p className="font-medium mb-1">{analysis.result.summary}</p>
                      <p className="text-sm text-muted-foreground">
                        {analysis.result.insights.length} insights •{" "}
                        {analysis.result.recommendations.length} recommendations
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        analysis.result.confidence > 0.8
                          ? "border-green-500 text-green-700"
                          : analysis.result.confidence > 0.6
                            ? "border-yellow-500 text-yellow-700"
                            : "border-red-500 text-red-700"
                      }
                    >
                      {Math.round(analysis.result.confidence * 100)}% confidence
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Purchase Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Purchase AI Analysis Tokens</DialogTitle>
            <DialogDescription>Add more AI analysis tokens to your plan</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {[
                { tokens: 10, price: 9.99 },
                { tokens: 50, price: 39.99 },
                { tokens: 100, price: 69.99 },
              ].map((package_) => (
                <Card key={package_.tokens} className="cursor-pointer hover:border-blue-500">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold mb-1">{package_.tokens}</div>
                    <div className="text-sm text-muted-foreground mb-2">tokens</div>
                    <div className="text-lg font-semibold">${package_.price}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button className="w-full">Purchase Tokens</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Analysis Detail Dialog */}
      {selectedAnalysis && (
        <Dialog open={!!selectedAnalysis} onOpenChange={() => setSelectedAnalysis(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedAnalysis.type.replace("_", " ")} Analysis</DialogTitle>
              <DialogDescription>
                {new Date(selectedAnalysis.createdAt).toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Summary</h3>
                <p className="text-sm text-muted-foreground">{selectedAnalysis.result.summary}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Key Insights</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {selectedAnalysis.result.insights.map((insight, idx) => (
                    <li key={idx}>{insight}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Recommendations</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {selectedAnalysis.result.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
