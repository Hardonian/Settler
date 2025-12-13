/**
 * CLI Playground Component
 * 
 * Interactive CLI playground with code editor, request builder, and response viewer.
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Using native select for now - can be enhanced with a proper Select component later
import { Badge } from '@/components/ui/badge';
import { CodeEditor } from './CodeEditor';
import { RequestResponseViewer } from './RequestResponseViewer';
import { Terminal, Play, History, Save, Trash2, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export function CLIPlayground() {
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

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('settler-cli-history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved).map((h: any) => ({
          ...h,
          timestamp: new Date(h.timestamp),
        })));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Save history to localStorage
  const saveHistory = useCallback((newHistory: RequestHistory[]) => {
    localStorage.setItem('settler-cli-history', JSON.stringify(newHistory));
    setHistory(newHistory);
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

  const handleRun = async () => {
    setIsRunning(true);
    setError(undefined);
    setResponse(undefined);

    const startTime = Date.now();
    const requestData: RequestResponseViewerProps['request'] = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'rk_your_api_key',
      },
      body: body ? JSON.parse(body) : undefined,
    };

    setRequest(requestData);

    try {
      // In production, this would call the actual API
      // For now, simulate API call
      const res = await fetch(url.startsWith('/') ? url : `/api${url}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: method !== 'GET' && body ? body : undefined,
      });

      const duration = Date.now() - startTime;
      const responseData = await res.json().catch(() => ({}));

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        body: responseData,
        duration,
      });

      // Save to history
      if (requestName || url) {
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
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Terminal className="w-6 h-6" />
          CLI Playground
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Build and test API requests with an interactive code editor and response viewer.
        </p>
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

              <Button
                onClick={handleRun}
                disabled={isRunning || !url}
                className="w-full"
                size="lg"
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
        </div>
      </div>
    </div>
  );
}
