"use client";

import { useState } from "react";
import Link from "next/link";
import { Bug, Search, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DebugResult {
  error: string;
  solution: string;
  documentation: string;
  relatedErrors: string[];
}

interface IntegrationDebuggerProps {
  integrationId: string;
}

export function IntegrationDebugger({ integrationId }: IntegrationDebuggerProps) {
  const [errorMessage, setErrorMessage] = useState("");
  const [debugResult, setDebugResult] = useState<DebugResult | null>(null);
  const [searching, setSearching] = useState(false);

  const handleDebug = async () => {
    if (!errorMessage.trim()) return;

    setSearching(true);
    try {
      const response = await fetch(`/api/integrations/${integrationId}/debug`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: errorMessage }),
      });

      if (response.ok) {
        const result = await response.json();
        setDebugResult(result);
      }
    } catch (error) {
      console.error("Failed to debug:", error);
    } finally {
      setSearching(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="w-5 h-5" />
          Integration Debugger
        </CardTitle>
        <CardDescription>
          Troubleshoot integration-specific errors with AI-powered diagnostics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
            Error Message
          </label>
          <div className="flex items-center gap-2">
            <Input
              value={errorMessage}
              onChange={(e) => setErrorMessage(e.target.value)}
              placeholder="Paste error message here..."
              onKeyDown={(e) => e.key === "Enter" && handleDebug()}
            />
            <Button onClick={handleDebug} disabled={searching || !errorMessage.trim()}>
              <Search className="w-4 h-4 mr-2" />
              {searching ? "Debugging..." : "Debug"}
            </Button>
          </div>
        </div>

        {debugResult && (
          <Tabs defaultValue="solution">
            <TabsList>
              <TabsTrigger value="solution">Solution</TabsTrigger>
              <TabsTrigger value="documentation">Documentation</TabsTrigger>
              <TabsTrigger value="related">Related Errors</TabsTrigger>
            </TabsList>

            <TabsContent value="solution" className="mt-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                      Recommended Solution
                    </h4>
                    <p className="text-sm text-blue-800 dark:text-blue-400">
                      {debugResult.solution}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="documentation" className="mt-4">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Documentation</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {debugResult.documentation}
                </p>
                <Button asChild size="sm" variant="outline" className="mt-3">
                  <Link href={`/docs/integrations/${integrationId}`}>View Full Docs</Link>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="related" className="mt-4">
              <div className="space-y-2">
                {debugResult.relatedErrors.length > 0 ? (
                  debugResult.relatedErrors.map((error, index) => (
                    <div
                      key={index}
                      className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-slate-700 dark:text-slate-300">{error}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No related errors found
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
