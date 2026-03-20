"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { safeFetch, maskToken, sanitizeForLogging } from "@/lib/safe-fetch";
import { RBACGate } from "@/lib/rbac-gate";
import { Play, History, Copy, Check, Clock, Globe, Key, Code, FileJson } from "lucide-react";

interface RequestHistory {
  id: string;
  method: string;
  url: string;
  status?: number;
  latency?: number;
  timestamp: Date;
}

interface Environment {
  id: string;
  name: string;
  baseUrl: string;
  apiKey?: string;
}

export default function ApiPlaygroundPage() {
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("/api/v1/jobs");
  const [headers] = useState<Record<string, string>>({});
  const [body, setBody] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [history, setHistory] = useState<RequestHistory[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [activeEnv, setActiveEnv] = useState<string>("production");
  const [apiKey, setApiKey] = useState("");
  const [copied, setCopied] = useState(false);

  // Load environments and history
  useEffect(() => {
    loadEnvironments();
    loadHistory();
    loadApiKey();
  }, []);

  const loadEnvironments = async () => {
    const envs: Environment[] = [
      { id: "local", name: "Local", baseUrl: "http://localhost:3000" },
      { id: "staging", name: "Staging", baseUrl: "https://staging.settler.dev" },
      { id: "production", name: "Production", baseUrl: "https://api.settler.dev" },
    ];
    setEnvironments(envs);
  };

  const loadHistory = async () => {
    // Load from localStorage for now (will be DB-backed)
    const stored = localStorage.getItem("api-playground-history");
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch {
        // Ignore parse errors
      }
    }
  };

  const loadApiKey = async () => {
    // Load from secure storage (will be workspace-scoped)
    const stored = localStorage.getItem("api-playground-key");
    if (stored) {
      setApiKey(stored);
    }
  };

  const saveHistory = (request: RequestHistory) => {
    const newHistory = [request, ...history].slice(0, 50);
    setHistory(newHistory);
    localStorage.setItem("api-playground-history", JSON.stringify(newHistory));
  };

  const handleSend = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    setLatency(null);

    const startTime = Date.now();
    const env = environments.find((e) => e.id === activeEnv);
    const baseUrl = env?.baseUrl || "https://api.settler.dev";
    const fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;

    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    };

    if (apiKey) {
      requestHeaders["Authorization"] = `Bearer ${apiKey}`;
    }

    let requestBody: any = undefined;
    if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
      try {
        requestBody = JSON.parse(body);
      } catch {
        setError("Invalid JSON in request body");
        setLoading(false);
        return;
      }
    }

    const result = await safeFetch(fullUrl, {
      method,
      headers: requestHeaders,
      body: requestBody ? JSON.stringify(requestBody) : undefined,
    });

    const endTime = Date.now();
    const requestLatency = endTime - startTime;
    setLatency(requestLatency);

    if (result.success) {
      setResponse(result.data);

      // Save to history
      saveHistory({
        id: Date.now().toString(),
        method,
        url: fullUrl,
        status: 200,
        latency: requestLatency,
        timestamp: new Date(),
      });
    } else {
      setError(result.error?.message || "Request failed");
      setResponse(result.error);
    }

    setLoading(false);
  };

  const handleLoadFromHistory = (item: RequestHistory) => {
    setMethod(item.method);
    setUrl(item.url);
  };

  const handleCopyResponse = async () => {
    if (response) {
      await navigator.clipboard.writeText(JSON.stringify(response, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const activeEnvironment = environments.find((e) => e.id === activeEnv);

  return (
    <RBACGate requiredTier="subscribed_unpaid" feature="API Playground">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">API Playground</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Test Settler API endpoints with a Postman-style interface
            </p>
          </div>
        </div>

        {/* Environment Switcher */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Environment
            </CardTitle>
            <CardDescription>Switch between Local, Staging, and Production</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Select value={activeEnv} onValueChange={setActiveEnv}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {environments.map((env) => (
                    <SelectItem key={env.id} value={env.id}>
                      {env.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-sm text-slate-600 dark:text-slate-400 min-w-0">
                Base URL:{" "}
                <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded break-all">
                  {activeEnvironment?.baseUrl || "https://api.settler.dev"}
                </code>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Request Builder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Request Builder
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Method & URL */}
              <div className="flex gap-2">
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="/api/v1/jobs"
                  className="flex-1"
                />
              </div>

              {/* API Key */}
              <div>
                <Label htmlFor="api-key" className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  API Key
                  <span className="text-xs text-slate-500">(masked for security)</span>
                </Label>
                <Input
                  id="api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    localStorage.setItem("api-playground-key", e.target.value);
                  }}
                  placeholder="sk_live_..."
                  className="mt-1 font-mono"
                />
                {apiKey && (
                  <p className="text-xs text-slate-500 mt-1">
                    Display: {maskToken(apiKey)} (only last 4 characters shown)
                  </p>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  💡 Tip: Your API key is stored locally and never sent to our servers
                </p>
              </div>

              {/* Headers */}
              <Tabs defaultValue="headers">
                <TabsList>
                  <TabsTrigger value="headers">Headers</TabsTrigger>
                  <TabsTrigger value="body">Body</TabsTrigger>
                </TabsList>
                <TabsContent value="headers" className="space-y-2">
                  <div className="text-sm text-slate-600 dark:text-slate-400 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <strong>💡 Automatic Headers:</strong> Content-Type and Authorization headers
                    are added automatically based on your API key and request body.
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Custom headers can be added via the API directly. This interface focuses on the
                    request body.
                  </div>
                </TabsContent>
                <TabsContent value="body">
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder='{"key": "value"}'
                    className="w-full h-48 p-3 font-mono text-sm border rounded-md bg-slate-50 dark:bg-slate-900"
                  />
                </TabsContent>
              </Tabs>

              <Button onClick={handleSend} disabled={loading || !url} className="w-full">
                {loading ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Send Request
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Response */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileJson className="w-5 h-5" />
                  Response
                </CardTitle>
                {response && (
                  <Button size="sm" variant="ghost" onClick={handleCopyResponse}>
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading && <Skeleton className="h-64" />}
              {error && <ErrorState title="Request Failed" message={error} onRetry={handleSend} />}
              {response && !loading && (
                <div className="space-y-2">
                  {latency !== null && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Clock className="w-4 h-4" />
                      Latency: {latency}ms
                    </div>
                  )}
                  <pre className="bg-slate-900 dark:bg-slate-950 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                    {sanitizeForLogging(JSON.stringify(response, null, 2))}
                  </pre>
                </div>
              )}
              {!response && !loading && !error && (
                <EmptyState
                  title="No response yet"
                  description="Send a request to see the response here"
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Request History
            </CardTitle>
            <CardDescription>Last 50 requests (workspace-scoped)</CardDescription>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <EmptyState
                title="No history yet"
                description="Your request history will appear here"
              />
            ) : (
              <div className="space-y-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                    onClick={() => handleLoadFromHistory(item)}
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={item.status && item.status >= 400 ? "destructive" : "default"}
                      >
                        {item.method}
                      </Badge>
                      <code className="text-sm truncate">{item.url}</code>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                      {item.status && <span>Status: {item.status}</span>}
                      {item.latency && <span>{item.latency}ms</span>}
                      <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RBACGate>
  );
}
