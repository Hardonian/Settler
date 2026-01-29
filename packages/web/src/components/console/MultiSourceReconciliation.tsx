/**
 * Multi-Source Reconciliation Component
 * Handles reconciliation with multiple source adapters
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { AlertTriangle, CheckCircle2, RefreshCw, Play, X } from 'lucide-react';

interface SourceAdapter {
  adapter: string;
  config: Record<string, unknown>;
}

interface Conflict {
  conflictId: string;
  conflictType: string;
  sourceAdapter1: string;
  sourceAdapter2: string;
  transactionId1?: string;
  transactionId2?: string;
  conflictDetails: Record<string, unknown>;
}

interface MultiSourceJob {
  id: string;
  sourceAdapters: SourceAdapter[];
  targetAdapter: string;
  conflictResolutionStrategy: string;
  conflicts: Conflict[];
}

export function MultiSourceReconciliation() {
  const [job, setJob] = useState<MultiSourceJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceAdapters, setSourceAdapters] = useState<SourceAdapter[]>([]);
  const [targetAdapter, setTargetAdapter] = useState<string>('');
  const [conflictStrategy, setConflictStrategy] = useState<string>('manual');
  const [running, setRunning] = useState(false);

  const handleAddSource = () => {
    setSourceAdapters([...sourceAdapters, { adapter: '', config: {} }]);
  };

  const handleRemoveSource = (index: number) => {
    setSourceAdapters(sourceAdapters.filter((_, i) => i !== index));
  };

  const handleSourceChange = (index: number, adapter: string) => {
    const updated = [...sourceAdapters];
    updated[index] = { ...updated[index]!, adapter, config: {} };
    setSourceAdapters(updated);
  };

  const handleCreateJob = async () => {
    if (sourceAdapters.length < 2) {
      setError('At least 2 source adapters are required');
      return;
    }

    if (!targetAdapter) {
      setError('Target adapter is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/v1/multi-source-reconciliation/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceAdapters: sourceAdapters.filter((s: any) => s.adapter),
          targetAdapter,
          conflictResolutionStrategy: conflictStrategy,
          duplicateDetectionEnabled: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to create job');
      }

      const data = await res.json();
      setJob(data);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  const handleRunReconciliation = async () => {
    if (!job) return;

    try {
      setRunning(true);
      setError(null);

      // Create a reconciliation run first
      const runRes = await fetch('/api/v1/reconciliation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingestionId: null, // Multi-source doesn't use ingestion
          config: {},
        }),
      });

      if (!runRes.ok) {
        throw new Error('Failed to create reconciliation run');
      }

      const runData = await runRes.json();

      const res = await fetch(`/api/v1/multi-source-reconciliation/jobs/${job.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reconRunId: runData.runId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to run reconciliation');
      }

      const data = await res.json();
      setJob({ ...job, conflicts: data.conflicts });
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to run reconciliation');
    } finally {
      setRunning(false);
    }
  };

  const handleResolveConflict = async (conflictId: string, strategy: string) => {
    if (!job) return;

    try {
      const res = await fetch(`/api/v1/multi-source-reconciliation/conflicts/${conflictId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolutionStrategy: strategy,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to resolve conflict');
      }

      // Refresh job to get updated conflicts
      const jobRes = await fetch(`/api/v1/multi-source-reconciliation/jobs/${job.id}`);
      if (jobRes.ok) {
        const jobData = await jobRes.json();
        setJob(jobData);
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to resolve conflict');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Multi-Source Reconciliation</CardTitle>
          <CardDescription>
            Reconcile multiple source adapters against a single target
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!job ? (
            <>
              <div className="space-y-4">
                <div>
                  <Label>Source Adapters</Label>
                  {sourceAdapters.map((source, index) => (
                    <div key={index} className="flex gap-2 mt-2">
                      <Select
                        value={source.adapter}
                        onValueChange={(value) => handleSourceChange(index, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select adapter" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="stripe">Stripe</SelectItem>
                          <SelectItem value="paypal">PayPal</SelectItem>
                          <SelectItem value="shopify">Shopify</SelectItem>
                          <SelectItem value="quickbooks">QuickBooks</SelectItem>
                        </SelectContent>
                      </Select>
                      {sourceAdapters.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveSource(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" onClick={handleAddSource} className="mt-2">
                    Add Source Adapter
                  </Button>
                </div>

                <div>
                  <Label>Target Adapter</Label>
                  <Select value={targetAdapter} onValueChange={setTargetAdapter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select target adapter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stripe">Stripe</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="shopify">Shopify</SelectItem>
                      <SelectItem value="quickbooks">QuickBooks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Conflict Resolution Strategy</Label>
                  <Select value={conflictStrategy} onValueChange={setConflictStrategy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="first_wins">First Wins</SelectItem>
                      <SelectItem value="last_wins">Last Wins</SelectItem>
                      <SelectItem value="highest_amount">Highest Amount</SelectItem>
                      <SelectItem value="lowest_amount">Lowest Amount</SelectItem>
                      <SelectItem value="manual">Automated System Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleCreateJob} disabled={loading}>
                  {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Create Multi-Source Job
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="outline">Job ID: {job.id}</Badge>
                  <Badge variant="outline" className="ml-2">
                    Strategy: {job.conflictResolutionStrategy}
                  </Badge>
                </div>
                <Button onClick={handleRunReconciliation} disabled={running}>
                  {running ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                  Run Reconciliation
                </Button>
              </div>

              {job.conflicts.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Conflicts Detected</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Source 1</TableHead>
                        <TableHead>Source 2</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {job.conflicts.map((conflict) => (
                        <TableRow key={conflict.conflictId}>
                          <TableCell>
                            <Badge variant="destructive">{conflict.conflictType}</Badge>
                          </TableCell>
                          <TableCell>{conflict.sourceAdapter1}</TableCell>
                          <TableCell>{conflict.sourceAdapter2}</TableCell>
                          <TableCell>
                            <pre className="text-xs">
                              {JSON.stringify(conflict.conflictDetails, null, 2)}
                            </pre>
                          </TableCell>
                          <TableCell>
                            <Select
                              onValueChange={(value) =>
                                handleResolveConflict(conflict.conflictId, value)
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Resolve" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="first_wins">First Wins</SelectItem>
                                <SelectItem value="last_wins">Last Wins</SelectItem>
                                <SelectItem value="highest_amount">Highest Amount</SelectItem>
                                <SelectItem value="lowest_amount">Lowest Amount</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {job.conflicts.length === 0 && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>No conflicts detected</AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
