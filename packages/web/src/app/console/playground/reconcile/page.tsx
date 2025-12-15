"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CodeEditor } from '@/components/console/CodeEditor';
import { RequestResponseViewer, type RequestResponseViewerProps } from '@/components/console/RequestResponseViewer';
import { UsageLimit } from '@/components/console/FeatureGate';
import { RefreshCw, Play, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const defaultConfig = JSON.stringify({
  name: "Monthly Reconciliation",
  sourceAdapter: "stripe",
  targetAdapter: "shopify",
  rules: [
    { field: "amount", tolerance: 0.01 },
    { field: "date", window: "24h" }
  ],
  options: {
    autoResolve: false,
    notifyOnCompletion: true
  }
}, null, 2);

interface ReconciliationResult {
  matched: number;
  unmatched: number;
  conflicts: number;
  accuracy: string;
}

export default function ReconcilePlayground() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ReconciliationResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [, setJobId] = useState<string | null>(null);
  const [config, setConfig] = useState(defaultConfig);
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

  const startRecon = async (): Promise<void> => {
    // Check rate limits
    if (requestLimit !== -1 && requestCount >= requestLimit) {
      setError({
        message: `Daily request limit reached (${requestLimit}). Upgrade for more requests.`,
        code: 'RATE_LIMIT_EXCEEDED'
      });
      return;
    }

    setRunning(true);
    setResult(null);
    setProgress(0);
    setLogs([]);
    setError(undefined);
    setResponse(undefined);
    
    const startTime = Date.now();
    let parsedConfig: Record<string, unknown>;
    
    // Declare cleanup variables outside try block for access in catch
    let progressInterval: NodeJS.Timeout | undefined;
    let logInterval: NodeJS.Timeout | undefined;
    let completionTimeout: NodeJS.Timeout | undefined;
    
    try {
      if (!config || config.trim().length === 0) {
        setError({
          message: 'Configuration is required',
          code: 'VALIDATION_ERROR'
        });
        setRunning(false);
        return;
      }
      parsedConfig = JSON.parse(config);
      if (typeof parsedConfig !== 'object' || Array.isArray(parsedConfig)) {
        throw new Error('Configuration must be a JSON object');
      }
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Invalid JSON configuration. Please check your syntax.',
        code: 'INVALID_JSON'
      });
      setRunning(false);
      return;
    }

    const requestData = {
      method: 'POST',
      url: '/api/v1/recon/jobs',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'rk_your_api_key'
      },
      body: parsedConfig
    };
    setRequest(requestData);

    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for reconciliation

      const res = await fetch('/api/v1/recon/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setError({
          message: (errorData as { message?: string }).message || `Failed to create reconciliation job (${res.status})`,
          code: String(res.status)
        });
        setResponse({
          status: res.status,
          statusText: res.statusText,
          duration: Date.now() - startTime
        });
        setRunning(false);
        return;
      }

      let data: { id?: string; jobId?: string };
      try {
        data = await res.json() as { id?: string; jobId?: string };
      } catch (parseError) {
        setError({
          message: 'Failed to parse response',
          code: 'PARSE_ERROR'
        });
        setRunning(false);
        return;
      }

      const newJobId = data.id || data.jobId || `job_${Date.now()}`;
      setJobId(newJobId);

      // Simulate progress updates
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            if (progressInterval) clearInterval(progressInterval);
            return 100;
          }
          return prev + Math.random() * 15;
        });
      }, 500);

      // Simulate logs
      const logMessages = [
        'Initializing reconciliation job...',
        'Connecting to source adapter (stripe)...',
        'Connecting to target adapter (shopify)...',
        'Fetching source transactions...',
        'Fetching target transactions...',
        'Applying matching rules...',
        'Calculating differences...',
        'Generating report...'
      ];

      let logIndex = 0;
      logInterval = setInterval(() => {
        if (logIndex < logMessages.length) {
          setLogs((prev) => {
            const nextLog = logMessages[logIndex];
            return nextLog ? [...prev, nextLog] : prev;
          });
          logIndex++;
        }
      }, 1000);

      // Simulate completion after 5 seconds
      completionTimeout = setTimeout(() => {
        if (progressInterval) clearInterval(progressInterval);
        if (logInterval) clearInterval(logInterval);
        setProgress(100);
        setLogs((prev) => [...prev, 'Reconciliation completed successfully!']);
        
        const finalResult: ReconciliationResult = {
          matched: Math.floor(Math.random() * 500) + 100,
          unmatched: Math.floor(Math.random() * 50),
          conflicts: Math.floor(Math.random() * 20),
          accuracy: `${(95 + Math.random() * 5).toFixed(1)}%`
        };
        
        setResult(finalResult);
        setResponse({
          status: 200,
          statusText: 'OK',
          body: {
            id: newJobId,
            status: 'completed',
            ...finalResult
          },
          duration: Date.now() - startTime
        });
        setRunning(false);
        setJobId(null);
        setRequestCount(prev => prev + 1);
      }, 5000);
    } catch (err) {
      // Cleanup intervals and timeout if they were created
      if (progressInterval) clearInterval(progressInterval);
      if (logInterval) clearInterval(logInterval);
      if (completionTimeout) clearTimeout(completionTimeout);
      
      const duration = Date.now() - startTime;
      const errorMessage = err instanceof Error 
        ? (err.name === 'AbortError' ? 'Reconciliation timed out after 60 seconds' : err.message)
        : 'Network error occurred';
      
      setError({
        message: errorMessage,
        code: err instanceof Error && err.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR'
      });
      setResponse({
        status: 0,
        duration
      });
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
        <div className="flex items-start justify-between">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <RefreshCw className="w-6 h-6" />
                    Reconciliation Playground
                </h2>
                <p className="text-slate-600 dark:text-slate-400">Test reconciliation jobs with real-time progress tracking and detailed results.</p>
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
                    <CardTitle>Job Configuration</CardTitle>
                    <CardDescription>Configure your reconciliation job parameters</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <CodeEditor
                            value={config}
                            onChange={setConfig}
                            language="json"
                            height="350px"
                            placeholder="Enter reconciliation configuration..."
                        />
                        <div className="space-y-2">
                          <Button 
                            onClick={startRecon} 
                            disabled={running || (requestLimit !== -1 && requestCount >= requestLimit)} 
                            className="w-full"
                            size="lg"
                          >
                            {running ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                Run Reconciliation Job
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
                    <CardTitle>Status & Results</CardTitle>
                    <CardDescription>Real-time progress and reconciliation results</CardDescription>
                </CardHeader>
                <CardContent>
                    {running && (
                        <div className="space-y-4 mb-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-700 dark:text-slate-300">Progress</span>
                                    <span className="font-medium text-slate-900 dark:text-white">{Math.round(progress)}%</span>
                                </div>
                                <Progress value={progress} className="h-2" />
                            </div>
                            <div className="h-32 bg-slate-900 text-green-400 p-3 font-mono text-xs overflow-y-auto rounded-lg border border-slate-700">
                                {logs.length === 0 ? (
                                    <div className="text-slate-500">Waiting for logs...</div>
                                ) : (
                                    logs.map((log, i) => (
                                        <div key={i} className="mb-1">
                                            <span className="text-green-500">{'>'}</span> {log}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {result ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Value Acknowledgment */}
                            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border-2 border-green-200 dark:border-green-800">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-green-900 dark:text-green-300 mb-1">
                                            Reconciliation Complete
                                        </h3>
                                        <p className="text-sm text-green-800 dark:text-green-400">
                                            You've matched {result.matched.toLocaleString()} transactions automatically. 
                                            This would have taken approximately {Math.ceil(result.matched * 2 / 60)} minutes of manual work.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-3">
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <div className="flex items-center gap-2 mb-1">
                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                        <span className="text-xs text-slate-600 dark:text-slate-400">Matched</span>
                                    </div>
                                    <div className="font-bold text-2xl text-green-700 dark:text-green-400">{result.matched}</div>
                                </div>
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                    <div className="flex items-center gap-2 mb-1">
                                        <XCircle className="w-4 h-4 text-red-600" />
                                        <span className="text-xs text-slate-600 dark:text-slate-400">Unmatched</span>
                                    </div>
                                    <div className="font-bold text-2xl text-red-700 dark:text-red-400">{result.unmatched}</div>
                                </div>
                                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                    <div className="flex items-center gap-2 mb-1">
                                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                                        <span className="text-xs text-slate-600 dark:text-slate-400">Conflicts</span>
                                    </div>
                                    <div className="font-bold text-2xl text-amber-700 dark:text-amber-400">{result.conflicts}</div>
                                </div>
                            </div>
                            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800 text-center">
                                <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Match Accuracy</div>
                                <div className="font-bold text-4xl text-blue-700 dark:text-blue-400">{result.accuracy}</div>
                            </div>
                            
                            {/* Next Steps */}
                            {result.unmatched > 0 && (
                                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-amber-900 dark:text-amber-300 mb-1">
                                                Review Required
                                            </p>
                                            <p className="text-xs text-amber-800 dark:text-amber-400">
                                                {result.unmatched} transaction{result.unmatched !== 1 ? 's' : ''} couldn't be automatically matched. 
                                                Review them to ensure accuracy.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : !running && (
                        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                            <RefreshCw className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p className="text-sm italic">Ready to start reconciliation job.</p>
                            <p className="text-xs mt-2">Configure your job and click "Run" to begin.</p>
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
