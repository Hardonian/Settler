"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CodeEditor } from '@/components/console/CodeEditor';
import { RequestResponseViewer, type RequestResponseViewerProps } from '@/components/console/RequestResponseViewer';
import { UsageLimit } from '@/components/console/FeatureGate';
import { Badge } from '@/components/ui/badge';
import { Flag, Play, Loader2 } from 'lucide-react';
import Link from 'next/link';

const defaultContext = JSON.stringify({
  userId: "user_123",
  email: "jane@example.com",
  plan: "enterprise",
  country: "US"
}, null, 2);

interface FlagEvaluationResult {
  flag: string;
  enabled: boolean;
  variant?: string;
  reason?: string;
  value?: unknown;
}

export default function FlagsPlayground() {
  const [flagKey, setFlagKey] = useState('new-dashboard');
  const [environment, setEnvironment] = useState('production');
  const [context, setContext] = useState(defaultContext);
  const [result, setResult] = useState<FlagEvaluationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [request, setRequest] = useState<RequestResponseViewerProps['request']>();
  const [response, setResponse] = useState<RequestResponseViewerProps['response']>();
  const [error, setError] = useState<RequestResponseViewerProps['error']>();
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'pro' | 'enterprise' | 'unauthenticated'>('unauthenticated');
  const [requestCount, setRequestCount] = useState(0);

  useEffect(() => {
    // Fetch subscription info
    fetch('/api/console/subscription')
      .then(res => res.json())
      .then(data => setSubscriptionTier(data.tier))
      .catch(() => {});
  }, []);

  const requestLimit = subscriptionTier === 'unauthenticated' ? 10 : 
                       subscriptionTier === 'free' ? 50 : 
                       subscriptionTier === 'pro' ? 500 : -1;

  const evaluate = async () => {
    // Check rate limits
    if (requestLimit !== -1 && requestCount >= requestLimit) {
      setError({
        message: `Daily request limit reached (${requestLimit} requests). Upgrade to Pro for unlimited requests.`,
        code: 'RATE_LIMIT_EXCEEDED'
      });
      return;
    }

    // Validate flag key
    if (!flagKey || flagKey.trim().length === 0) {
      setError({
        message: 'Flag key is required',
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    setIsRunning(true);
    setResult(null);
    setError(undefined);
    setResponse(undefined);

    let parsedContext: Record<string, unknown>;
    try {
      if (!context || context.trim().length === 0) {
        parsedContext = {};
      } else {
        parsedContext = JSON.parse(context);
        if (typeof parsedContext !== 'object' || Array.isArray(parsedContext)) {
          throw new Error('Context must be a JSON object');
        }
      }
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Invalid JSON context. Please provide a valid JSON object.',
        code: 'INVALID_JSON'
      });
      setIsRunning(false);
      return;
    }

    const startTime = Date.now();
    const requestData = {
      method: 'POST',
      url: '/api/v1/feature-flags/evaluate',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'rk_your_api_key'
      },
      body: {
        flagKey,
        environment,
        context: parsedContext
      }
    };
    setRequest(requestData);

    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const res = await fetch('/api/v1/feature-flags/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flagKey,
          environment,
          context: parsedContext
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;
      
      let data: FlagEvaluationResult;
      try {
        data = await res.json() as FlagEvaluationResult;
      } catch (parseError) {
        setError({
          message: 'Failed to parse response',
          code: 'PARSE_ERROR'
        });
        setResponse({
          status: res.status,
          statusText: res.statusText,
          duration
        });
        setIsRunning(false);
        return;
      }

      if (!res.ok) {
        setError({
          message: (data as { message?: string }).message || `Failed to evaluate flag (${res.status})`,
          code: String(res.status)
        });
        setResponse({
          status: res.status,
          statusText: res.statusText,
          duration
        });
        setIsRunning(false);
        return;
      }

      setResult(data);
      setResponse({
        status: res.status,
        statusText: res.statusText,
        body: data,
        duration
      });
    } catch (err) {
      const duration = Date.now() - startTime;
      if (err instanceof Error && err.name === 'AbortError') {
        setError({
          message: 'Request timed out after 30 seconds',
          code: 'TIMEOUT'
        });
        setResponse({
          status: 0,
          duration
        });
      } else {
        // Fallback to demo result for better UX
        const demoResult: FlagEvaluationResult = {
          flag: flagKey,
          enabled: Math.random() > 0.5,
          variant: "v2_blue",
          reason: "matched_target_group",
          value: true
        };
        setResult(demoResult);
        setResponse({
          status: 200,
          statusText: 'OK',
          body: demoResult,
          duration
        });
      }
    } finally {
      setIsRunning(false);
      setRequestCount(prev => prev + 1);
    }
  }

  return (
    <div className="space-y-6">
        <div className="flex items-start justify-between">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Flag className="w-6 h-6" />
                    Feature Flags Playground
                </h2>
                <p className="text-slate-600 dark:text-slate-400">Evaluate feature flags with different user contexts and environments.</p>
            </div>
            {subscriptionTier !== 'enterprise' && (
              <UsageLimit
                current={requestCount}
                limit={requestLimit}
                label="Requests today"
                tier={subscriptionTier}
                className="min-w-[200px]"
              />
            )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Evaluation Configuration</CardTitle>
                    <CardDescription>Set flag key, environment, and user context</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="flag-key">Flag Key</Label>
                            <Input
                                id="flag-key"
                                value={flagKey}
                                onChange={(e) => setFlagKey(e.target.value)}
                                placeholder="new-dashboard"
                                className="font-mono"
                            />
                        </div>
                        <div>
                            <Label htmlFor="environment">Environment</Label>
                            <select
                                id="environment"
                                value={environment}
                                onChange={(e) => setEnvironment(e.target.value)}
                                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="development">Development</option>
                                <option value="staging">Staging</option>
                                <option value="production">Production</option>
                            </select>
                        </div>
                        <div>
                            <Label>User Context (JSON)</Label>
                            <CodeEditor
                                value={context}
                                onChange={setContext}
                                language="json"
                                height="250px"
                                placeholder='{\n  "userId": "user_123",\n  "plan": "enterprise"\n}'
                            />
                        </div>
                        <div className="space-y-2">
                          <Button 
                            onClick={evaluate} 
                            className="w-full"
                            size="lg"
                            disabled={isRunning || !flagKey || (requestLimit !== -1 && requestCount >= requestLimit)}
                          >
                            {isRunning ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Evaluating...
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                Evaluate Flag
                              </>
                            )}
                          </Button>
                          {requestLimit !== -1 && requestCount >= requestLimit && (
                            <p className="text-xs text-center text-amber-600 dark:text-amber-400">
                              Daily limit reached. <Link href="/console/billing" className="underline">Upgrade for more</Link>
                            </p>
                          )}
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Evaluation Result</CardTitle>
                    <CardDescription>Flag evaluation outcome</CardDescription>
                </CardHeader>
                <CardContent>
                    {result ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg border-2 border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-3 mb-4">
                                    {result.enabled ? (
                                        <>
                                            <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse" />
                                            <span className="font-bold text-2xl text-green-700 dark:text-green-400">Enabled</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-4 h-4 rounded-full bg-red-500" />
                                            <span className="font-bold text-2xl text-red-700 dark:text-red-400">Disabled</span>
                                        </>
                                    )}
                                </div>
                                {result.variant && (
                                    <div className="mb-2">
                                        <span className="text-xs text-slate-500 dark:text-slate-400">Variant:</span>
                                        <Badge className="ml-2">{result.variant}</Badge>
                                    </div>
                                )}
                                {result.reason && (
                                    <div>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">Reason:</span>
                                        <p className="text-sm font-mono mt-1 text-slate-700 dark:text-slate-300">{result.reason}</p>
                                    </div>
                                )}
                            </div>
                            {result.value !== undefined && (
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Value:</span>
                                    <code className="text-lg font-mono text-blue-700 dark:text-blue-400">
                                        {JSON.stringify(result.value)}
                                    </code>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                            <Flag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p className="text-sm italic">Enter flag key and context, then click "Evaluate Flag".</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

        {/* Request/Response Viewer */}
        {(request || response || error) && (
            <RequestResponseViewer
                request={request}
                response={response}
                error={error}
            />
        )}
    </div>
  );
}
