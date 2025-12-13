/**
 * CLI Playground Component
 * 
 * Interactive CLI playground with code editor, request builder, and response viewer.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Using native select for now - can be enhanced with a proper Select component later
import { Badge } from '@/components/ui/badge';
import { CodeEditor } from './CodeEditor';
import { RequestResponseViewer, type RequestResponseViewerProps } from './RequestResponseViewer';
import { FeatureGate, UsageLimit, type SubscriptionTier } from './FeatureGate';
import { Terminal, Play, History, Trash2, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface RequestHistory {
  id: string;
  name: string;
  method: string;
  url: string;
  body?: string;
  timestamp: Date;
}

const defaultRequests = {
  receipts: {
    name: 'Parse Receipt',
    method: 'POST',
    url: '/api/v1/receipts',
    body: JSON.stringify({
      fileUrl: 'https://example.com/receipt.jpg',
      mimeType: 'image/jpeg',
    }, null, 2),
  },
  reconcile: {
    name: 'Create Reconciliation Job',
    method: 'POST',
    url: '/api/v1/recon/jobs',
    body: JSON.stringify({
      name: 'Monthly Reconciliation',
      sourceAdapter: 'stripe',
      targetAdapter: 'shopify',
    }, null, 2),
  },
  flags: {
    name: 'Evaluate Feature Flag',
    method: 'POST',
    url: '/api/v1/feature-flags/evaluate',
    body: JSON.stringify({
      flagKey: 'new-dashboard',
      environment: 'production',
      context: { userId: 'user_123' },
    }, null, 2),
  },
};

interface CLIPlaygroundProps {
  subscriptionTier?: 'free' | 'pro' | 'enterprise' | 'unauthenticated';
}

export function CLIPlayground({ subscriptionTier = 'unauthenticated' }: CLIPlaygroundProps) {
  const [method, setMethod] = useState('POST');
  const [url, setUrl] = useState('/api/v1/receipts');
  const [body, setBody] = useState(defaultRequests.receipts.body);
  const [requestName, setRequestName] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [request, setRequest] = useState<RequestResponseViewerProps['request']>();
  const [response, setResponse] = useState<RequestResponseViewerProps['response']>();
  const [error, setError] = useState<RequestResponseViewerProps['error']>();
  const [history, setHistory] = useState<RequestHistory[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('receipts');
  const [requestCount, setRequestCount] = useState(0);
  
  // Feature flags based on tier
  const canSaveHistory = subscriptionTier !== 'unauthenticated';
  const canUseCustomTemplates = subscriptionTier === 'pro' || subscriptionTier === 'enterprise';
  const canUseAdvancedFeatures = subscriptionTier === 'pro' || subscriptionTier === 'enterprise';
  const requestLimit = subscriptionTier === 'unauthenticated' ? 10 : 
                       subscriptionTier === 'free' ? 50 : 
                       subscriptionTier === 'pro' ? 500 : -1; // -1 = unlimited

  // Load history from localStorage (only if allowed)
  useEffect(() => {
    if (!canSaveHistory) {
      return;
    }
    
    try {
      const saved = localStorage.getItem('settler-cli-history');
      if (saved) {
        const parsed = JSON.parse(saved) as Array<Omit<RequestHistory, 'timestamp'> & { timestamp: string }>;
        // Validate and filter invalid entries
        const validHistory = parsed
          .filter((h) => h.id && h.method && h.url && h.timestamp)
          .map((h) => ({
            ...h,
            timestamp: new Date(h.timestamp),
          }))
          .filter((h) => !isNaN(h.timestamp.getTime())); // Filter invalid dates
        
        if (validHistory.length > 0) {
          setHistory(validHistory);
        }
      }
    } catch (error) {
      console.warn('Failed to load history from localStorage:', error);
      // Clear corrupted data
      try {
        localStorage.removeItem('settler-cli-history');
      } catch {
        // Ignore cleanup errors
      }
    }
  }, [canSaveHistory]);

  // Save history to localStorage
  const saveHistory = useCallback((newHistory: RequestHistory[]) => {
    try {
      // Limit history size to prevent localStorage bloat
      const limitedHistory = newHistory.slice(0, 50);
      localStorage.setItem('settler-cli-history', JSON.stringify(limitedHistory));
      setHistory(limitedHistory);
    } catch (error) {
      // Handle quota exceeded or other storage errors
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, clearing old history');
        try {
          // Keep only most recent 10 items
          const recentHistory = newHistory.slice(0, 10);
          localStorage.setItem('settler-cli-history', JSON.stringify(recentHistory));
          setHistory(recentHistory);
        } catch {
          // If still fails, clear history
          localStorage.removeItem('settler-cli-history');
          setHistory([]);
        }
      } else {
        console.warn('Failed to save history:', error);
      }
    }
  }, []);

  const handleTemplateChange = useCallback((template: string) => {
    setSelectedTemplate(template);
    const req = defaultRequests[template as keyof typeof defaultRequests];
    if (req) {
      setMethod(req.method);
      setUrl(req.url);
      setBody(req.body);
      setRequestName(req.name);
    }
  }, []);

  const handleRun = async (retryCount = 0) => {
    // Check rate limits
    if (requestLimit !== -1 && requestCount >= requestLimit) {
      setError({
        message: `Daily request limit reached (${requestLimit} requests). Upgrade to Pro for unlimited requests.`,
        code: 'RATE_LIMIT_EXCEEDED'
      });
      setIsRunning(false);
      return;
    }

    // Validate required fields
    if (!url || url.trim().length === 0) {
      setError({
        message: 'URL is required',
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    if (!method) {
      setError({
        message: 'HTTP method is required',
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    setIsRunning(true);
    setError(undefined);
    setResponse(undefined);

    const startTime = Date.now();
    
    // Validate and parse request body
    let parsedBody: unknown;
    try {
      parsedBody = body && body.trim() ? JSON.parse(body) : undefined;
    } catch (parseError) {
      setError({
        message: 'Invalid JSON in request body. Please check your syntax.',
        code: 'INVALID_JSON'
      });
      setIsRunning(false);
      return;
    }

    // Get actual API key from user's keys (if available)
    let apiKey = 'rk_your_api_key';
    try {
      const keyRes = await fetch('/api/console/api-keys');
      if (keyRes.ok) {
        const keyData = await keyRes.json() as { keys?: Array<{ keyPrefix: string; revokedAt?: string | null }> };
        const activeKey = keyData.keys?.find((k) => !k.revokedAt);
        if (activeKey) {
          // In production, would use full key from secure storage
          apiKey = `rk_${activeKey.keyPrefix}...`;
        }
      }
    } catch {
      // Use default if can't fetch keys
    }

    // Validate URL format
    if (!url || (!url.startsWith('/') && !url.startsWith('http'))) {
      setError({
        message: 'Invalid URL format. URLs must start with / or http://',
        code: 'INVALID_URL'
      });
      setIsRunning(false);
      return;
    }

    const requestData: RequestResponseViewerProps['request'] = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: parsedBody,
    };

    setRequest(requestData);

    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const res = await fetch(url.startsWith('/') ? url : `/api${url}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: method !== 'GET' && body ? body : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const duration = Date.now() - startTime;
      const responseData = await res.json().catch(() => ({}));

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        body: responseData,
        duration,
      });

      // Save to history (only if allowed)
      if (canSaveHistory && (requestName || url)) {
        const newHistory: RequestHistory = {
          id: Date.now().toString(),
          name: requestName || `${method} ${url}`,
          method,
          url,
          body,
          timestamp: new Date(),
        };
        saveHistory([newHistory, ...history.slice(0, 9)]);
      }
      
      // Increment request count
      setRequestCount(prev => prev + 1);
    } catch (err) {
      const duration = Date.now() - startTime;
      setError({
        message: err instanceof Error ? err.message : 'Unknown error occurred',
        code: 'NETWORK_ERROR',
      });
      setResponse({
        status: 0,
        duration,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const loadHistoryItem = useCallback((item: RequestHistory) => {
    setMethod(item.method);
    setUrl(item.url);
    setBody(item.body || '');
    setRequestName(item.name);
  }, []);

  const deleteHistoryItem = useCallback((id: string) => {
    saveHistory(history.filter((h) => h.id !== id));
  }, [history, saveHistory]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Terminal className="w-6 h-6" />
            CLI Playground
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Build and test API requests with an interactive code editor and response viewer.
          </p>
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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Request Builder */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Request Builder</CardTitle>
                  <CardDescription>Configure your API request</CardDescription>
                </div>
                <select
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-48 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="receipts">Parse Receipt</option>
                  <option value="reconcile">Reconciliation Job</option>
                  <option value="flags">Feature Flag</option>
                </select>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="method">Method</Label>
                  <select
                    id="method"
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>
                <div className="col-span-3">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="/api/v1/endpoint"
                    className="font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="name">Request Name (optional)</Label>
                <Input
                  id="name"
                  value={requestName}
                  onChange={(e) => setRequestName(e.target.value)}
                  placeholder="My API Request"
                />
              </div>

              {method !== 'GET' && (
                <div>
                  <Label>Request Body (JSON)</Label>
                  <CodeEditor
                    value={body || ''}
                    onChange={setBody}
                    language="json"
                    height="300px"
                    placeholder='{\n  "key": "value"\n}'
                  />
                </div>
              )}

              <div className="space-y-2">
                <Button 
                  onClick={() => handleRun(0)} 
                  disabled={isRunning || !url || (requestLimit !== -1 && requestCount >= requestLimit)}
                  className="w-full"
                  size="lg"
                  aria-label="Execute API request"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Run Request
                    </>
                  )}
                </Button>
                {requestLimit !== -1 && requestCount >= requestLimit && (
                  <p className="text-xs text-center text-amber-600 dark:text-amber-400">
                    Daily limit reached. <Link href="/console/billing" className="underline">Upgrade for more</Link>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Response Viewer */}
          {(request || response || error) && (
            <RequestResponseViewer
              request={request}
              response={response}
              error={error}
            />
          )}
        </div>

        {/* History Sidebar */}
        <div className="space-y-6">
          <FeatureGate
            feature="request-history"
            requiredTier="free"
            currentTier={subscriptionTier}
            upgradeMessage="Sign in to save your request history"
            featureDescription="Save and reload your API requests for faster testing and debugging."
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Request History
                </CardTitle>
                <CardDescription>
                  Recently executed requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    No requests yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer group"
                        onClick={() => loadHistoryItem(item)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {item.method}
                              </Badge>
                              <span className="text-sm font-medium truncate">
                                {item.name}
                              </span>
                            </div>
                            <code className="text-xs text-slate-500 dark:text-slate-400 truncate block">
                              {item.url}
                            </code>
                            <span className="text-xs text-slate-400 mt-1 block">
                              {item.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteHistoryItem(item.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </FeatureGate>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setMethod('GET');
                  setUrl('/api/v1/receipts');
                  setBody('');
                }}
              >
                List Receipts
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setMethod('GET');
                  setUrl('/api/v1/recon/jobs');
                  setBody('');
                }}
              >
                List Jobs
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setMethod('GET');
                  setUrl('/api/v1/feature-flags');
                  setBody('');
                }}
              >
                List Flags
              </Button>
            </CardContent>
          </Card>

          {/* Upgrade Prompt for Free/Unauthenticated */}
          {subscriptionTier !== 'pro' && subscriptionTier !== 'enterprise' && (
            <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-900/10 dark:to-pink-900/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Unlock Advanced Features
                </CardTitle>
                <CardDescription>
                  Upgrade to Pro for unlimited requests and advanced features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    Unlimited playground requests
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    Custom request templates
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    Advanced debugging tools
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    Webhook testing
                  </li>
                </ul>
                <Button asChild className="w-full" size="lg">
                  <Link href="/console/billing">
                    Upgrade to Pro
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
