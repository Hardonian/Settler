/**
 * Progress Tracker Component
 * Shows real-time progress for reconciliation runs
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Play, Pause } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ProgressData {
  progressPercentage: number;
  transactionsProcessed: number;
  totalTransactions: number;
  estimatedCompletionAt?: string;
  lastUpdateAt: string;
}

interface ProgressTrackerProps {
  runId?: string;
  resultId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function ProgressTracker({
  runId,
  resultId,
  autoRefresh = true,
  refreshInterval = 5000,
}: ProgressTrackerProps) {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if ((runId || resultId) && !isPaused) {
      fetchProgress();
      if (autoRefresh) {
        const interval = setInterval(fetchProgress, refreshInterval);
        return () => clearInterval(interval);
      }
    }
    return undefined;
  }, [runId, resultId, autoRefresh, refreshInterval, isPaused]);

  const fetchProgress = async () => {
    if (!runId && !resultId) return;

    try {
      setLoading(true);
      setError(null);

      const endpoint = runId
        ? `/api/v1/progress/reconciliation-runs/${runId}`
        : `/api/v1/progress/reconciliation-results/${resultId}`;

      const res = await fetch(endpoint);
      if (!res.ok) throw new Error('Failed to fetch progress');

      const data = await res.json();
      setProgress(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load progress');
    } finally {
      setLoading(false);
    }
  };

  const formatETA = (eta?: string) => {
    if (!eta) return 'Calculating...';
    const etaDate = new Date(eta);
    const now = new Date();
    if (etaDate < now) return 'Completed';
    return `~${formatDistanceToNow(etaDate)} remaining`;
  };

  if (!runId && !resultId) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No run or result ID provided
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Progress Tracking</CardTitle>
            <CardDescription>
              {runId ? `Run ID: ${runId.slice(0, 8)}...` : `Result ID: ${resultId?.slice(0, 8)}...`}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="icon" onClick={fetchProgress}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {progress ? (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span className="font-semibold">{progress.progressPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={progress.progressPercentage} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Processed</div>
                <div className="text-2xl font-bold">{progress.transactionsProcessed.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total</div>
                <div className="text-2xl font-bold">{progress.totalTransactions.toLocaleString()}</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <div>
                <div className="text-sm text-muted-foreground">Estimated Completion</div>
                <div className="font-medium">{formatETA(progress.estimatedCompletionAt)}</div>
              </div>
              <Badge variant="outline">
                Updated {formatDistanceToNow(new Date(progress.lastUpdateAt), { addSuffix: true })}
              </Badge>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {loading ? 'Loading progress...' : 'No progress data available'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
