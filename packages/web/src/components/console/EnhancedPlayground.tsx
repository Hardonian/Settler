/**
 * Enhanced API Playground
 * 
 * Interactive playground with:
 * - Code generation
 * - Request builder
 * - Response viewer
 * - History
 * - Examples
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CodeEditor } from './CodeEditor';
import { RequestResponseViewer } from './RequestResponseViewer';
import { CodeGenerator } from './CodeGenerator';
import { Play, Loader2 } from 'lucide-react';
import { ConsoleErrorBoundary } from './ErrorBoundary';
import { appLogger } from '@/lib/utils/logger';
import { tryParseJson } from '@/lib/safe-json';

interface ApiCall {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  headers?: Record<string, string>;
  body?: unknown;
}

export function EnhancedPlayground() {
  const [apiKey, setApiKey] = useState<string>('');
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>('POST');
  const [endpoint, setEndpoint] = useState('/api/v1/receipts');
  const [requestBody, setRequestBody] = useState('{\n  "fileUrl": "https://example.com/receipt.jpg"\n}');
  const [response, setResponse] = useState<{ status: number; data: unknown } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyHint, setApiKeyHint] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/console/api-keys')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json() as Promise<{ keys?: Array<{ keyPrefix?: string; revokedAt?: string | null }> }>;
      })
      .then((data) => {
        if (cancelled) return;
        const active = data.keys?.find((k) => !k.revokedAt);
        if (active?.keyPrefix) {
          setApiKeyHint(`Active key prefix: ${active.keyPrefix}… — paste the full secret to call the API.`);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Request failed';
        setApiKeyHint(`Could not load API key hints (${msg}). Paste your key manually.`);
        appLogger.warn('EnhancedPlayground: api-keys fetch failed', { message: msg });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleExecute = async () => {
    if (!apiKey) {
      setError('Please enter your API key');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const headers: Record<string, string> = {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      };

      let body: string | undefined;
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        try {
          body = JSON.stringify(JSON.parse(requestBody));
        } catch {
          setError('Invalid JSON in request body');
          setLoading(false);
          return;
        }
      }

      const res = await fetch(endpoint, {
        method,
        headers,
        body,
      });

      const data = await res.json().catch(() => ({ error: 'Failed to parse response' }));

      setResponse({
        status: res.status,
        data,
      });
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const parsedRequestBody =
    requestBody.trim().length > 0 ? tryParseJson(requestBody) : { ok: true as const, data: undefined };

  const apiCall: ApiCall = {
    method,
    endpoint,
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: parsedRequestBody.ok ? (parsedRequestBody.data as Record<string, unknown> | undefined) : undefined,
  };

  return (
    <ConsoleErrorBoundary>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 leading-[1.4]">
            API Playground
          </h1>
          <p className="text-muted-foreground leading-[1.5]">
            Test Settler APIs and generate code snippets instantly.
          </p>
        </div>

        {/* API Key Input */}
        <Card>
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
            <CardDescription>Enter your API key to test endpoints</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="api-key">API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="rk_..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1 leading-[1.5]">
                  Keys stay in this browser session only; requests go to the endpoint you configure.
                </p>
                {apiKeyHint && (
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-2 leading-[1.5]">
                    {apiKeyHint}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Request Builder */}
        <Card>
          <CardHeader>
            <CardTitle>Request Builder</CardTitle>
            <CardDescription>Configure your API request</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="method">Method</Label>
                  <select
                    id="method"
                    value={method}
                    onChange={(e) => setMethod(e.target.value as typeof method)}
                    className="w-full px-3 py-2 border rounded-md bg-white dark:bg-card/80 text-foreground leading-[1.5]"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="endpoint">Endpoint</Label>
                  <Input
                    id="endpoint"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    placeholder="/api/v1/..."
                  />
                </div>
              </div>

              {['POST', 'PUT', 'PATCH'].includes(method) && (
                <div>
                  <Label htmlFor="body">Request Body (JSON)</Label>
                  <CodeEditor
                    value={requestBody}
                    onChange={setRequestBody}
                    language="json"
                    height="200px"
                  />
                </div>
              )}

              <Button onClick={handleExecute} disabled={loading || !apiKey} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Execute Request
                  </>
                )}
              </Button>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-300 leading-[1.5]">{error}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Response Viewer */}
        {response && (
          <RequestResponseViewer
            request={{
              method,
              url: endpoint,
              headers: apiCall.headers,
              body: requestBody,
            }}
            response={{
              status: response.status,
              headers: {},
              body: response.data,
            }}
          />
        )}

        {/* Code Generator */}
        {apiKey && (
          <CodeGenerator apiCall={apiCall} apiKey={apiKey} />
        )}
      </div>
    </ConsoleErrorBoundary>
  );
}
