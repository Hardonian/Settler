/**
 * Receipt Matching Component
 * Shows receipt-to-transaction matches and allows verification
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertTriangle, RefreshCw, Upload, Loader2 } from "lucide-react";
import { useGovernanceState } from "@/hooks/use-governance-state";
import { FreezeBlockedButton } from "@/components/shared/FreezeBlockedButton";

interface ReceiptMatch {
  id: string;
  receiptId: string;
  transactionId: string;
  confidence: "high" | "medium" | "low" | "manual";
  confidenceScore: number;
  verified: boolean;
}

interface Receipt {
  id: string;
  amount: number;
  currency: string;
  date: string;
}

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  date: string;
}

export function ReceiptMatching() {
  const [matches, setMatches] = useState<ReceiptMatch[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reconciliationRunId, setReconciliationRunId] = useState<string>("");
  const [matching, setMatching] = useState(false);
  const { isFrozen, governanceState } = useGovernanceState();

  const fetchMatches = async () => {
    if (!reconciliationRunId) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/v1/receipt-matching/matches/${reconciliationRunId}`);
      if (!res.ok) throw new Error("Failed to fetch matches");

      const data = await res.json();
      setMatches(data.data || []);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to load matches");
    } finally {
      setLoading(false);
    }
  };

  const fetchReceiptsAndTransactions = async (
    runId: string
  ): Promise<{ receipts: Receipt[]; transactions: Transaction[] }> => {
    // Fetch receipts for the reconciliation run
    const receiptsRes = await fetch(`/api/v1/receipts?reconciliationRunId=${runId}`);
    const transactionsRes = await fetch(`/api/v1/transactions?reconciliationRunId=${runId}`);

    let receipts: Receipt[] = [];
    let transactions: Transaction[] = [];

    if (receiptsRes.ok) {
      const receiptsData = await receiptsRes.json();
      receipts = receiptsData.data || [];
    }

    if (transactionsRes.ok) {
      const transactionsData = await transactionsRes.json();
      transactions = transactionsData.data || [];
    }

    return { receipts, transactions };
  };

  const handleMatchReceipts = async () => {
    if (!reconciliationRunId) {
      setError("Reconciliation run ID is required");
      return;
    }

    try {
      setMatching(true);
      setError(null);

      // First, fetch the actual receipts and transactions for this run
      const { receipts, transactions } = await fetchReceiptsAndTransactions(reconciliationRunId);

      // Store for display
      setReceipts(receipts);
      setTransactions(transactions);

      // Check if we have data to match
      if (receipts.length === 0 && transactions.length === 0) {
        setError(
          "No receipts or transactions found for this reconciliation run. Please verify the run ID or ensure data has been ingested."
        );
        return;
      }

      // Send meaningful payload to the API
      const res = await fetch("/api/v1/receipt-matching/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reconciliationRunId,
          receipts: receipts.map((r) => ({
            id: r.id,
            amount: r.amount,
            currency: r.currency,
            date: r.date,
          })),
          transactions: transactions.map((t) => ({
            id: t.id,
            amount: t.amount,
            currency: t.currency,
            date: t.date,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to match receipts");
      }

      await fetchMatches();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to match receipts");
    } finally {
      setMatching(false);
    }
  };

  const handleVerify = async (linkId: string) => {
    try {
      const res = await fetch(`/api/v1/receipt-matching/links/${linkId}/verify`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to verify link");
      await fetchMatches();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to verify link");
    }
  };

  const getConfidenceBadge = (confidence: string, score: number) => {
    const color =
      confidence === "high"
        ? "bg-green-500"
        : confidence === "medium"
          ? "bg-yellow-500"
          : confidence === "low"
            ? "bg-orange-500"
            : "bg-blue-500";

    return (
      <Badge className={color}>
        {confidence.toUpperCase()} ({(score * 100).toFixed(0)}%)
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Receipt Auto-Matching</CardTitle>
          <CardDescription>Match receipts to transactions automatically</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <div className="flex-1">
              <Label>Reconciliation Run ID</Label>
              <Input
                value={reconciliationRunId}
                onChange={(e) => setReconciliationRunId(e.target.value)}
                placeholder="Enter reconciliation run ID"
              />
            </div>
            <div className="flex items-end gap-2">
              <FreezeBlockedButton
                onClick={handleMatchReceipts}
                disabled={matching || !reconciliationRunId}
                isFrozen={isFrozen}
                freezeReason={governanceState?.freeze_reason}
                frozenMessage="Receipt matching blocked by tenant freeze"
              >
                {matching ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Match Receipts
              </FreezeBlockedButton>
              <Button
                variant="outline"
                onClick={fetchMatches}
                disabled={loading || !reconciliationRunId}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>

          {/* Data availability info */}
          {reconciliationRunId && !matching && (
            <div className="text-sm text-muted-foreground">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading data...
                </span>
              ) : receipts.length > 0 || transactions.length > 0 ? (
                <span>
                  Found {receipts.length} receipts and {transactions.length} transactions for
                  matching
                </span>
              ) : (
                <span>Click "Match Receipts" to fetch and match data</span>
              )}
            </div>
          )}

          {matches.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Matches ({matches.length})</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt ID</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matches.map((match) => (
                    <TableRow key={match.id}>
                      <TableCell className="font-mono text-xs">
                        {match.receiptId.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {match.transactionId.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        {getConfidenceBadge(match.confidence, match.confidenceScore)}
                      </TableCell>
                      <TableCell>
                        {match.verified ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline">Unverified</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {!match.verified && (
                          <FreezeBlockedButton
                            size="sm"
                            variant="outline"
                            onClick={() => handleVerify(match.id)}
                            isFrozen={isFrozen}
                            freezeReason={governanceState?.freeze_reason}
                            frozenMessage="Match verification blocked by tenant freeze"
                          >
                            Verify
                          </FreezeBlockedButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {matches.length === 0 && !loading && reconciliationRunId && !matching && (
            <Alert>
              <AlertDescription>No matches found for this reconciliation run</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
