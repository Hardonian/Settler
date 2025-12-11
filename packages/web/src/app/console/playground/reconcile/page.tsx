"use client";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ReconcilePlayground() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runRecon = () => {
    setRunning(true);
    setTimeout(() => {
        setResult({
            matched: 124,
            unmatched: 2,
            conflicts: 0,
            accuracy: "98.4%"
        });
        setRunning(false);
    }, 1500);
  }

  return (
    <div className="space-y-6">
        <div>
            <h2 className="text-2xl font-bold">Reconciliation Playground</h2>
            <p className="text-muted-foreground">Simulate reconciliation jobs.</p>
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
                        <Button onClick={runRecon} disabled={running}>
                            {running ? 'Running Job...' : 'Run Reconciliation Job'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Results</CardTitle></CardHeader>
                <CardContent>
                    {result ? (
                        <div className="space-y-2">
                            <div className="flex justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                                <span>Matched</span>
                                <span className="font-bold">{result.matched}</span>
                            </div>
                            <div className="flex justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded">
                                <span>Unmatched</span>
                                <span className="font-bold">{result.unmatched}</span>
                            </div>
                            <div className="pt-4 font-bold text-xl">Accuracy: {result.accuracy}</div>
                        </div>
                    ) : (
                        <div className="text-muted-foreground text-sm italic">Run a job to see results.</div>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
