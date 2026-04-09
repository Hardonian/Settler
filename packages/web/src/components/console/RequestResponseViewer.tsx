/**
 * Request/Response Viewer Component
 *
 * Displays formatted request and response data with syntax highlighting.
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/CopyButton";
import { CheckCircle2, XCircle, Clock, Code, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface RequestResponseViewerProps {
  request?: {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    body?: unknown;
  };
  response?: {
    status?: number;
    statusText?: string;
    headers?: Record<string, string>;
    body?: unknown;
    duration?: number;
  };
  error?: {
    message: string;
    code?: string;
  };
  className?: string;
}

const formatJSON = (obj: unknown): string => {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
};

const getStatusColor = (status?: number) => {
  if (!status) return "bg-muted/100";
  if (status >= 200 && status < 300) return "bg-green-500";
  if (status >= 300 && status < 400) return "bg-blue-500";
  if (status >= 400 && status < 500) return "bg-yellow-500";
  return "bg-red-500";
};

export type { RequestResponseViewerProps };

export function RequestResponseViewer({
  request,
  response,
  error,
  className,
}: RequestResponseViewerProps) {
  const [selectedTab, setSelectedTab] = useState<"request" | "response" | "error">(
    error ? "error" : response ? "response" : "request"
  );

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Request & Response
          </CardTitle>
          {response && (
            <Badge className={cn("text-white", getStatusColor(response.status))}>
              {response.status} {response.statusText}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as typeof selectedTab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="request" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Request
            </TabsTrigger>
            <TabsTrigger value="response" className="flex items-center gap-2">
              {response?.status && response.status >= 200 && response.status < 300 ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              Response
            </TabsTrigger>
            {error && (
              <TabsTrigger value="error" className="flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Error
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="request" className="mt-4">
            {request ? (
              <div className="space-y-4">
                {request.method && request.url && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{request.method}</Badge>
                      <code className="text-sm font-mono text-muted-foreground leading-[1.5]">
                        {request.url}
                      </code>
                    </div>
                  </div>
                )}
                {request.headers && Object.keys(request.headers).length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Headers:</p>
                    <div className="relative">
                      <pre className="p-3 bg-card dark:bg-card text-foreground dark:text-muted-foreground/30 rounded text-xs overflow-x-auto leading-[1.5]">
                        <code className="font-mono">{formatJSON(request.headers)}</code>
                      </pre>
                      <CopyButton
                        text={formatJSON(request.headers)}
                        className="absolute top-1 right-1"
                        size="sm"
                      />
                    </div>
                  </div>
                )}
                {request.body != null && (
                  <div>
                    <p className="text-sm font-medium mb-2">Body:</p>
                    <div className="relative">
                      <pre
                        className="p-3 bg-card dark:bg-card text-foreground dark:text-muted-foreground/30 rounded text-xs overflow-x-auto max-h-96 overflow-y-auto leading-[1.5]"
                        role="log"
                        aria-label="Request body"
                      >
                        <code className="font-mono">{String(formatJSON(request.body))}</code>
                      </pre>
                      <CopyButton
                        text={formatJSON(request.body)}
                        className="absolute top-1 right-1"
                        size="sm"
                        aria-label="Copy request body"
                      />
                    </div>
                    {formatJSON(request.body).length > 10000 && (
                      <p className="text-xs text-muted-foreground mt-2 leading-[1.5]">
                        Large request ({formatJSON(request.body).length.toLocaleString()}{" "}
                        characters)
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm leading-[1.5]">
                No request data available
              </div>
            )}
          </TabsContent>

          <TabsContent value="response" className="mt-4">
            {response ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  {response.status && (
                    <div className="flex items-center gap-2">
                      <Badge className={cn("text-white", getStatusColor(response.status))}>
                        {response.status}
                      </Badge>
                      <span className="text-muted-foreground leading-[1.5]">
                        {response.statusText}
                      </span>
                    </div>
                  )}
                  {response.duration && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{response.duration}ms</span>
                    </div>
                  )}
                </div>
                {response.headers && Object.keys(response.headers).length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Headers:</p>
                    <div className="relative">
                      <pre className="p-3 bg-card dark:bg-card text-foreground dark:text-muted-foreground/30 rounded text-xs overflow-x-auto leading-[1.5]">
                        <code className="font-mono">{formatJSON(response.headers)}</code>
                      </pre>
                      <CopyButton
                        text={formatJSON(response.headers)}
                        className="absolute top-1 right-1"
                        size="sm"
                      />
                    </div>
                  </div>
                )}
                {response.body != null && (
                  <div>
                    <p className="text-sm font-medium mb-2">Body:</p>
                    <div className="relative">
                      <pre
                        className="p-3 bg-card dark:bg-card text-foreground dark:text-muted-foreground/30 rounded text-xs overflow-x-auto max-h-96 overflow-y-auto leading-[1.5]"
                        role="log"
                        aria-label="Response body"
                      >
                        <code className="font-mono">{String(formatJSON(response.body))}</code>
                      </pre>
                      <CopyButton
                        text={formatJSON(response.body)}
                        className="absolute top-1 right-1"
                        size="sm"
                        aria-label="Copy response body"
                      />
                    </div>
                    {formatJSON(response.body).length > 10000 && (
                      <p className="text-xs text-muted-foreground mt-2 leading-[1.5]">
                        Large response ({formatJSON(response.body).length.toLocaleString()}{" "}
                        characters)
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm leading-[1.5]">
                No response data available
              </div>
            )}
          </TabsContent>

          {error && (
            <TabsContent value="error" className="mt-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-red-900 dark:text-red-200 mb-1 leading-[1.5]">
                      {error.message}
                    </p>
                    {error.code && (
                      <p className="text-sm text-red-700 dark:text-red-300 font-mono leading-[1.5]">
                        Code: {error.code}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
