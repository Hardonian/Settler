"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export default function ReconcilePlayground() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);

  const startRecon = async () => {
    setRunning(true);
    setResult(null);
    setProgress(0);
    setLogs([]);
    
    const res = await fetch('/api/playground/simulate', { method: 'POST' });
    const data = await res.json();
    setJobId(data.jobId);
  };

  useEffect(() => {
    if (!running || !jobId) return;

    const interval = setInterval(async () => {
      const res = await fetch(`/api/playground/simulate?jobId=${jobId}`);
      const data = await res.json();
      
      setProgress(data.progress);
      if (data.logs) setLogs(data.logs);

      if (data.status === 'completed') {
        setResult(data.result);
        setRunning(false);
        setJobId(null);
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [running, jobId]);

  return (
    <div className="space-y-6">
        <div>
            <h2 className="text-2xl font-bold">Reconciliation Playground</h2>
            <p className="text-muted-foreground">Simulate reconciliation jobs with real-time feedback.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="p-4 border rounded bg-slate-50 dark:bg-slate-900 font-mono text-sm overflow-x-auto">
                            <pre>{`{
  "source": "stripe_payments",
  "target": "internal_db",
  "rules": [
    { "field": "amount", "tolerance": 0.01 },
    { "field": "date", "window": "24h" }
  ]
}`}</pre>
                        </div>
                        <Button onClick={startRecon} disabled={running} className="w-full">
                            {running ? 'Processing...' : 'Run Reconciliation Job'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Status & Results</CardTitle></CardHeader>
                <CardContent>
                    {running && (
                        <div className="space-y-4 mb-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Progress</span>
                                    <span>{progress}%</span>
                                </div>
                                <Progress value={progress} />
                            </div>
                            <div className="h-24 bg-black text-green-400 p-2 font-mono text-xs overflow-y-auto rounded">
                                {logs.map((log, i) => <div key={i}>{">"} {log}</div>)}
                            </div>
                        </div>
                    )}

                    {result ? (
                        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-100 dark:border-green-900/30">
                                <span>Matched</span>
                                <span className="font-bold text-green-700 dark:text-green-400">{result.matched}</span>
                            </div>
                            <div className="flex justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-100 dark:border-red-900/30">
                                <span>Unmatched</span>
                                <span className="font-bold text-red-700 dark:text-red-400">{result.unmatched}</span>
                            </div>
                            <div className="flex justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-100 dark:border-amber-900/30">
                                <span>Conflicts</span>
                                <span className="font-bold text-amber-700 dark:text-amber-400">{result.conflicts}</span>
                            </div>
                            <div className="pt-4 text-center">
                                <div className="text-sm text-slate-500">Match Accuracy</div>
                                <div className="font-bold text-3xl">{result.accuracy}</div>
                            </div>
                        </div>
                    ) : !running && (
                        <div className="text-muted-foreground text-sm italic text-center py-8">
                            Ready to start simulation.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
