/**
 * Ingestion Dashboard Component
 * Displays ingestion results, transactions, and reconciliation status
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2, Clock, FileText, Download, RefreshCw } from "lucide-react";

interface Ingestion {
  id: string;
  sourceId: string;
  status: "pending" | "processing" | "completed" | "failed";
  rawRecordCount: number;
  normalizedCount: number;
  failedCount: number;
  startedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
}

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  date: string;
  description: string | null;
  externalId: string | null;
  category: string | null;
}

interface ReconciliationRun {
  id: string;
  status: string;
  matchedCount: number;
  unmatchedSourceCount: number;
  confidenceAvg: number | null;
  startedAt: string;
  completedAt: string | null;
}

export function IngestionDashboard({ ingestionId }: { ingestionId: string }) {
  const [ingestion, setIngestion] = useState<Ingestion | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reconciliationRuns, setReconciliationRuns] = useState<ReconciliationRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [ingestionId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load ingestion details
      const ingestionRes = await fetch(`/api/v1/ingestion/${ingestionId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("apiKey")}`,
        },
      });

      if (!ingestionRes.ok) {
        throw new Error("Failed to load ingestion");
      }

      const ingestionData = await ingestionRes.json();
      setIngestion(ingestionData);

      // Load transactions
      const transactionsRes = await fetch(`/api/v1/ingestion/${ingestionId}/transactions`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("apiKey")}`,
        },
      });

      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        setTransactions(transactionsData.transactions || []);
      }

      // Load reconciliation runs (if any)
      // This would need a new endpoint: GET /api/v1/reconciliation/runs?ingestionId=...
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "processing":
        return <Badge className="bg-blue-500">Processing</Badge>;
      case "failed":
        return <Badge className="bg-red-500">Failed</Badge>;
      default:
        return <Badge className="bg-gray-500">Pending</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "processing":
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
      case "failed":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!ingestion) {
    return null;
  }

  const successRate =
    ingestion.rawRecordCount > 0
      ? ((ingestion.normalizedCount / ingestion.rawRecordCount) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Ingestion Details</CardTitle>
              <CardDescription>Ingestion ID: {ingestion.id.slice(0, 8)}...</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(ingestion.status)}
              {getStatusBadge(ingestion.status)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-500">Total Rows</div>
              <div className="text-2xl font-bold">{ingestion.rawRecordCount}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Normalized</div>
              <div className="text-2xl font-bold text-green-600">{ingestion.normalizedCount}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Failed</div>
              <div className="text-2xl font-bold text-red-600">{ingestion.failedCount}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Success Rate</div>
              <div className="text-2xl font-bold">{successRate}%</div>
            </div>
          </div>
          {ingestion.status === "processing" && (
            <div className="mt-4">
              <Progress
                value={parseFloat(successRate)}
                className="h-2"
              />
            </div>
          )}
          {ingestion.errorMessage && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <div className="text-sm font-medium text-red-800">Error:</div>
              <div className="text-sm text-red-600">{ingestion.errorMessage}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>{transactions.length} normalized transactions</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>External ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                      <TableCell className="max-w-xs truncate">{tx.description || "-"}</TableCell>
                      <TableCell className="text-right font-medium">
                        ${tx.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>{tx.currency}</TableCell>
                      <TableCell>{tx.category || "-"}</TableCell>
                      <TableCell className="font-mono text-xs">{tx.externalId || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Reconciliation Runs */}
      {reconciliationRuns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Reconciliation Runs</CardTitle>
            <CardDescription>Matching results for this ingestion</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reconciliationRuns.map((run) => (
                <div
                  key={run.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Run {run.id.slice(0, 8)}...</div>
                      <div className="text-sm text-gray-500">
                        {run.matchedCount} matched, {run.unmatchedSourceCount} unmatched
                      </div>
                    </div>
                    <div className="text-right">
                      {run.confidenceAvg && (
                        <div className="text-sm font-medium">
                          {(run.confidenceAvg * 100).toFixed(1)}% confidence
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        {new Date(run.startedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
