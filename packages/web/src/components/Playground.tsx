/**
 * Interactive Playground Component
 * UX-011: No-signup playground with real-time results and visual feedback
 * Future-forward: AI-powered examples, instant reconciliation, visual match visualization
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Play, BarChart3, CheckCircle2, AlertTriangle } from '@/lib/lucide-react';
import { CodeBlock } from '@/components/ui/code-block';

interface PlaygroundExample {
  id: string;
  name: string;
  description: string;
  sourceAdapter: string;
  targetAdapter: string;
  sourceData: unknown[];
  targetData: unknown[];
  rules: unknown[];
}

interface ReconciliationResult {
  summary: {
    total: number;
    matched: number;
    unmatched: number;
    accuracy: number;
    averageConfidence: number;
  };
  matches: Array<{
    sourceId: string;
    targetId: string;
    confidence: number;
  }>;
  exceptions: Array<{
    sourceId: string;
    reason: string;
    severity: string;
  }>;
  visualization: {
    matchRate: number;
    confidenceDistribution: {
      high: number;
      medium: number;
      low: number;
    };
  };
}

export function Playground() {
  const [examples, setExamples] = useState<PlaygroundExample[]>([]);
  const [selectedExample, setSelectedExample] = useState<PlaygroundExample | null>(null);
  const [result, setResult] = useState<ReconciliationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'examples' | 'custom' | 'results'>('examples');

  useEffect(() => {
    loadExamples();
  }, []);

  const loadExamples = async () => {
    try {
      const response = await fetch('/api/v1/playground/examples');
      const data = await response.json();
      setExamples(data.data || []);
      if (data.data?.length > 0) {
        setSelectedExample(data.data[0]);
      }
    } catch (error) {
      console.error('Failed to load examples:', error);
    }
  };

  const runReconciliation = async () => {
    if (!selectedExample) return;

    setLoading(true);
    try {
      const response = await fetch('/api/v1/playground/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceAdapter: selectedExample.sourceAdapter,
          sourceData: selectedExample.sourceData,
          targetAdapter: selectedExample.targetAdapter,
          targetData: selectedExample.targetData,
          rules: selectedExample.rules,
        }),
      });
      const data = await response.json();
      setResult(data.data || null);
      setActiveTab('results');
    } catch (error) {
      console.error('Failed to run reconciliation:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Interactive Playground</h1>
        <p className="text-muted-foreground">
          Try Settler's reconciliation engine without signing up. See how it works in real-time.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as typeof activeTab)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="examples">Examples</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="examples" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {examples.map((example) => (
              <Card
                key={example.id}
                className={`cursor-pointer transition-all ${
                  selectedExample?.id === example.id ? 'border-primary ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedExample(example)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {example.name}
                    {selectedExample?.id === example.id && (
                      <Badge variant="default">Selected</Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{example.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Source:</span>
                      <Badge variant="outline">{example.sourceAdapter}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Target:</span>
                      <Badge variant="outline">{example.targetAdapter}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rules:</span>
                      <span>{example.rules.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedExample && (
            <Card>
              <CardHeader>
                <CardTitle>Example Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Source Data</h4>
                  <CodeBlock language="json" code={JSON.stringify(selectedExample.sourceData, null, 2)} />
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Target Data</h4>
                  <CodeBlock language="json" code={JSON.stringify(selectedExample.targetData, null, 2)} />
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Matching Rules</h4>
                  <CodeBlock language="json" code={JSON.stringify(selectedExample.rules, null, 2)} />
                </div>
                <Button onClick={runReconciliation} disabled={loading} className="w-full">
                  <Play className="w-4 h-4 mr-2" />
                  {loading ? 'Running...' : 'Run Reconciliation'}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Reconciliation</CardTitle>
              <p className="text-sm text-muted-foreground">
                Build your own reconciliation scenario. Sign up to save and run real reconciliations.
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Custom playground builder coming soon. Try the examples above or{' '}
                <a href="/signup" className="text-primary underline">
                  sign up
                </a>{' '}
                to create your own reconciliations.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {result ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Reconciliation Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 border rounded">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold">{result.summary.total}</p>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <p className="text-sm text-muted-foreground">Matched</p>
                      <p className="text-2xl font-bold text-green-600">{result.summary.matched}</p>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <p className="text-sm text-muted-foreground">Unmatched</p>
                      <p className="text-2xl font-bold text-red-600">{result.summary.unmatched}</p>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <p className="text-sm text-muted-foreground">Accuracy</p>
                      <p className="text-2xl font-bold">{result.summary.accuracy}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      Matches
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {result.matches.map((match, i) => (
                        <div key={i} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="font-mono text-sm">{match.sourceId} → {match.targetId}</p>
                          </div>
                          <Badge variant="secondary">{(match.confidence).toFixed(1)}%</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      Exceptions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {result.exceptions.map((exception, i) => (
                        <div key={i} className="p-2 border rounded">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-mono text-sm">{exception.sourceId}</p>
                            <Badge variant={exception.severity === 'high' ? 'destructive' : 'secondary'}>
                              {exception.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{exception.reason}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Visualization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Match Rate</span>
                        <span className="font-semibold">{result.visualization.matchRate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-green-500 h-4 rounded-full transition-all"
                          style={{ width: `${result.visualization.matchRate}%` }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 border rounded">
                        <p className="text-sm text-muted-foreground">High Confidence</p>
                        <p className="text-xl font-bold text-green-600">
                          {result.visualization.confidenceDistribution.high}
                        </p>
                      </div>
                      <div className="text-center p-3 border rounded">
                        <p className="text-sm text-muted-foreground">Medium Confidence</p>
                        <p className="text-xl font-bold text-yellow-600">
                          {result.visualization.confidenceDistribution.medium}
                        </p>
                      </div>
                      <div className="text-center p-3 border rounded">
                        <p className="text-sm text-muted-foreground">Low Confidence</p>
                        <p className="text-xl font-bold text-red-600">
                          {result.visualization.confidenceDistribution.low}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-primary/5 border-primary">
                <CardContent className="pt-6">
                  <div className="text-center space-y-2">
                    <p className="font-semibold">Ready to use Settler for real?</p>
                    <p className="text-sm text-muted-foreground">
                      This was a simulation. Sign up to run real reconciliations with your data.
                    </p>
                    <a href="/signup">
                      <Button>Get Started Free</Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground py-8">
                  No results yet. Run a reconciliation from the Examples tab.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
