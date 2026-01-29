/**
 * Receipt Matching Component
 * Shows receipt-to-transaction matches and allows verification
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, AlertTriangle, RefreshCw, Upload } from 'lucide-react';

interface ReceiptMatch {
  id: string;
  receiptId: string;
  transactionId: string;
  confidence: 'high' | 'medium' | 'low' | 'manual';
  confidenceScore: number;
  verified: boolean;
}

export function ReceiptMatching() {
  const [matches, setMatches] = useState<ReceiptMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reconciliationRunId, setReconciliationRunId] = useState<string>('');
  const [matching, setMatching] = useState(false);

  const fetchMatches = async () => {
    if (!reconciliationRunId) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/v1/receipt-matching/matches/${reconciliationRunId}`);
      if (!res.ok) throw new Error('Failed to fetch matches');

      const data = await res.json();
      setMatches(data.data || []);
    } catch (error: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const handleMatchReceipts = async () => {
    if (!reconciliationRunId) {
      setError('Reconciliation run ID is required');
      return;
    }

    try {
      setMatching(true);
      setError(null);

      // In a real implementation, you'd fetch receipts and transactions first
      // For now, this is a placeholder
      const res = await fetch('/api/v1/receipt-matching/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reconciliationRunId,
          receipts: [], // Would come from actual receipt data
          transactions: [], // Would come from actual transaction data
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to match receipts');
      }

      await fetchMatches();
    } catch (error: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to match receipts');
    } finally {
      setMatching(false);
    }
  };

  const handleVerify = async (linkId: string) => {
    try {
      const res = await fetch(`/api/v1/receipt-matching/links/${linkId}/verify`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to verify link');
      await fetchMatches();
    } catch (error: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to verify link');
    }
  };

  const getConfidenceBadge = (confidence: string, score: number) => {
    const color =
      confidence === 'high'
        ? 'bg-green-500'
        : confidence === 'medium'
          ? 'bg-yellow-500'
          : confidence === 'low'
            ? 'bg-orange-500'
            : 'bg-blue-500';

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
              <Button onClick={handleMatchReceipts} disabled={matching || !reconciliationRunId}>
                {matching ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Match Receipts
              </Button>
              <Button variant="outline" onClick={fetchMatches} disabled={loading || !reconciliationRunId}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {matches.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Matches ({matches.length})
              </h3>
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
                      <TableCell className="font-mono text-xs">{match.receiptId.slice(0, 8)}...</TableCell>
                      <TableCell className="font-mono text-xs">{match.transactionId.slice(0, 8)}...</TableCell>
                      <TableCell>{getConfidenceBadge(match.confidence, match.confidenceScore)}</TableCell>
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
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVerify(match.id)}
                          >
                            Verify
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {matches.length === 0 && !loading && reconciliationRunId && (
            <Alert>
              <AlertDescription>No matches found for this reconciliation run</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
