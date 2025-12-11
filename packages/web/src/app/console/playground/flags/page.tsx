"use client";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function FlagsPlayground() {
  const [context, setContext] = useState(`{
  "userId": "user_123",
  "email": "jane@example.com",
  "plan": "enterprise"
}`);
  const [result, setResult] = useState<any>(null);

  const evaluate = () => {
    setResult({
        flag: "new-dashboard",
        enabled: true,
        variant: "v2_blue",
        reason: "matched_target_group"
    });
  }

  return (
    <div className="space-y-6">
        <div>
            <h2 className="text-2xl font-bold">Feature Flags Playground</h2>
            <p className="text-muted-foreground">Evaluate flags with different user contexts.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader><CardTitle>Evaluation Context</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <textarea 
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                            className="w-full h-32 p-3 font-mono text-sm bg-slate-50 dark:bg-slate-900 border rounded"
                        />
                        <Button onClick={evaluate} className="w-full">
                            Evaluate Flag 'new-dashboard'
                        </Button>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Result</CardTitle></CardHeader>
                <CardContent>
                    {result ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${result.enabled ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span className="font-bold text-lg">{result.enabled ? 'Enabled' : 'Disabled'}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded">
                                    <span className="text-slate-500 block text-xs">Variant</span>
                                    <span className="font-mono">{result.variant}</span>
                                </div>
                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded">
                                    <span className="text-slate-500 block text-xs">Reason</span>
                                    <span className="font-mono">{result.reason}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-muted-foreground text-sm italic">Evaluate to see results.</div>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
